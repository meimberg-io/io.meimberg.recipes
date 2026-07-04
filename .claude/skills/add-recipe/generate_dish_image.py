#!/usr/bin/env python3
"""Erzeugt ein appetitliches Food-Foto eines Gerichts mit Gemini (Bildmodell).

Nimmt Titel + Rezept (JSON wie von extract_recipe_gemini.py) und generiert ein
fotorealistisches Bild des fertigen Gerichts. Speichert PNG nach --out.

Usage:
  <venv>/bin/python generate_dish_image.py --json <recipe.json> --out <bild.png>
  <venv>/bin/python generate_dish_image.py --title "..." --hint "kurze Beschreibung" --out <bild.png>
GEMINI_API_KEY aus .env im CWD."""
import os, sys, re, json, pathlib

def load_key():
    if os.environ.get("GEMINI_API_KEY"):
        return os.environ["GEMINI_API_KEY"]
    for line in (pathlib.Path.cwd() / ".env").read_text().splitlines():
        m = re.match(r'^GEMINI_API_KEY=(.+)$', line.strip())
        if m:
            return m.group(1).strip()
    sys.exit("GEMINI_API_KEY nicht gefunden")

def arg(name, default=None):
    a = sys.argv
    return a[a.index(name)+1] if name in a else default

def main():
    out = arg("--out")
    if not out:
        sys.exit("--out fehlt")
    title = arg("--title")
    hint = arg("--hint", "")
    jf = arg("--json")
    if jf:
        d = json.loads(pathlib.Path(jf).read_text())
        title = title or d.get("name")
        zut = ", ".join(i for g in (d.get("zutaten") or []) for i in (g.get("items") or []))[:400]
        hint = hint or (d.get("kurzbeschreibung") or "") + " Zutaten: " + zut
    if not title:
        sys.exit("kein Titel")

    prompt = (
        f"Ein appetitliches, fotorealistisches Food-Foto des fertig angerichteten Gerichts „{title}“. "
        f"{hint}. "
        "Professionelle Food-Fotografie, natürliches Licht, schön auf Teller oder Schale angerichtet, "
        "leichter 45-Grad-Winkel, geringe Schärfentiefe, appetitlich und realistisch. "
        "KEINE Texteinblendungen, keine Schrift, keine Hände, kein Wasserzeichen, kein Rezept, keine Collage."
    )
    extra = arg("--extra")
    if extra:
        prompt += " " + extra

    from google import genai
    client = genai.Client(api_key=load_key())
    print(f"… generiere Bild: {title}", file=sys.stderr)
    resp = client.models.generate_content(model="gemini-2.5-flash-image", contents=prompt)
    data = None
    for part in resp.candidates[0].content.parts:
        if getattr(part, "inline_data", None) and part.inline_data.data:
            data = part.inline_data.data
            break
    if not data:
        txt = "".join(getattr(p, "text", "") or "" for p in resp.candidates[0].content.parts)
        sys.exit(f"Kein Bild erhalten. Antwort: {txt[:300]}")
    pathlib.Path(out).write_bytes(data)
    print(f"✅ gespeichert: {out} ({len(data)} bytes)")

if __name__ == "__main__":
    main()
