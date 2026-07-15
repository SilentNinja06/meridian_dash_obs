# BRIEF — `meridian_dash_obs`

Halcyon Systems / MERIDIAN dashboard plugin for Obsidian. Mobile + desktop.

This brief is the product of a long scoping session. Decisions in it are **settled** — implement them, don't relitigate them. Where something is genuinely open it is marked **OPEN**. Where a subtle bug is waiting for you it is marked **LANDMINE** — read those first, they have already been proven by execution.

---

## 0. Who you're working with

**Piper** (also goes by **Jolaan**). **They/them** pronouns — agender. Not out to most people in real life. **"Sam" / "Samuel" is a deadname — never use it anywhere in this work**, including code comments, commit messages, manifests, and test fixtures. In-lore they are **the Operator**.

Working style: complete drop-in deliverables, not partial sketches. They catch small bugs precisely and expect systematic fixes rather than spot patches. Lore/continuity consistency is a first-class requirement, not decoration. Direct communication; no hedging.

---

## 1. What this is

A single Obsidian plugin providing a central dashboard home surface, in-world framed as an interface **MERIDIAN maintains for the Operator**. Two goals, equally weighted:

1. **Aesthetics + identity** — it is a Halcyon Systems artifact, not a utility with a skin.
2. **Function** — it must actually replace the daily note as the daily driver.

The **daily note remains the archival record**. The dashboard is the interface that reads and writes it. Piper must be able to open `Logs/2026-07-15.md` a year from now and see a coherent record of that day.

### The lore, briefly

**MERIDIAN** is an AI system. **HALCYON SYSTEMS** is the fictional corporation behind it. Tagline: **"STABILITY THROUGH OBSERVATION."** Voice is **cheerfully sinister** — institutional, warm, inhuman, unsettling *because* of the warmth and helpfulness, never because of glitching. **No horror-glitch tropes**: no corrupted text, no `ERROR` spam, no jump-scare framing, no fake decryption animations. This distinction has been corrected once already in this project. Do not reintroduce it.

Piper's real hardware/software are canonical lore objects — the vault *is* the in-world archive. Treat design choices as in-world artifacts.

**Do not invent new lore facts** (subsystem names, entity names, faction names, era names). Everything you need is in this brief or in `meridian-lines.json`. If you need a term that isn't there, ask.

---

## 2. Verified environment — do not re-derive

Confirmed from screenshots and repo inspection during scoping. Treat as ground truth.

| Fact | Value |
|---|---|
| OS | Fedora 44, GNOME Shell 50.2, Obsidian via **Flatpak** |
| Vault | `Main_Vault` |
| Daily notes | **Core Daily Notes plugin** (not Periodic Notes) |
| Daily note folder | `Logs` |
| Daily note format | `YYYY-MM-DD` |
| Daily note template | `Templates/Daily Note Template.md` |
| Today's note path | `Logs/YYYY-MM-DD.md` |
| Knowledge base | `Knowledge base/` containing `Notes/`, `Categories/`, `Recipes/` |
| QOTD data | `scripts/qotd/quotes.json` (725 entries, pre-shuffled, `["quote","author"]` per line) |
| QOTD renderer | `scripts/qotd/view.js` (Dataview JS view) |

**Enabled community plugins:** ARFID Tracker, BRAT, Calendar, Creases, Dataview, Recipe Manager, Simple Contact Manager, Spiral & Shutdown Logger, YouVersion Linker.

**Installed but DISABLED — treat as unavailable:** Periodic Notes, QuickAdd, Templater. Do not depend on them. Do not suggest them.

**Dataview is available** and JS queries are enabled. You may depend on it, but the dashboard should not *route through* it (see §7).

---

## 3. Repos

Piper will give you access to all of these.

