# Projekt: io.meimberg.recipes (Meimberg's Menu)

Next-App, die Rezepte aus einer **Notion-Datenbank** rendert. Die Pflege der Rezepte
passiert **nicht im Code**, sondern in Notion — die App liest nur. Diese Datei
beschreibt, wie man **neue Rezepte einpflegt** (insb. als „Intake"), damit es zu den
bestehenden Seiten konsistent ist.

## Architektur in einem Satz

Notion-DB „Rezepte" → `getRecipes()` (`src/lib/notion-recipe.ts`) liest per Notion-SDK
v5 die **Data Source** → Kategorie-Tabs (`src/config/navigation.ts` + `categories.ts`)
→ statische Seiten (ISR, `src/app/[category]/page.tsx`, `src/app/recipes/[slug]/page.tsx`).

## Notion-Koordinaten (fix)

- **Database:** `Rezepte` — ID `1c547bca-4980-47b0-ab13-6bb6631d9ca6` (= `NOTION_DATABASE_ID`)
- **Data Source (Collection):** `eddfc71c-2dca-4502-89bd-2685a6135fb3`
  → **Neue Rezepte als Page mit `parent: { type: "data_source_id", data_source_id: "eddfc71c-2dca-4502-89bd-2685a6135fb3" }` anlegen** (NICHT database_id).

## Properties (Schema der Data Source)

Beim Anlegen via `notion-create-pages` → `properties`-Map. Eigenheiten beachten:

| Property | Typ | Hinweis |
|---|---|---|
| `Name` | title | Rezeptname. Bestehende Seiten haben teils `**fett**` im Titel — Plain ist Default. |
| `Kategorie` | select | Einer der gültigen Werte (s.u.). Steuert den Tab in der App. |
| `Kurzbeschreibung` | text | Ein-Satz-Teaser (erscheint auf der Karte). |
| `Speisekarte` | checkbox | `"__YES__"` / `"__NO__"`. **Nur Rezepte mit `__YES__` erscheinen in der App** (App filtert danach). |
| `Status` | select | `Idea` · `Initial` · `Draft` · `Beta` · `Final`. |
| `Vegetarisch` | select | `Vegetarisch` · `Teilvegetarisch` · `Vegatarische Variante` (Notion-Tippfehler beibehalten!). Optional. |
| `Tags` | multi_select | z.B. `China`, `Wochenende`, `Thermomix`, … Optional. |
| `userDefined:URL` | url | Quell-Link des Rezepts. **Muss `userDefined:URL` heißen** (Notion-Quirk für „url"). |

**Gültige `Kategorie`-Werte:** Vorspeisen, Pasta, Hauptgerichte, Suppen, Frühstück,
Dessert, Specials, Grillen, Komponenten, Festmahl, Snippet, Noch aufzuschreiben,
Rezeptideen, **Intake**.
(Mapping Notion→App-Tab steht in `src/config/categories.ts`.)

**Page-Icon:** Emoji setzen (`icon`-Feld). Konvention: Länderflagge nach Herkunft der
Küche (🇮🇹 🇨🇳 …), sonst passendes Food-Emoji.

**Cover-Bild:** **Immer** ein Cover setzen — und **in Notion hosten** (Typ `file`),
nicht als externe URL (externe URLs laufen ab / werden live nachgeladen). Bild
herunterladen und hochladen via `node .claude/skills/add-recipe/set-notion-cover.mjs`
(siehe Skill `add-recipe`). Der image-proxy der App refresht nur Notion-gehostete URLs.

## Content-Konventionen (Notion-flavored Markdown)

Vor komplexem Content **die MCP-Resource `notion://docs/enhanced-markdown-spec` lesen**
(nicht raten). Aufbau wie bei den bestehenden Rezepten:

```
# Zutaten
- Menge + Zutat (z.B. "60 Gramm Maisstärke")
- ...

# Zubereitung
1. Schritt
2. Schritt
```

Erweiterungen (siehe Käsefondue als Referenz):
- `### Untergruppe` (H3) zum Gliedern langer Zutaten-/Schrittlisten.
- Verschachtelte Bullets per Tab-Einrückung.
- `---` als Trenner zwischen Zutaten- und Zubereitungsblock (optional).
- `**fett**` für Hervorhebungen / Serviervermerk.
- Callout für Hintergrundinfo/Tipp: `<callout icon="💡" color="gray_bg"> … </callout>`.
- Querverweis auf ein anderes Rezept: Link auf `https://recipes.meimberg.io/recipes/<slug>`.

Den Seitentitel **nicht** in den Content schreiben (steht in `Name`).

## „Intake" einpflegen — der Standardfall

Intake = Eingangskorb für eingefangene Rezeptideen. Beim Anlegen:

- `Kategorie` = `"Intake"`
- `Status` = `"Idea"`
- `Speisekarte` = `"__YES__"`  ← damit es im **Intake-Tab der App** auftaucht
- `userDefined:URL` = Quell-Link, falls vorhanden
- `Name`, `Kurzbeschreibung`, Icon setzen; `Tags`/`Vegetarisch` wenn bekannt
- Content im obigen Format (mind. `# Zutaten` + `# Zubereitung`, soweit vorhanden)
- **Cover-Bild setzen** (Notion-gehostet, s.o.) — immer

> Der komplette, ausführbare Ablauf (Quelle holen → Seite anlegen → Cover) steht im
> Skill **`add-recipe`** (`.claude/skills/add-recipe/`).

> Bei Unklarheit (z.B. soll es schon sichtbar sein oder nur im Notion-Inbox liegen?)
> kurz beim User rückfragen, bevor `Speisekarte` gesetzt wird.

## Nach dem Einpflegen: Sichtbarkeit

Die Seiten sind **ISR mit `revalidate = 1 Jahr`** (`src/app/[category]/page.tsx`),
ändern sich also nicht von selbst. Damit ein neues Rezept live erscheint:
- Endpoint `POST /api/recipes` bzw. `/api/revalidate` (Secret `REVALIDATE_SECRET`) anstoßen, **oder**
- neu deployen / `next build`.

Lokal genügt ein Dev-Server-Neustart bzw. Hard-Reload.

## Code-Bezug (falls eine neue Kategorie/Tab gebraucht wird)

Eine **neue Kategorie** erfordert drei Code-Stellen + den Notion-Select-Wert:
1. `src/types/recipe.ts` — Wert zum `Category`-Typ
2. `src/config/categories.ts` — Eintrag in `categoryConfig`
3. `src/config/navigation.ts` — Tab (Label, Slug, Icon)
4. Notion: Option in der `Kategorie`-Select-Property anlegen

Ein Tab erscheint nur, wenn es **Rezepte mit `Speisekarte ✓`** in dieser Kategorie gibt.

## Konventionen dieses Repos

- Commit pro abgeschlossener Aufgabe, **kein** Auto-Push (Push macht der User).
- `.env` ist gitignored; `NOTION_TOKEN` ist geheim und liegt nur lokal.
