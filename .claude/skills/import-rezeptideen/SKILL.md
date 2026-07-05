---
name: import-rezeptideen
description: Use when the user wants to process the whole "Rezeptideen"-Eingangskorb in Notion at once — "Rezeptideen abarbeiten", "alle Rezeptideen importieren", "arbeite die Ideen ab", "importier die Rezeptideen", "alle in Rezeptideen". Batch-applies the add-recipe flow to every idea in the Rezeptideen-DB and cleans up (processed ideas → Papierkorb, junk listed). For a SINGLE recipe from a link/text/photo use `add-recipe` instead.
---

# Rezeptideen-Eingangskorb abarbeiten (Batch)

Wendet den `add-recipe`-Workflow auf **alle** Seiten der „Rezeptideen"-DB an: Rezept aus jeder
Idee extrahieren → als saubere Rezeptseite (Kategorie „Ideen") anlegen → Cover → erfolgreiche
Ideen in den Papierkorb; Nicht-Verwertbares überspringen und am Ende auflisten.

**Die Pro-Rezept-Mechanik (Extraktion je Quelle, Übersetzung/metrisch, Notion-Seite, Cover,
Gemini-Skripte) steht komplett im Skill `add-recipe` — hier NICHT duplizieren, sondern anwenden.**

Notion-Koordinaten:
- Ideen-DB (Quelle): data_source `0c48fe8a-5329-46e7-9cf4-b1da95310ed8`
- Rezepte-DB (Ziel): data_source `eddfc71c-2dca-4502-89bd-2685a6135fb3` (Kategorie `"Ideen"`)

## Ablauf

### 1. Inventur (erst schauen, was da ist)

Alle Ideen-Seiten mit **Name, URL und tatsächlichem Inhalt** (Textlänge, Bilder, Videos, PDF)
auflisten — **nicht nur die URL**, denn viele Seiten tragen das volle Rezept als geclippten
Seitentext oder als angehängtes Bild/Video/PDF (URL oft tot). Per SDK (paginiert, Notion liefert
max. 100/Query):
```bash
node -e "const {readFileSync}=require('fs');const {Client}=require('@notionhq/client');
const t=readFileSync('.env','utf8').match(/^NOTION_TOKEN=(.+)\$/m)[1].trim();const n=new Client({auth:t});
(async()=>{let cur,all=[];do{const r=await n.dataSources.query({data_source_id:'0c48fe8a-5329-46e7-9cf4-b1da95310ed8',start_cursor:cur,page_size:100});all.push(...r.results);cur=r.has_more?r.next_cursor:undefined;}while(cur);
for(const p of all){const nm=(p.properties.Name?.title||[]).map(x=>x.plain_text).join('');const url=p.properties['URL']?.url||'';
const k=await n.blocks.children.list({block_id:p.id,page_size:50});let text=0,img=0,med=0;for(const b of k.results){if(b.type==='image')img++;else if(b.type==='video'||b.type==='file')med++;else{const rt=b[b.type]?.rich_text;if(rt)text+=rt.map(x=>x.plain_text).join('').length;}}
console.log(p.id,'| text',text,'img',img,'med',med,'|',nm.slice(0,45),'|',url.slice(0,60));}})();"
```

### 2. Triagieren

Je Seite einordnen (Methoden-Tabelle im `add-recipe`-Skill):
- **On-Page-Text** (Webclipper) → direkt verwenden.
- **Blog-URL** → WebFetch; blockiert (chefkoch/focus/…) → verbundener Browser.
- **Instagram/TikTok/YouTube** → Embed/oembed/Description; sonst Video → Gemini.
- **Angehängtes Video/Foto (Kochbuchseite)/PDF** → Gemini (`extract_recipe_gemini.py`; frische
  Notion-S3-URL des Blocks holen, läuft nach Minuten ab).
- **Verrauschter Artikel-Text** → `extract_recipe_gemini.py --text`.
- **Überspringen (nicht erfinden):** tote Links (DNS/404/„Coming Soon"), reine Platzhalter
  (leere Seite, „Notiz ohne Titel", „TODO: …", nur Titel, reine Namensliste), Videos ohne Text/Frame.

### 3. In Schüben abarbeiten

- Bei vielen Ideen in **Schüben** (z.B. 8–10) und dazwischen kurz Fortschritt melden; nicht alle
  Seiten-Inhalte gleichzeitig in den Kontext lesen (große Clips ggf. per Gemini `--text` statt Rohtext).
- **Effizient anlegen:** mehrere Rezepte in einem `notion-create-pages`-Aufruf, oder Seiten direkt
  per SDK `pages.create` (Blöcke `heading_1`/`heading_3`/`bulleted_list_item`/`numbered_list_item`
  aus dem Rezept-JSON bauen) — spart bei Batches viel.
- Jede Seite: Kategorie `"Ideen"`, `Speisekarte=__YES__`, Cover (Prioritäten in `add-recipe`:
  On-Page-Foto → Blog-og:image → Video-Standbild → Gemini-generiert), Quelle in `userDefined:URL`,
  Tags mergen (z.B. `China`, `Thermomix`).

### 4. Aufräumen & Verifizieren

- **Nach erfolgreichem Import** die Ideen-Seite in den Papierkorb: `pages.update({page_id, in_trash:true})`
  (30 Tage wiederherstellbar). Übersprungene **stehen lassen** und am Ende auflisten.
- Prüfen: `/ideen` zeigt die neuen Rezepte (Cover = `file`). Bei ersetzten Covern `rm -rf .next/cache/images`.
- Abschlussbericht: importiert (mit Cover-Quelle), übersprungen (mit Grund), verbleibende Ideen-Zahl.

## Gotchas (diese Session gelernt)

- **Nur breit unterstützte Emojis** als Icon (Notion lehnt sehr neue wie 🫛 ab).
- Nutzt eine Idee eine **neue Notion-Kategorie**, die es im App-Code nicht gibt (Typ/`categoryConfig`/
  `navigation`), landet sie sonst falsch (Default) → Kategorie im Code ergänzen (Slug + Tab), sonst „Ideen".
- Notion-`dataSources.query` liefert max. 100/Seite → immer paginieren.
- **Nichts erfinden**: fehlende Schritte dürfen sinngemäß ergänzt + per Callout gekennzeichnet werden; fehlt alles → überspringen.