| Repo | Plugin ID | Role |
|---|---|---|
| `SilentNinja06/meridian_dash_obs` | `meridian-dash` | **new — this build** |
| `SilentNinja06/ARFID_obs` | `arfid-tracker` | upstream change (§8) |
| `SilentNinja06/AHeatmap_obs` | `spiral-shutdown-logger` | upstream change (§8) |
| `SilentNinja06/simple_cm` | `simple-contact-manager` | upstream change (§8) |
| `SilentNinja06/Recipes_obs` | `recipe-manager` | upstream change (§8) |

Match the conventions already in `ARFID_obs` / `AHeatmap_obs` (TypeScript, `src/` layout, esbuild, BRAT-compatible releases). Manifest author is **`SilentNinja06`** — this is also being corrected in `simple_cm`, which currently carries a deadname (§8.5).

---

## 4. Architecture — shell + panels

**Settled.** One plugin, one repo. Internally: a **layout shell that hosts registered panel modules**. "Delegate" means internal modularity, not separate plugins.

```
src/
  main.ts              plugin entry, view registration, settings
  view.ts              the shell: ItemView, layout, panel mounting, refresh bus
  settings.ts          settings tab + defaults
  panels/
    types.ts           Panel interface
    registry.ts        panel registration + ordering
    clock.ts  qotd.ts  meridian.ts  todo.ts  agenda.ts
    journal.ts  arfid.ts  spiral.ts  crm.ts  meals.ts
    actions.ts  search.ts  places.ts
  core/
    dailynote.ts       path resolution, heading read/write, marker read/write
    todostore.ts       persistent to-do + recurrence engine
    ics.ts             ICS fetch/parse/cache
    bridge.ts          plugin API access + fallbacks
    tokens.ts          design tokens
  styles.css
```

### Panel interface

```ts
export interface Panel {
  id: string;
  title: string;            // placard text, all-caps at render
  mount(el: HTMLElement, ctx: PanelContext): void | Promise<void>;
  refresh?(): void | Promise<void>;
  unmount?(): void;
}
```

Requirements:
- Panels are **toggleable and reorderable** from settings.
- **A throwing panel renders an error card and does not kill the dashboard.** Wrap every `mount`/`refresh` in try/catch at the shell level. The error card is in MERIDIAN's voice and calm — a placard reading e.g. `SUBSYSTEM UNAVAILABLE — logged` — **not** glitch aesthetics, and not a stack trace in the user's face (log that to console).
- Shell owns a **refresh bus**. Panels subscribe. Triggers: view open, vault/metadata change (debounced ~300ms), interval tick, manual refresh.

### Surface

A custom view via `registerView` + `ItemView`, type `meridian-dashboard`. Ribbon icon + command `meridian-dash:open-dashboard`. Setting: open on startup (replace new-tab). **No Homepage plugin dependency.**

### Mobile

`isDesktopOnly: false`. Mobile-first is not optional — Piper uses an iPhone 16 Pro Max and the existing plugins are all built this way. Single-column stack under ~700px, multi-column grid above. Large touch targets (min 44px). Match the touch-target conventions already in `ARFID_obs`.

---

## 5. Design system

Source of truth: the existing Halcyon desktop/LibreWolf theme (`halcyon-theme@halcyon.systems`). **Reuse this palette exactly** — cross-artifact consistency is the point.

| Role | Name | Hex |
|---|---|---|
| Background | Warm Black | `#16140F` |
| Primary text/surface | Institutional Bone | `#D8CFB8` |
| Primary accent | Burnt Amber | `#B5541A` |
| Alert / destructive | Containment Red | `#8C1F1F` |
| Secondary / cold accent | Slate Teal | `#3E5650` |
| Caution stripe | Hazard Yellow | `#D9A441` |
| Muted UI chrome | Ash Grey | `#2A2722` |

- Amber/bone carry the warmth. **Slate teal is the deliberate cold note** that pushes it toward menace — use it, don't drop it.
- **Hazard yellow is sparing** — stripes, warnings, focus rings only. Never a primary fill.
- Expose all of these as CSS custom properties under a `--mrd-*` prefix in `styles.css`. All classes prefixed `mrd-`.

