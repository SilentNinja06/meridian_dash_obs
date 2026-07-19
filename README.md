# MERIDIAN Dashboard

A central dashboard home surface for Obsidian — in-world, an interface **MERIDIAN maintains for the Operator**. A HALCYON SYSTEMS artifact. **STABILITY THROUGH OBSERVATION.**

Mobile-first, desktop-capable. One plugin, a layout shell hosting registered panel modules. The **daily note remains the archival record**; the dashboard is the interface that reads and writes it.

## Panels

- **Chronometer** — four-digit 24h clock + time since last access.
- **MERIDIAN** — a contextual, weighted ambient line (288 canon lines across 12 pools).
- **Directives** — a persistent to-do engine: recurring items, future scheduling, per-occurrence dismiss, and roll-and-flag for slipped items. Does not reset overnight; completions are archived under `# Completed tasks`.
- **Today's Agenda** — up to 10 Proton Calendar share links (public ICS), today only, with an offline cache and visible fetch failures.
- **Calendar** — a month grid of daily notes; days with a note are marked, tapping a day opens it (creating it from the template if needed), plus a button to open the Logs base note.
- **Quote of the Day** — reads `scripts/qotd/quotes.json` and stays in sync with the daily-note block.
- **Daily Log** — free-text editors for Musings / random thoughts, Daily log → Primary/Supplemental, and Reconsider tomorrow, writing straight into today's note, plus a read-only carry-over of *yesterday's* Reconsider-tomorrow.
- **Nourishment / Regulation / Contacts / Meals** — read-only surfaces over the ARFID, Spiral & Shutdown, Simple Contact Manager, and Recipe Manager plugins, with one-tap actions. The Contacts card logs a specific contact directly (no re-pick).
- **Quick Actions** — every registered command, grouped, with the hard-moment actions one tap away.
- **Knowledge Base** — fuzzy search scoped to `Knowledge base/Notes/`.
- **Second Brain** — manage the ongoing-project library: search it, archive notes into its Archive subfolder, create notes and categories, and assign notes to categories (writing both a `categories:` frontmatter entry and an alphabetized `[[wikilink]]` into the category note).
- **Navigation** — user-editable destinations (notes, Bases, and plugin dashboards).

Every panel is toggleable and reorderable in settings. A throwing panel renders a calm error card and never takes down the dashboard.

## Setup

1. Install via BRAT (`SilentNinja06/meridian_dash_obs`) or copy `main.js`, `manifest.json`, and `styles.css` into `.obsidian/plugins/meridian-dash/`.
2. Open the dashboard from the ribbon (radar icon) or the `MERIDIAN Dashboard: Open dashboard` command.
3. Optionally replace `Templates/Daily Note Template.md` with `templates/Daily Note Template.md` from this repo (colon-free headings — see below).
4. Add Proton Calendar share links, the knowledge-base path, and navigation destinations in settings.

## The daily-note contract

The bundled template drops the colons from headings (`# Meals`, not `# Meals:`) so Recipe Manager's heading matcher fills the existing section instead of appending a duplicate. All writes go through `app.vault.process()` and reconcile against a live editor if today's note is open, so the dashboard never clobbers a concurrent edit.

## Build

```
npm install
npm run build   # tsc typecheck + esbuild production bundle
```
