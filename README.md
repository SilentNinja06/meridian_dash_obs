# MERIDIAN Dashboard

A central dashboard home surface for Obsidian — in-world, an interface **MERIDIAN maintains for the Operator**. A HALCYON SYSTEMS artifact. **STABILITY THROUGH OBSERVATION.**

Mobile-first, desktop-capable. One plugin, a layout shell hosting registered panel modules. The **daily note remains the archival record**; the dashboard is the interface that reads and writes it.

## Panels

- **Chronometer** — four-digit 24h clock + time since last access, and (once you have a run going) a read-only observation-streak record.
- **MERIDIAN** — a contextual, weighted ambient line (288 canon lines across 12 pools).
- **Directives** — a persistent to-do engine: recurring items, future scheduling, per-occurrence dismiss, and roll-and-flag for slipped items. Does not reset overnight; completions are archived under `# Completed tasks`. Each directive can also hold a collapsible checklist of sub-tasks (per-occurrence for recurring items) and one muted note line. A **Weekly review** button opens a read-only 7-day observation summary compiled from the daily notes.
- **Today's Agenda** — up to 10 Proton Calendar share links (public ICS), today only, with an offline cache and visible fetch failures. A **NEXT / NOW** placard shows what's next and how long you're free (ticking each minute), and each calendar can be toggled out of that countdown while still showing on the agenda. Dashboard-only **local events** (a **+ Event** button, tagged `LOCAL`) merge into today's agenda and feed the same countdown — useful for anything the read-only Proton feed will never carry. A **Print week** button opens a printable week-at-a-glance planner: each day's events colour-coded by their source calendar (with a legend), plus ruled space to write in.
- **Calendar** — a month grid of daily notes; days with a note are marked, tapping a day opens it (creating it from the template if needed), plus a button to open the Logs base note.
- **Quote of the Day** — reads `scripts/qotd/quotes.json` and stays in sync with the daily-note block.
- **Daily Log** — free-text editors for Musings / random thoughts, Daily log → Primary/Supplemental, and Reconsider tomorrow, writing straight into today's note, plus a read-only carry-over of *yesterday's* Reconsider-tomorrow.
- **Nourishment / Regulation / Contacts / Meals** — read-only surfaces over the ARFID, Spiral & Shutdown, Simple Contact Manager, and Recipe Manager plugins, with one-tap actions. The Contacts card logs a specific contact directly (no re-pick).
- **Quick Actions** — every registered command, grouped, with the hard-moment actions one tap away.
- **Knowledge Base** — fuzzy search scoped to `Knowledge base/Notes/`. An empty box lists the most-recently-modified notes; typing matches filenames and headings first, then (optionally) note bodies with a muted context snippet.
- **Second Brain** — manage the ongoing-project library: search it, archive notes into its Archive subfolder, create notes and categories, and assign notes to categories (writing both a `categories:` frontmatter entry and an alphabetized `[[wikilink]]` into the category note).
- **Navigation** — user-editable destinations (notes, Bases, and plugin dashboards).

Every panel is toggleable and reorderable in settings. A throwing panel renders a calm error card and never takes down the dashboard.

## Remote control

Everything the dashboard does is reachable without a dashboard leaf open — from the command palette, a mobile shortcut, or a desktop keybind. Each command operates on the store directly and then refreshes any open dashboards.

### Commands

- **Open dashboard**
- **Complete next directive** — completes the top pending, non-skipped directive for today (same path as tapping it, so it archives under `# Completed tasks`). No-op with a notice if none pending.
- **Add a directive** — opens the add-directive modal.
- **Log to Daily log — Primary** / **— Supplemental** — appends a line under that part of `# Daily log` in today's note.
- **Log a musing** — appends under `# Musings`.
- **Log to Reconsider tomorrow** — appends under `# Reconsider tomorrow`.
- **New MERIDIAN line** — force-rotates the ambient line (or, with no dashboard open, shows one as a notice).
- **Add an event** — opens the local-event modal.
- **Weekly review** — opens the 7-day observation summary.
- **Refresh dashboard** — refreshes every open dashboard.

All log commands write through the same daily-note writer as the Daily Log panel (`app.vault.process()`, reconciling against a live editor if today's note is open).

### URI actions

```
obsidian://meridian-dash?action=open
obsidian://meridian-dash?action=complete-next
obsidian://meridian-dash?action=add-directive&text=<urlencoded>
obsidian://meridian-dash?action=log&field=primary|supplemental|musing|reconsider&text=<urlencoded>
obsidian://meridian-dash?action=add-event&summary=<urlencoded>&date=YYYY-MM-DD&start=HH:mm&end=HH:mm
```

With `text` (or `summary` for `add-event`), `add-directive`, `log`, and `add-event` act headlessly and confirm with a notice; without it they fall back to the modal. An unknown `log` field is rejected with a notice and no write. `add-event` defaults to today when `date` is omitted, and is all-day when `start` is omitted. Every daily-note URI write goes through the same writer as the commands — there is no separate write path.

**GNOME** — a custom keyboard shortcut running:

```
xdg-open "obsidian://meridian-dash?action=complete-next"
```

**iOS / macOS Shortcuts** — an *Open URLs* action with:

```
obsidian://meridian-dash?action=log&field=musing&text=A%20passing%20thought
```

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