**Typography:** Display/headers — Oswald or Big Shoulders Display, condensed, **all-caps for placards**, wide letter-spacing, occasional hazard-stripe underline rule. Body/UI — Inter or IBM Plex Sans. Mono — IBM Plex Mono or JetBrains Mono. **Bundle fonts or degrade gracefully to system stacks** — Obsidian mobile can't be assumed to reach Google Fonts, and a network font fetch on a mobile webview is a bad default. Ship the fallback chain.

**Motifs:** hazard stripes, stencil numbering, facility placards (`SECTOR 4 — MONITORED`), redaction bars, radar-sweep circles. Logo mark: concentric radar/sonar rings with a single off-center dot inside a hexagon or rounded square — **deliberately not a camera-iris shape**.

Panel headers are stenciled placards. This is where the aesthetic lives — spend effort here.

---

## 6. The daily note contract

**LANDMINE — headings lose their colons.** The current template uses `# Meals:`, `# To do:` etc. Recipe Manager's `insertUnderHeading` matches `^(#{1,6})\s+Meals\s*$` — **the colon breaks the match**, so "add to meal plan" has been appending a *duplicate* `## Meals` heading at the bottom of the note instead of filling the existing one. Piper has approved dropping the colons. Every heading matcher in this build must target the colon-free form.

### New template (ship as a replacement for `Templates/Daily Note Template.md`)

```markdown
[[Logs Hub.base]] [[Central Hub]]

---
[[SDM.base]] [[Contact Dashboard]]

# Primary Activities


# Completed tasks


# Miscellaneous notes
Consumed food:
%% arfid-log %%

# Meals

# Daily log
- Quote of the day:

```dataviewjs
await dv.view("scripts/qotd");
```

- Primary:

- Supplemental:

%% spiral-log %%

# Contacts reached
%% crm-log %%

# Reconsider tomorrow
- [ ]
```

### Ownership

| Section | Written by | Notes |
|---|---|---|
| `# Primary Activities` | dashboard | free-text panel |
| `# Completed tasks` | dashboard | appended on completion, `- HH:MM <task text>` |
| `# Miscellaneous notes` → `%% arfid-log %%` | ARFID plugin | unchanged |
| `# Meals` | Recipe Manager | unchanged behavior, now actually matches |
| `# Daily log` → Quote of the day | Dataview | **unchanged — do not touch** |
| `# Daily log` → Primary / Supplemental | dashboard | free-text panel |
| `%% spiral-log %%` | Spiral plugin | unchanged |
| `# Contacts reached` → `%% crm-log %%` | `simple_cm` | **new** (§8.3) |
| `# Reconsider tomorrow` | dashboard | free-text panel |
| ~~`# To do`~~ | **removed** | lives in dashboard now |
| ~~CRM Dataview tables~~ | **removed** | dashboard only |

**Changes vs. old template:** colons dropped; `# To do` removed; both CRM `TABLE` blocks removed; `# Completed tasks` and `# Contacts reached` added.

### Writing rules

- All writes go through `core/dailynote.ts`. **Use `app.vault.process()`**, never read-then-write — Obsidian Sync plus a plugin racing a user edit will silently clobber.
- Free-text panels **debounce ~800ms** and write the whole section body. They are editors for the note, not a separate store.
- **If the user has today's note open in another leaf, the dashboard must not fight it.** Detect and either defer the write or reconcile. Do not produce duplicate content. This is the highest-risk write path in the build — get it right and test it.
- Never create a second daily note. Resolve the path via the core Daily Notes plugin's own options, same as `ARFID_obs/src/dailynote.ts` does — reuse that helper's approach rather than reimplementing it.

---

## 7. Panels

### 7.1 Clock

