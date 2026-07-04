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

def main():
    args = sys.argv[1:]
    if not args:
        sys.exit("Usage: extract_recipe_gemini.py <video-url|datei> [--keep <pfad>]")
    src = args[0]
    keep = args[args.index("--keep") + 1] if "--keep" in args else None
    key = load_key()
    tmp = keep or os.path.join(tempfile.mkdtemp(), "video.mp4")

    # 1) Beschaffen
    if os.path.exists(src):
        tmp = src
    elif re.match(r'https?://[^ ]*\.(mp4|mov|webm)(\?|$)', src, re.I) or "prod-files-secure" in src:
        print("… lade Datei direkt", file=sys.stderr)
        urllib.request.urlretrieve(src, tmp)
    else:
        print("… lade Video via yt-dlp", file=sys.stderr)
        r = subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings",
                            "-f", "mp4/best", "-o", tmp, src], capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(tmp):
            sys.exit(f"Download fehlgeschlagen:\n{r.stderr[-800:]}")
    print(f"… Datei: {os.path.getsize(tmp)} bytes", file=sys.stderr)

    # 2) Gemini
    from google import genai
    client = genai.Client(api_key=key)
    print("… upload zu Gemini", file=sys.stderr)
    f = client.files.upload(file=tmp)
    while f.state.name == "PROCESSING":
        time.sleep(2); f = client.files.get(name=f.name)
    if f.state.name != "ACTIVE":
        sys.exit(f"Gemini file state: {f.state.name}")

    prompt = """Extrahiere das Rezept aus diesem Koch-Video (eingeblendeter Text UND gesprochener Inhalt).
Antworte auf DEUTSCH. Mengen metrisch (g/ml, °C; tsp->TL, tbsp->EL, cups/oz/lb->g/ml).
Nur was tatsächlich vorkommt – nichts erfinden. Schritte knapp und korrekt.
Gib NUR JSON zurück:
{"name": str, "kurzbeschreibung": str, "vegetarisch": "Vegetarisch"|"Teilvegetarisch"|null,
 "portionen": str|null, "zutaten": [{"gruppe": str|null, "items": [str,...]}], "zubereitung": [str,...],
 "kein_rezept": bool}
Setze "kein_rezept": true, wenn das Video kein nachkochbares Rezept zeigt."""

    print("… extrahiere", file=sys.stderr)
    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[f, prompt],
        config={"response_mime_type": "application/json"},
    )
    print(resp.text)

if __name__ == "__main__":
    main()
