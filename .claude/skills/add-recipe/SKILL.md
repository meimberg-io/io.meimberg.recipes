---
name: add-recipe
description: Use when adding a new recipe to the Meimberg recipe app (io.meimberg.recipes) from a source — an Instagram link, a recipe URL, or pasted text. Extracts the recipe faithfully, creates the Notion page with the right properties (Intake defaults), follows the content conventions, and ALWAYS sets a Notion-hosted cover image. Triggers on "pflege das als Rezept/Intake ein", "füg das Rezept hinzu", "add this recipe", a pasted Instagram/recipe link with the intent to save it.
---

# Rezept einpflegen (Meimberg's Menu)

Rezepte leben in **Notion**, die App liest nur. Hintergrund (Schema, Notion-IDs,
Konventionen) steht in der Projekt-`CLAUDE.md` — bei Unklarheit dort nachschlagen.

## Ablauf

### 1. Rezept-Inhalt beschaffen (verbatim, Originalsprache)

- **Instagram** (`instagram.com/p/…` oder `/reel/…`): Direktabruf scheitert an der
  Login-Wall. Den **Caption-Embed** nutzen:
  `https://www.instagram.com/p/<ID>/embed/captioned/` → mit WebFetch die **komplette
  Caption verbatim** holen (Zutaten mit Mengen + Schritte, nicht übersetzen/kürzen).
- **Normale Rezept-URL**: WebFetch auf die Seite, Rezept extrahieren.
- **Vom User eingefügter Text**: direkt verwenden.

Inhalt **originalgetreu** übernehmen (Mengen, Reihenfolge, Sprache). Fehlen für eine
Zutatengruppe Mengen (z.B. „Kräuterbutter"), trotzdem so listen wie in der Quelle.

### 2. Notion-Seite anlegen

Mit `notion-create-pages`, **parent = data_source_id** der Rezepte-Collection
(`eddfc71c-2dca-4502-89bd-2685a6135fb3`).

Properties (Intake-Standard, sofort sichtbar):
- `Name` = Rezeptname
- `Kategorie` = `"Intake"`
- `Status` = `"Idea"`
- `Speisekarte` = `"__YES__"`  (sonst kein App-Tab)
- `Kurzbeschreibung` = Ein-Satz-Teaser
- `Vegetarisch` = wenn zutreffend (`"Vegetarisch"` / `"Teilvegetarisch"` / `"Vegatarische Variante"` — Tippfehler beibehalten)
- `userDefined:URL` = Quell-Link (Property MUSS so heißen)
- `Tags` = nur wenn klar passend

`icon` = passendes Emoji (Länderflagge nach Küche, sonst Food-Emoji).

**Content** (Notion-flavored Markdown, Titel NICHT in den Content):
```
# Zutaten
- <Menge> <Zutat>
### <Untergruppe>   ← optional, für Sub-Zutaten/-Schritte (H3)
- ...

# Zubereitung
1. **<Schritt-Lead>:** <Beschreibung>
```
Erlaubt: verschachtelte Bullets (Tab), `---`, `**fett**`,
`<callout icon="💡" color="gray_bg">…</callout>` für Hintergrund/Tipps,
Links auf andere Rezepte (`https://recipes.meimberg.io/recipes/<slug>`).
Bei komplexem Content vorher die MCP-Resource `notion://docs/enhanced-markdown-spec` lesen.

### 3. Cover-Bild setzen — IMMER, und in Notion gehostet

**Kein** externes Cover (läuft ab / wird live nachgeladen). Stattdessen das Bild
**herunterladen und in Notion hochladen** — dann hostet Notion es dauerhaft (wie bei
den bestehenden Rezepten; der image-proxy der App refresht die S3-URL).

Helfer-Skript (aus dem Repo-Root, findet `node_modules` + `.env`):
```bash
# aus einem Instagram-Post (zieht og:image automatisch):
node .claude/skills/add-recipe/set-notion-cover.mjs \
  --page <pageId> --instagram <postUrl> --filename <slug>.jpg

# aus einer direkten Bild-URL:
node .claude/skills/add-recipe/set-notion-cover.mjs \
  --page <pageId> --image-url <url> --filename <slug>.jpg
```
Danach prüfen: `cover.type` muss `file` sein (nicht `external`), Host
`prod-files-secure.s3…` (= Notion-gehostet).

**Instagram-Reels** (`/reel/…` oder Video-Posts): Das `og:image` ist die Share-Karte
**mit eingebranntem Play-Button** — als Cover unschön. Einen sauberen Frame gibt der
Reel öffentlich nicht her. Dann: ein passendes Foto aus einer **anderen Quelle**
(Rezept-Blog-Hero-Bild via dessen `og:image`, `--image-url`) nehmen oder den User um
ein Bild bitten. Vorher kurz rückfragen (fremdes Foto/Urheberrecht). Normale Foto-Posts
sind unkritisch.

**Cover ERSETZEN:** next/image cached das optimierte Bild pro Proxy-URL (= Slug, 1 Jahr).
Bei gleichem Slug zeigt die App sonst das alte Bild. Lokal: `rm -rf .next/cache/images`
(Dev-Server zeigt dann das neue). Deployt: greift erst nach Cache-Ablauf / Neudeploy.

### 4. Sichtbarkeit / Verifikation

- Lokal (Dev): `http://localhost:3000/intake` neu laden → Rezept + Cover sichtbar.
  Schnellcheck: `curl -s http://localhost:3000/intake | grep "<Name>"`.
- Deployt: ISR mit 1-Jahr-Cache → `/api/revalidate` (Secret `REVALIDATE_SECRET`)
  anstoßen oder neu bauen.

## Wichtig

- **Originalgetreu** bleiben — nichts dazuerfinden. Fehlende Mengen so lassen wie in der Quelle.
- Cover **immer** setzen und **immer** in Notion hosten (Schritt 3).
- Quell-Link in `userDefined:URL` hinterlegen.
- Bei Unklarheit (Sichtbarkeit, Kategorie) kurz beim User rückfragen.