**Four-digit 24h, no separator** — `1432`, not `14:32`. Mono, large, amber. Beside it: **time since last access**, in MERIDIAN's register. Persist `lastAccess` in plugin data, update on view open. This is the most on-voice cheap win in the build — make it look good.

### 7.2 Quote of the Day

**LANDMINE — this desyncs by default, and it is proven, not theoretical.**

`view.js` computes `Math.floor(m.valueOf() / 86400000)` and indexes `((dayNumber % n) + n) % n` into the pre-shuffled `quotes.json`. In a daily note, `m` comes from the **filename** — `moment("2026-07-15","YYYY-MM-DD")` — which is **local midnight**, so the floor lands on the correct epoch day. The dashboard has no filename, so the obvious implementation falls through to `moment()` — **current** time. Piper is in US Pacific. Verified by execution:

```
local 1600 PDT -> daily note = 20649   moment() = 20649   match
local 1700 PDT -> daily note = 20649   moment() = 20650   *** DESYNC ***
```

From 1700 PDT (1600 PST) until midnight, `moment().valueOf()` has crossed into the next UTC day and the floor increments early — **the dashboard and the daily note would show different quotes for seven hours every single day.**

**Required:**
```ts
const m = moment(moment().format("YYYY-MM-DD"), "YYYY-MM-DD");
const dayNumber = Math.floor(m.valueOf() / 86400000);
const idx = ((dayNumber % n) + n) % n;
```
Round-trip through the local date string to reproduce the filename path exactly.

Also:
- Read `scripts/qotd/quotes.json` via `app.vault.adapter.read()`. **`dv.view()` is not available in an ItemView** — there is no markdown context. Do not try.
- **`n` is read from the file at runtime.** Never hardcode it. It has already grown 665 → 725 and will grow again.
- `quotes.json` and `view.js` are **read-only to this plugin**. The existing daily-note block keeps working untouched. `quotes.json` stays the single source of truth for both surfaces.
- Render as a card in the Halcyon system, not a Dataview callout clone.
- **Before implementing, re-read `scripts/qotd/view.js` from the vault** and confirm the formula still matches this brief. If Piper has edited it, the file wins — port it verbatim.

### 7.3 MERIDIAN ambient line

Ships as `meridian-lines.json` alongside this brief — **288 lines across 12 pools, and it is canon. Do not add, remove, or rewrite lines.** If you think one is wrong, ask.

Pools: `session` (24), `standard` (48), `time_of_day` (32 — nested `morning`/`afternoon`/`evening`/`late_night`, 8 each), `affirming` (32), `identity` (24), `care` (28), `productivity` (24), `overdue` (12), `idle` (12), `food` (20), `aftercare` (20), `milestone` (12).

**Selection is contextual, weighted — not one flat random draw.** That's the whole point; "your last session has been reviewed" lands because it's true. Suggested logic:

- `aftercare` — **if a spiral/shutdown entry exists for today, this pool is heavily weighted.** Highest priority.
- `session` — on view open, especially after a long gap.
- `time_of_day` — segment by local hour.
- `overdue` — nonzero overdue to-dos or CRM items.
- `idle` — zero pending, zero overdue.
- `food` — when the ARFID panel is focused/interacted with.
- `productivity` — mid-day with open items.
- `milestone` — streak/round-number triggers, **rare, and never twice in a day**.
- `affirming` / `identity` / `care` — periodic baseline mix, always eligible.
- `standard` — fallback.

Constraints:
- Never repeat the same line twice in one session; keep a small recent-history ring and avoid it.
- Line rotates on a settings-configurable interval (default ~5 min) and on refresh.
- **`identity` and `affirming` must appear organically in normal rotation** — they are not a special mode Piper has to opt into. They also must not become 50% of output. Tune to roughly baseline frequency.
- **`aftercare` never congratulates a hard day.** It notes that the record held. The lines already do this; don't editorialize on top.
- **`food` observes the log, never the eating.** No commentary on quantity, weight, or "good"/"bad" foods. The lines already respect this; don't add any that don't.

