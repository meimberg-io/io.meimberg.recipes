---
name: add-recipe
description: Use when adding a new recipe to the Meimberg recipe app (io.meimberg.recipes) from any source — Instagram/TikTok/YouTube link, recipe URL, cookbook photo, PDF, or pasted text. Extracts the recipe faithfully (German + metric), creates the Notion page with the right properties (Kategorie „Ideen", früher „Intake"), and ALWAYS sets a Notion-hosted cover image (real photo or Gemini-generated). Triggers on "pflege das als Rezept/Ideen/Intake ein", "füg das Rezept hinzu", "add this recipe", a pasted recipe/social link with the intent to save it, or "importier die Rezeptideen".
---

# Rezept einpflegen (Meimberg's Menu)

Rezepte leben in **Notion**, die App liest nur. Schema, Notion-IDs und Content-Konventionen
stehen in der Projekt-`CLAUDE.md`. Data Source (parent zum Anlegen): `eddfc71c-2dca-4502-89bd-2685a6135fb3`.

Ablauf: **Inhalt beschaffen → auf Deutsch/metrisch übertragen → Notion-Seite anlegen → Cover setzen → prüfen.**
Beim Import aus der „Rezeptideen"-DB zusätzlich: Ideen-Seite nach Erfolg in den Papierkorb.

## Einmaliges Setup (für Gemini-gestützte Extraktion & Cover)

- **`GEMINI_API_KEY`** in die `.env` legen. Key kommt aus **Google AI Studio**
  (`https://aistudio.google.com/apikey`), NICHT aus der Cloud Console. Free-Tier reicht;
  Imagen/Video/Bild laufen über denselben Key.
- **venv** mit den nötigen Paketen:
  ```bash
  python3 -m venv .venv && .venv/bin/pip install yt-dlp google-genai
  ```
- Verwendete Modelle (zentral in den Skripten, leicht änderbar):
  - Extraktion (Video/Foto/PDF/Text → Rezept): **`gemini-2.5-flash`**
  - Cover-Generierung: **`gemini-3-pro-image`** („Nano Banana Pro", bestes Foto-Realismus-Modell,
    wie in der Gemini-App). Fallback `gemini-2.5-flash-image`.
- `ffmpeg` (für Video-Standbild-Cover) muss im PATH sein.

## 1. Rezept-Inhalt beschaffen

**Zuerst den Seiten-Inhalt prüfen, nicht nur die URL.** Viele „Rezeptideen"-Seiten sind
Notion-Webclipper-Speicherungen: das **volle Rezept steht im Seiten-Text**, auch wenn die
Quell-URL längst tot ist. Also immer die Notion-Blöcke (Text + angehängte Bilder/Videos/PDFs)
ansehen, bevor man die (evtl. tote) URL abruft.

Quelle → Methode:

