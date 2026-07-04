#!/usr/bin/env python3
"""Video -> Rezept via Gemini.

Lädt ein Video (TikTok/Reel/YouTube-URL ODER lokale/entfernte Datei) und lässt
Gemini das Rezept extrahieren (Deutsch, metrisch). Gibt JSON auf stdout aus.

Voraussetzungen:
  - GEMINI_API_KEY in der .env im CWD (oder als Umgebungsvariable)
  - Ausführen mit einem Python, das `yt_dlp` und `google-genai` installiert hat
    (z.B. eine venv: python -m venv .venv && .venv/bin/pip install yt-dlp google-genai)
  - ffmpeg im PATH (nur für die Cover-Frame-Extraktion, separat)

Usage:
  <venv>/bin/python extract_recipe_gemini.py <video-url|datei>  [--keep <pfad.mp4>]
Für Notion-gehostete .mp4: einfach die (frische, signierte) S3-URL übergeben."""
import os, sys, re, json, time, subprocess, pathlib, tempfile, urllib.request

def load_key():
    if os.environ.get("GEMINI_API_KEY"):
        return os.environ["GEMINI_API_KEY"]
    try:
        for line in (pathlib.Path.cwd() / ".env").read_text().splitlines():
            m = re.match(r'^GEMINI_API_KEY=(.+)$', line.strip())
            if m:
                return m.group(1).strip()
    except FileNotFoundError:
        pass
    sys.exit("GEMINI_API_KEY nicht gefunden (env oder .env)")

def arg(name):
    a = sys.argv
    return a[a.index(name) + 1] if name in a else None

def main():
    args = sys.argv[1:]
    if not args:
        sys.exit("Usage: extract_recipe_gemini.py <video-url|datei>  |  --text <textdatei>   [--keep <pfad>] [--title <name>]")
    keep = arg("--keep")
    title = arg("--title")
    text_file = arg("--text")           # verrauschte Artikel-/Clip-Texte statt Medien
    src = args[0] if not args[0].startswith("--") else None
    key = load_key()

    prompt = """Extrahiere das EINE Hauptrezept aus dem Material (Koch-Video, Rezept-Foto/abfotografierte
Kochbuchseite mit Text zum Ablesen, PDF, oder aus einer Webseite kopierter Text). Bei Text: Navigation,
Kommentare, Werbung, verwandte Artikel und Newsletter ignorieren. Eingeblendeten/geschriebenen Text UND
gesprochenen Inhalt berücksichtigen.
Antworte auf DEUTSCH. Mengen metrisch (g/ml, °C; tsp->TL, tbsp->EL, cups/oz/lb->g/ml).
Nur was tatsächlich vorkommt – nichts erfinden. Schritte knapp und korrekt.
Gib NUR JSON zurück:
{"name": str, "kurzbeschreibung": str, "vegetarisch": "Vegetarisch"|"Teilvegetarisch"|null,
 "portionen": str|null, "zutaten": [{"gruppe": str|null, "items": [str,...]}], "zubereitung": [str,...],
 "kein_rezept": bool}
Setze "kein_rezept": true, wenn kein nachkochbares Rezept erkennbar ist."""
    if title:
        prompt += f"\nFalls mehrere Rezepte vorkommen, extrahiere NUR das mit dem Titel: „{title}“."

    from google import genai
    client = genai.Client(api_key=key)

    # --- Text-Modus: kopierten Webseiten-/Clip-Text direkt an Gemini ---
    if text_file:
        text = pathlib.Path(text_file).read_text()
        print("… extrahiere (Text)", file=sys.stderr)
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt + "\n\nTEXT:\n" + text[:20000]],
            config={"response_mime_type": "application/json"},
        )
        print(resp.text)
        return

    if not src:
        sys.exit("Keine Quelle: <url|datei> oder --text <textdatei> angeben")

    # --- Medien-Modus: Video/Bild/PDF beschaffen ---
    tmp = keep or os.path.join(tempfile.mkdtemp(), "media")
    if os.path.exists(src):
        tmp = src
    elif re.match(r'https?://[^ ]*\.(mp4|mov|webm|pdf|jpg|jpeg|png|webp)(\?|$)', src, re.I) or "prod-files-secure" in src:
        print("… lade Datei direkt", file=sys.stderr)
        urllib.request.urlretrieve(src, tmp)
    else:
        print("… lade Video via yt-dlp", file=sys.stderr)
        r = subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings",
                            "-f", "mp4/best", "-o", tmp, src], capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(tmp):
            sys.exit(f"Download fehlgeschlagen:\n{r.stderr[-800:]}")
    print(f"… Datei: {os.path.getsize(tmp)} bytes", file=sys.stderr)

    # Mime-Typ aus den ersten Bytes bestimmen (Gemini braucht ihn).
    head = open(tmp, "rb").read(16)
    if head[:8] == b"\x89PNG\r\n\x1a\n": mime = "image/png"
    elif head[:3] == b"\xff\xd8\xff": mime = "image/jpeg"
    elif head[:4] == b"RIFF" and b"WEBP" in head: mime = "image/webp"
    elif head[:4] == b"%PDF": mime = "application/pdf"
    elif head[4:8] == b"ftyp": mime = "video/mp4"
    else: mime = "video/mp4"

    print(f"… upload zu Gemini ({mime})", file=sys.stderr)
    f = client.files.upload(file=tmp, config={"mime_type": mime})
    while f.state.name == "PROCESSING":
        time.sleep(2); f = client.files.get(name=f.name)
    if f.state.name != "ACTIVE":
        sys.exit(f"Gemini file state: {f.state.name}")

    print("… extrahiere", file=sys.stderr)
    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[f, prompt],
        config={"response_mime_type": "application/json"},
    )
    print(resp.text)

if __name__ == "__main__":
    main()