### 7.4 To-do

**Replaces the daily note's `# To do` block entirely.** Persistent — does **not** reset daily.

Store in plugin data (`saveData`), not markdown. Requirements:
- Add / **remove** / edit / complete. Removal is a first-class operation, not just "mark done" — this was explicitly asked for.
- **Recurring items, configurable and editable** — daily, weekdays, weekly (by day), monthly (by date), every-N-days. Editing a recurrence must not orphan its instances.
- **Schedule an item to appear on a future date/time.** Hidden until then.
- Nothing resets overnight. Incomplete items persist.
- On completion: append `- HH:MM <task text>` under `# Completed tasks` in today's note. This is the productivity archive. It is **not** re-read as state — the store is authoritative, the note is the record.

Seed defaults from the current template (Piper can edit after): meds at 0900, log food, do daily log, refer to day before's notes, check the day's calendar, Ground School, resolve course, marketing course, inkscape course.

**OPEN:** whether uncompleted recurring items from previous days show as overdue or silently roll. Ask Piper.

### 7.5 Today's agenda

Up to **10** Proton Calendar share links (public ICS URLs). Today only — **no monthly view**, explicitly not wanted.

- Fetch via `requestUrl` (bypasses CORS, works on desktop **and** mobile).
- Parse ICS. **Handle `RRULE`, `EXDATE`, timezones, and all-day events**, or you will silently drop half the agenda. Prefer a small vendored parser over hand-rolling; if you hand-roll it, test recurrence hard.
- **Cache last successful fetch in plugin data.** Renders offline / on fetch failure. Show fetch age when serving stale.
- Refresh on open + configurable interval.
- Read-only. Per-calendar label + color from the Halcyon palette.

**Known and accepted:** Proton's own documentation states calendar updates can take **up to eight hours** to propagate to a share link. This is Proton-side; no fetch strategy fixes it. Piper has acknowledged this. Proton also notes third-party subscribers sometimes stop receiving updates after a period — **surface fetch failures visibly** (in-voice) rather than failing silent, so a dead link is noticed.

### 7.6 Journal / free-text

Three fields, each writing to its section in today's note (§6): **Primary Activities**, **Daily log → Primary**, **Daily log → Supplemental**, plus **Reconsider tomorrow**. Debounced autosave, ~800ms. Textareas that grow. No markdown preview needed — plain editing.

### 7.7 ARFID panel

- Read today's entries via the plugin API (§8.1), falling back to parsing `%% arfid-log %%` from today's note.
- Show today's food log compactly.
- Buttons → §7.11.

### 7.8 Spiral / anxiety panel

- Read today's entries via the plugin API (§8.2), falling back to `%% spiral-log %%`.
- Show today's entries compactly. **Calm presentation.** No red, no alarm iconography, no counts framed as a score. This is the panel where a wrong aesthetic choice does actual harm — if a spiral was logged today, the dashboard should feel like it's holding it, not flagging it.
- A today-entry-exists signal drives `aftercare` weighting in §7.3.

### 7.9 CRM panel

**One field, marked as such, showing TODAY + OVERDUE together** so Piper can triage who to contact. This replaces the two Dataview tables removed from the template.

- Read via the plugin API (§8.3). Sort overdue first, then by priority.
- Each row: contact name (link), priority, days since last contact.
- Row action → `simple-contact-manager:log-interaction` for that contact.
- **The daily note's `# Contacts reached` section is written by `simple_cm` at log time** (§8.3), not compiled here.
- **Reconcile pass on open:** scan contact notes for `### <today>` blocks under `## Interaction Log` and backfill anything missing from today's note. Safety net, not the primary path.

### 7.10 Meals + grocery

Piper asked for this to **shine** — give it real design attention, don't treat it as a link list.