| Quelle | Vorgehen |
|---|---|
| **Text schon auf der Seite** (Webclipper) / vom User eingefügt | direkt verwenden |
| **Normale Rezept-URL** | `WebFetch`. Bei 403/leer/JS-Shell → **Browser** (s.u.) |
| **Blockierte DE-Domains** (chefkoch, focus, wikihow, lecker, essen-und-trinken teils …) | WebFetch schlägt fehl → **verbundener Browser**: `navigate` + `get_page_text` (Desktop-URL statt `mobile.`/`m.`) |
| **Instagram** (`/p/…`, `/reel/…`) | Caption-Embed `https://www.instagram.com/p/<ID>/embed/captioned/` mit WebFetch (komplette Caption verbatim). Steckt das Rezept nur im Video → Gemini |
| **TikTok** | `vm.tiktok.com`-Kurzlink mit `curl -sIL` auflösen; Caption+Autor+Thumbnail via `https://www.tiktok.com/oembed?url=<clean-url>` (Rezept oft im `title`, manchmal nur ein Blog-Link). Sonst Video → Gemini |
| **YouTube** | Beschreibung enthält oft das Rezept: rohes HTML per `curl` holen, `"shortDescription":"…"` extrahieren. Sonst Video → Gemini |
| **Video-only** (TikTok/Reel/YouTube/fb.watch/**Notion-mp4-Anhang**) | **Gemini** (s. `extract_recipe_gemini.py`) |
| **Kochbuch-Foto / Rezept-Bild** | **Gemini-Bild-OCR** (`extract_recipe_gemini.py` mit `--title`, falls zwei Rezepte auf einem Foto) |
| **PDF-Anhang** | **Gemini** (`extract_recipe_gemini.py` mit der PDF-URL) |
| **Verrauschter Artikel-Clip** (viel Navigation/Kommentare) | Seitentext dumpen und `extract_recipe_gemini.py --text <datei>` (filtert Nav/Werbung/Kommentare) |

### Gemini-Extraktion (`extract_recipe_gemini.py`)

Aus dem Repo-Root ausführen (findet `.env`). Gibt Rezept-JSON auf stdout aus
(`{name, kurzbeschreibung, vegetarisch, portionen, zutaten:[{gruppe,items}], zubereitung:[…], kein_rezept}`):
```bash
.venv/bin/python .claude/skills/add-recipe/extract_recipe_gemini.py <url|datei> --keep /tmp/v.mp4   # Video (yt-dlp) / .mp4-/PDF-/Bild-URL
.venv/bin/python .claude/skills/add-recipe/extract_recipe_gemini.py <bild-url> --title "<Rezeptname>" # Kochbuchseite (OCR)
.venv/bin/python .claude/skills/add-recipe/extract_recipe_gemini.py --text /tmp/page.txt             # verrauschter Text
```
- Notion-gehostete Medien (`prod-files-secure…`): erst die **frische signierte URL** aus dem
  Block holen (läuft nach Minuten ab), dann direkt übergeben.
- **Instagram-Reels**: yt-dlp scheitert ohne Login („Instagram sent an empty media response").
  Reel vorher separat mit Browser-Cookies laden, dann die lokale Datei an das Skript geben:
  `.venv/bin/yt-dlp --cookies-from-browser chrome -f mp4/best -o /tmp/reel.mp4 <reel-url>`
  → `extract_recipe_gemini.py /tmp/reel.mp4`. Dieselbe `/tmp/reel.mp4` liefert per ffmpeg auch das
  Cover-Standbild (Prio 3), spart den zweiten Download.
- `"kein_rezept": true` → überspringen (kein nachkochbares Rezept, z.B. reines Dish-Foto oder
  Teaser-Reel „Rezept folgt im nächsten Video").

### Browser (Claude in Chrome)

Für WebFetch-blockierte/JS-Seiten: `list_connected_browsers` prüfen; `navigate` zur URL,
dann `get_page_text`. Cookie-Banner ggf. wegklicken. Bei `mobile.`/`m.`-Domains die
Desktop-Variante probieren (z.B. `mobile.chefkoch.de/rezepte/mID/…` → `www.chefkoch.de/rezepte/ID/…`).
Reines **gesprochenes** Video-Rezept ohne Text bekommt der Browser nicht — dafür Gemini.

### Sprache & Einheiten (immer)

**Immer ins Deutsche übertragen** (auch englische/andere Quellen) und **Mengen metrisch**:
cups/oz/lb → g bzw. ml, °F → °C; `tsp` → `TL`, `tbsp` → `EL`. Nur Sprache + Einheiten anpassen —
inhaltlich nichts dazuerfinden/weglassen, Reihenfolge/Schritte bleiben. Fehlen für eine
Zutatengruppe Mengen, trotzdem so listen wie in der Quelle (per Callout „Mengen im Original
nicht angegeben" kennzeichnen). Fehlen nur die *Schritte* (Zutaten sind da), dürfen sie
sinngemäß ergänzt und per Callout gekennzeichnet werden — sonst **nicht erfinden**.

## 2. Notion-Seite anlegen

Mit `notion-create-pages`, **parent = data_source_id** `eddfc71c-2dca-4502-89bd-2685a6135fb3`.
(Bei vielen auf einmal effizienter direkt über das SDK: `pages.create` mit `heading_1`/`heading_3`/
`bulleted_list_item`/`numbered_list_item`-Blöcken aus dem Rezept-JSON.)

Properties (Standard „Ideen"-Eingangskorb, sofort sichtbar):
- `Name` = Rezeptname (Titel NICHT in den Content)
- `Kategorie` = `"Ideen"` (früher „Intake"; steuert den „Ideen"-Tab)
- `Status` = `"Idea"`
- `Speisekarte` = `"__YES__"` (sonst erscheint es in KEINEM App-Tab)
- `Kurzbeschreibung` = Ein-Satz-Teaser
- `Vegetarisch` = wenn zutreffend (`"Vegetarisch"` / `"Teilvegetarisch"` / `"Vegatarische Variante"` — Notion-Tippfehler beibehalten)
- `userDefined:URL` = Quell-Link (Property MUSS so heißen)
- `Tags` = nur wenn klar passend (z.B. `China` für chinesische Gerichte, `Thermomix` bei Mixtopf-Rezepten). Bestehende Tags beim Update **mergen**, nicht überschreiben.

`icon` = passendes Emoji (Länderflagge nach Küche, sonst Food-Emoji). **Nur breit unterstützte
Emojis** — Notion lehnt sehr neue (z.B. 🫛) als Icon mit Validierungsfehler ab; im Zweifel ein
etabliertes nehmen (🍜 🥟 🥩 🍗 🍰 …).

**Content** (Notion-flavored Markdown):
```
# Zutaten
- <Menge> <Zutat>
### <Untergruppe>   ← optional (H3), z.B. „Sauce" / „Teig"
- ...

# Zubereitung
1. **<Schritt-Lead>:** <Beschreibung>
```
Erlaubt: verschachtelte Bullets (Tab), `---`, `**fett**`,
`<callout icon="💡" color="gray_bg">…</callout>` für Hintergrund/Hinweise,
Links auf andere Rezepte (`https://recipes.meimberg.io/recipes/<slug>`).
Bei komplexem Content vorher die MCP-Resource `notion://docs/enhanced-markdown-spec` lesen.

## 3. Cover-Bild setzen — IMMER, und in Notion gehostet

**Nie ein externes Cover** (läuft ab / wird live nachgeladen). Bild besorgen → per
`set-notion-cover.mjs` in Notion hochladen (der image-proxy der App refresht nur Notion-gehostete URLs).
Cover-Quelle in dieser Priorität:

1. **Echtes Dish-Foto auf der Ideen-Seite** (Blog-/Social-Bild) → dessen frische Notion-S3-URL
   herunterladen und per `--file` re-hosten.
2. **Blog-Hero-Foto** (`og:image`) — auch von WebFetch-blockierten Seiten holbar per
   `curl -A "facebookexternalhit/1.1" <url> | grep og:image`; dann `--image-url`.
3. **Video-Standbild** (kein Play-Button): `ffmpeg -ss <~85% Laufzeit> -i v.mp4 -frames:v 1 f.jpg`, dann `--file`.
4. **Gemini-generiert**, wenn kein gutes Foto da ist (Kochbuchseite, Play-Button-Thumbnail, gar kein Bild):
   ```bash
   .venv/bin/python .claude/skills/add-recipe/generate_dish_image.py --json <recipe.json> --out /tmp/dish.png
   # oder: --title "<Name>" --hint "<kurze Beschreibung>"   ·   --extra "…" für mehr Realismus
   node .claude/skills/add-recipe/set-notion-cover.mjs --page <id> --file /tmp/dish.png
   ```

`set-notion-cover.mjs` (aus Repo-Root; lädt herunter → Notion-File-Upload → setzt Cover):
```bash
node .claude/skills/add-recipe/set-notion-cover.mjs --page <id> --instagram <postUrl>   # zieht og:image
node .claude/skills/add-recipe/set-notion-cover.mjs --page <id> --image-url <url>
node .claude/skills/add-recipe/set-notion-cover.mjs --page <id> --file <lokale-datei>
```
Danach prüfen: `cover.type` = `file` (nicht `external`), Host `prod-files-secure.s3…`.

**Instagram-Reels**: das `og:image` hat den **Play-Button eingebrannt** — als Cover unschön →
Blog-Foto oder Gemini nehmen (vorher kurz rückfragen, wenn es ein fremdes Foto eines nur ähnlichen
Gerichts ist). Normale Foto-Posts sind unkritisch.

**Cover ERSETZEN**: next/image cached pro Proxy-URL (= Slug, 1 Jahr). Lokal `rm -rf .next/cache/images`,
damit das neue Bild erscheint; deployt greift es erst nach Cache-Ablauf / Neudeploy.

## 4. Sichtbarkeit / Verifikation

- Lokal (Dev): `http://localhost:3000/ideen` neu laden (Port ggf. anders, wenn 3000 belegt ist —
  eigenen Dev-Server auf freiem Port starten). Schnellcheck: `curl -s http://localhost:3000/ideen | grep "<Name>"`.
- Deployt: ISR mit 1-Jahr-Cache → `POST /api/revalidate` (Secret `REVALIDATE_SECRET`) oder Neubau.

## Ganzen „Rezeptideen"-Eingangskorb abarbeiten?

Für die **Sammel-Aufgabe** (alle Ideen der „Rezeptideen"-DB in einem Rutsch) gibt es den eigenen
Skill **`import-rezeptideen`** — er orchestriert Inventur → Triage → Batch → Aufräumen und wendet
diesen `add-recipe`-Flow pro Idee an.

## Wichtig

- **Immer Deutsch**, Mengen **metrisch**. Inhaltlich originalgetreu — nichts dazuerfinden/weglassen (ergänzte Schritte per Callout kennzeichnen).
- Cover **immer** setzen und **immer** in Notion hosten.
- `userDefined:URL` = Quelle hinterlegen.
- Zuerst Seiten-Inhalt prüfen, nicht nur die (evtl. tote) URL.
- Bei Unklarheit (Sichtbarkeit, Kategorie, fremdes Cover-Foto) kurz beim User rückfragen.