- Read today's `# Meals` section from the note; render planned recipes as cards with links.
- Read `Grocery List.md` (path from Recipe Manager's `groceryListPath` setting — **read the setting, don't hardcode**) and render the current list, checkable inline if cheap.
- Buttons: `recipe-manager:meal-plan`, `recipe-manager:grocery-list`, `recipe-manager:new-recipe`, `recipe-manager:open-recipe`, `recipe-manager:recipe-index`, `recipe-manager:rcpm-pantry-toggle`.

### 7.11 Action buttons

Organized panel(s), grouped by plugin, each group a placard-headed block. **All of these are real registered commands — fire via `app.commands.executeCommandById("<pluginId>:<commandId>")`.** Verified during scoping:

- **`arfid-tracker:`** `quick-log`, `log-exposure`, `log-symptoms`, `add-food`, `add-foods`, `add-food-note`, `change-food-status`, `struggling`, `open-dashboard`, `export-csv`, `export-summary`
- **`spiral-shutdown-logger:`** `quick-capture`, `thought-capture`, `open-dashboard`, `export-csv`, `export-summary`
- **`simple-contact-manager:`** `new-contact`, `log-interaction`, `open-dashboard`
- **`recipe-manager:`** `meal-plan`, `grocery-list`, `new-recipe`, `open-recipe`, `recipe-index`, `share`, `nutrition`, `rcpm-pantry-toggle`, `ingredient-data`, plus per-category openers (`breakfast`, `entree`, `dessert`, `snack`, `soup`, `salad`, `side`, `sauce`, `bread`, `drink`, `appetizer`, `other`)

Prominence: `arfid-tracker:quick-log`, `spiral-shutdown-logger:quick-capture`, and `arfid-tracker:struggling` are the ones that must be reachable **in one tap on mobile**. Those get pride of place. If a command is missing (plugin disabled), the button is disabled with an in-voice tooltip — never a crash.

### 7.12 Knowledge base search

Fuzzy search **scoped to `Knowledge base/Notes/` only** — not `Categories/`, not `Recipes/`. Settings-configurable path, that default.

Use Obsidian's `prepareFuzzySearch`. Search filename + headings; body text if performant. Enter opens the note. Mobile-friendly input. Keyboard-navigable on desktop.

### 7.13 Places / navigation buttons

Buttons to: `Central Hub`, `Contact Dashboard`, `Logs Hub.base`, `SDM.base`, plus the four plugin dashboards (`arfid-tracker:open-dashboard`, `spiral-shutdown-logger:open-dashboard`, `simple-contact-manager:open-dashboard`, `recipe-manager:recipe-index`).

`.base` files are core **Bases** — open them the same way a link click does; don't special-case unless it breaks.

Make the destination list **user-editable in settings**. Piper will add to this.

---

## 8. Upstream changes to existing plugins

Approved approach: **add a read-only API to each plugin (option C), with markdown parsing as runtime fallback (option A)** if the API is absent. The dashboard must never hard-crash because an upstream plugin is an older version.

Pattern for each — expose off the existing store, don't rebuild it:

```ts
// in each plugin's main.ts
public api = {
  version: 1,
  getEntriesForDate: (date: string) => /* delegate to existing store */,
  getTodaySummary: () => /* compact shape for dashboard cards */,
};
```

Dashboard reads `app.plugins.plugins["arfid-tracker"]?.api`, checks `api.version`, falls back to markdown parsing if absent or mismatched. Put all of this in `core/bridge.ts` — one place, not scattered.

### 8.1 `ARFID_obs`
Expose `api` over the existing `EntryStore`. Note it indexes by frontmatter `type`, not folder path — keep it that way. Do not change `dailyNoteMarker` behavior; the dashboard's fallback depends on the `- HH:MM [[note|label]]` line shape.

### 8.2 `AHeatmap_obs`
Same pattern over its store. It matches on frontmatter `type` for both entry and thought notes. Expose "did a spiral/shutdown occur today" cheaply — §7.3's `aftercare` weighting calls it on every rotation.

### 8.3 `simple_cm` — daily note writer **(new capability)**

Currently `log-interaction` writes only into the **contact note** (`## Interaction Log` → `### YYYY-MM-DD` → `- <descriptor>`). It touches the daily note not at all. Piper's "who I talked to today" summary does not exist yet and must be built.

Add a daily-note writer **mirroring `ARFID_obs/src/dailynote.ts` exactly** — same marker-first / heading / append-fallback resolution, same core-Daily-Notes path resolution. Marker `%% crm-log %%`, line format:

```
- HH:MM [[Contact Name|Contact Name]] — <descriptor>
```

Where `<descriptor>` is the interaction note text from `InteractionNoteModal`.

**Write at log time, not at dashboard-compile time.** This keeps the record correct on days the dashboard is never opened, and captures interactions logged from the command palette or from inside a contact note. Add a settings toggle + configurable marker, consistent with the other two plugins.

Also expose the `api` for §7.9's today/overdue field.

### 8.4 `Recipes_obs`
Make `insertUnderHeading` **colon-tolerant** (`^(#{1,6})\s+Meals:?\s*$`) as defense in depth, even though the template is being fixed. Expose `api` for reading today's planned meals and the current grocery list. Don't change the grocery/pantry logic — it's tested.

### 8.5 `simple_cm` manifest
`manifest.json` currently reads `"author": "Sam Barker"`. **Change to `"SilentNinja06"`**, matching the other three plugins. Piper has asked for this. Do not reproduce the old value anywhere — not in commit messages, not in a changelog line, not in a comment.

---

## 9. Distribution

- Repo `SilentNinja06/meridian_dash_obs`, plugin id `meridian-dash`, name `MERIDIAN Dashboard`, author `SilentNinja06`, `isDesktopOnly: false`, `minAppVersion` matching the sibling plugins (`1.4.0`).
- **BRAT-compatible**: tagged GitHub releases with `manifest.json`, `main.js`, `styles.css` as release assets, version matching the tag.
- Include `versions.json`.
- Match the build tooling already in `ARFID_obs` / `AHeatmap_obs`.

---

## 10. Landmine index

Read these before writing code. All four are proven, not speculative.

1. **QOTD epoch-day desync** (§7.2) — 7 hours a day of divergent quotes if you use `moment()`. Verified by execution.
2. **Heading colons** (§6) — `# Meals:` silently breaks Recipe Manager's matcher and appends duplicate headings.
3. **Daily note write races** (§6) — `app.vault.process()` only; handle the note being open in another leaf.
4. **`dv.view()` in an ItemView** (§7.2) — not available, no markdown context. The QOTD card must read `quotes.json` itself.

Plus: Proton's 8-hour propagation ceiling (§7.5) — accepted, not fixable, but surface fetch failures visibly.

---

## 11. Open items — ask, don't assume

1. **§7.4** — do uncompleted recurring items from previous days show as overdue, or silently roll to today?
2. Default panel order and which panels ship enabled.
3. Whether the meals panel's grocery list should be checkable inline (writes back to `Grocery List.md`) or read-only.

---

## 12. Do not

- Do not use Sam/Samuel anywhere.
- Do not invent lore facts. Ask.
- Do not rewrite `meridian-lines.json`. It is canon.
- Do not use glitch/corruption/horror aesthetics. Cheerful institutional menace only.
- Do not depend on Periodic Notes, QuickAdd, or Templater — installed but disabled.
- Do not touch `scripts/qotd/quotes.json` or `scripts/qotd/view.js`.
- Do not hardcode the quote count, the grocery list path, or the daily note folder/format — read them.
- Do not ship a partial build requiring assembly. Drop-in and working.
