/*
 * MERIDIAN app-wide system skin (§ System skin).
 *
 * This is the single source of the MERIDIAN / HALCYON SYSTEMS look for the whole
 * app — editor, reading view, sidebars, tabs, ribbon, status bar, title bar,
 * modals and menus. It folds in (and retires) the standalone Halcyon `theme.css`:
 * every colour, font and interactive variable that theme set is re-homed here,
 * so the skin is self-sufficient with Obsidian's Default theme active — it does
 * NOT assume the old theme's variables are present.
 *
 * Two hard rules govern this file:
 *   1. Every app-wide rule is guarded by `body.mrd-skin-on`. A bare Obsidian
 *      selector here would be a rule that ignores the on/off toggle. Never write
 *      one. The dashboard's own view sheet (`styles.css`, scoped to `.dash-root`)
 *      is a separate, always-on artifact and is not touched here.
 *   2. The palette matches the dashboard exactly (warm-black / bone / amber /
 *      red / teal / hazard / ash). No new hues.
 *
 * The theme is dark-only ("the facility does not recognise daylight"). Rather
 * than require the user to also be in dark mode, `body.mrd-skin-on` forces the
 * dark surfaces unconditionally, so the skin looks right whatever base-theme
 * mode Obsidian is in.
 *
 * `!important` is avoided in favour of the `body.mrd-skin-on` guard's specificity;
 * the few unavoidable uses are commented inline.
 *
 * Kept as a bundled string constant (not merged into `styles.css`) so `main.ts`
 * can inject/remove it from `document.head` in lockstep with the setting.
 */
export const APPSKIN_CSS = `
/* ============================================================ palette + type
 * The Halcyon tokens, mirrored from the dashboard's --dash-* set so the two
 * sheets stay visually locked. Prefixed --mrd-* to avoid colliding with either
 * Obsidian's own variables or the dashboard's view-scoped ones. */
body.mrd-skin-on {
	--mrd-warm-black: #16140f;
	--mrd-panel-bg: #1c1a14;
	--mrd-bone: #d8cfb8;
	--mrd-amber: #b5541a;
	--mrd-red: #8c1f1f;
	--mrd-teal: #3e5650;
	--mrd-hazard: #d9a441;
	--mrd-ash: #2a2722;
	--mrd-line: #3a352b;
	--mrd-bone-dim: #9c937f;
	--mrd-bone-faint: #6f6857;
	--mrd-amber-soft: #d07a3f;
	--mrd-teal-soft: #6f8079;

	--mrd-font-display: "Oswald", "Big Shoulders Display", "Bebas Neue",
		"Archivo Narrow", "Roboto Condensed", -apple-system, system-ui, sans-serif;
	--mrd-font-body: "Inter", "IBM Plex Sans", -apple-system, BlinkMacSystemFont,
		system-ui, "Segoe UI", Roboto, sans-serif;
	--mrd-font-mono: "IBM Plex Mono", "JetBrains Mono", ui-monospace,
		"SF Mono", "Cascadia Code", Menlo, Consolas, monospace;

	/* Fonts Obsidian reads throughout the app. IBM Plex Sans / JetBrains Mono /
	 * Oswald are referenced by name and resolved from the user's system — nothing
	 * is bundled or fetched, so mobile never waits on a web-font request. */
	--font-text: var(--mrd-font-body);
	--font-interface: var(--mrd-font-body);
	--font-monospace: var(--mrd-font-mono);

	/* Burnt amber, kept as the accent HSL Obsidian derives interactive colours
	 * from — retained from theme.css so the derived tones stay tuned. */
	--accent-h: 22;
	--accent-s: 75%;
	--accent-l: 41%;
}

/* ================================================= forced-dark surface palette
 * Scoped to body.mrd-skin-on (not .theme-dark) so the skin's dark surfaces hold
 * even if the base theme is in light mode. */
body.mrd-skin-on {
	color-scheme: dark;

	--background-primary: var(--mrd-warm-black);
	--background-primary-alt: #1a1811;
	--background-secondary: #131109;
	--background-secondary-alt: var(--mrd-panel-bg);
	--background-modifier-hover: rgba(216, 207, 184, 0.06);
	--background-modifier-active-hover: rgba(181, 84, 26, 0.16);
	--background-modifier-border: var(--mrd-line);
	--background-modifier-border-hover: #4a4436;
	--background-modifier-border-focus: var(--mrd-amber);
	--background-modifier-form-field: #100e08;
	--background-modifier-success: var(--mrd-teal);
	--background-modifier-error: var(--mrd-red);
	--background-modifier-error-rgb: 140, 31, 31;
	--background-modifier-error-hover: #a52626;
	--background-modifier-message: rgba(20, 18, 13, 0.9);
	--background-modifier-cover: rgba(10, 9, 6, 0.75);

	--text-normal: var(--mrd-bone);
	--text-muted: var(--mrd-bone-dim);
	--text-faint: var(--mrd-bone-faint);
	--text-on-accent: #17130d;
	--text-on-accent-inverted: var(--mrd-warm-black);
	--text-accent: var(--mrd-amber-soft);
	--text-accent-hover: var(--mrd-hazard);
	--text-error: #c56a6a;
	--text-success: var(--mrd-teal-soft);
	--text-warning: var(--mrd-hazard);
	--text-selection: rgba(181, 84, 26, 0.28);
	--text-highlight-bg: rgba(217, 164, 65, 0.28);
	--text-highlight-bg-active: rgba(217, 164, 65, 0.5);

	--interactive-normal: var(--mrd-ash);
	--interactive-hover: #35312a;
	--interactive-accent: var(--mrd-amber);
	--interactive-accent-hover: var(--mrd-amber-soft);
	--interactive-accent-hsl: var(--accent-h), var(--accent-s), var(--accent-l);
	--interactive-success: var(--mrd-teal);

	--hr-color: var(--mrd-line);
	--divider-color: var(--mrd-line);

	--bold-color: var(--mrd-bone);
	--bold-weight: 700;
	--italic-color: var(--mrd-bone);

	/* links */
	--link-color: var(--mrd-hazard);
	--link-color-hover: var(--mrd-amber-soft);
	--link-external-color: var(--mrd-hazard);
	--link-external-color-hover: var(--mrd-amber-soft);
	--link-unresolved-color: #c56a6a;
	--link-unresolved-opacity: 0.85;
	--link-unresolved-decoration-style: dotted;
	--link-unresolved-decoration-color: rgba(140, 31, 31, 0.6);

	/* headings — colours; sizes/spacing handled structurally below */
	--h1-color: var(--mrd-hazard);
	--h2-color: var(--mrd-bone);
	--h3-color: var(--mrd-bone);
	--h4-color: var(--mrd-bone-dim);
	--h5-color: var(--mrd-bone-dim);
	--h6-color: var(--mrd-bone-faint);
	--heading-formatting: var(--mrd-bone-faint);

	/* inline code + code blocks */
	--code-normal: var(--mrd-bone);
	--code-background: #100e08;
	--code-comment: var(--mrd-bone-faint);
	--code-keyword: var(--mrd-amber-soft);
	--code-operator: var(--mrd-bone-dim);
	--code-property: var(--mrd-hazard);
	--code-function: var(--mrd-hazard);
	--code-tag: var(--mrd-amber-soft);
	--code-string: var(--mrd-teal-soft);
	--code-value: var(--mrd-amber-soft);
	--code-punctuation: var(--mrd-bone-dim);
	--code-important: var(--mrd-red);

	/* blockquotes — amber left border, reads as a system readout */
	--blockquote-border-color: var(--mrd-amber);
	--blockquote-border-thickness: 3px;
	--blockquote-color: var(--mrd-bone);
	--blockquote-background-color: rgba(181, 84, 26, 0.05);

	/* tags — teal-backed pills */
	--tag-color: var(--mrd-teal-soft);
	--tag-color-hover: var(--mrd-bone);
	--tag-background: rgba(62, 86, 80, 0.22);
	--tag-background-hover: rgba(62, 86, 80, 0.35);
	--tag-border-color: var(--mrd-teal);
	--tag-border-color-hover: var(--mrd-teal-soft);

	/* checkboxes — amber, a checked task reads as a logged state */
	--checkbox-color: var(--mrd-amber);
	--checkbox-color-hover: var(--mrd-amber-soft);
	--checkbox-border-color: var(--mrd-line);
	--checkbox-border-color-hover: var(--mrd-amber);
	--checkbox-marker-color: #17130d;
	--checklist-done-color: var(--mrd-bone-faint);

	/* tables */
	--table-border-color: var(--mrd-line);
	--table-header-background: var(--mrd-panel-bg);
	--table-header-background-hover: #26231c;
	--table-background: transparent;
	--table-row-background-hover: rgba(216, 207, 184, 0.04);
	--table-row-alt-background: rgba(216, 207, 184, 0.02);
	--table-header-color: var(--mrd-bone);

	/* callouts — the RGB triplets Obsidian tints callouts from. Palette-mapped
	 * to the Halcyon set (default→bone, warning→hazard, error→red, etc.). */
	--callout-border-width: 0px;
	--callout-border-opacity: 0.25;
	--callout-padding: 12px 16px;
	--callout-default: 156, 147, 127;
	--callout-info: 62, 86, 80;
	--callout-todo: 181, 84, 26;
	--callout-success: 62, 86, 80;
	--callout-question: 217, 164, 65;
	--callout-warning: 217, 164, 65;
	--callout-important: 181, 84, 26;
	--callout-tip: 62, 86, 80;
	--callout-fail: 140, 31, 31;
	--callout-error: 140, 31, 31;
	--callout-bug: 140, 31, 31;
	--callout-example: 156, 147, 127;
	--callout-quote: 156, 147, 127;

	/* scrollbars — amber thumb */
	--scrollbar-bg: transparent;
	--scrollbar-thumb-bg: rgba(181, 84, 26, 0.35);
	--scrollbar-active-thumb-bg: rgba(181, 84, 26, 0.6);

	/* chrome variables */
	--titlebar-background: var(--mrd-warm-black);
	--titlebar-background-focused: var(--mrd-warm-black);
	--titlebar-text-color: var(--mrd-bone-dim);
	--titlebar-text-color-focused: var(--mrd-bone);
	--titlebar-text-weight: 600;
	--titlebar-border-width: 1px;
	--titlebar-border-color: var(--mrd-line);

	--ribbon-background: var(--mrd-warm-black);
	--ribbon-background-collapsed: var(--mrd-warm-black);

	--tab-background-active: var(--mrd-warm-black);
	--tab-text-color: var(--mrd-bone-faint);
	--tab-text-color-active: var(--mrd-bone);
	--tab-text-color-focused-active-current: var(--mrd-bone);
	--tab-outline-color: var(--mrd-amber);
	--tab-outline-width: 2px;

	--nav-item-color: var(--mrd-bone-dim);
	--nav-item-color-hover: var(--mrd-bone);
	--nav-item-color-active: var(--mrd-hazard);
	--nav-item-background-hover: rgba(181, 84, 26, 0.1);
	--nav-item-background-active: rgba(181, 84, 26, 0.14);

	--status-bar-background: var(--mrd-warm-black);
	--status-bar-text-color: var(--mrd-bone-dim);
	--status-bar-border-color: var(--mrd-line);

	--modal-background: var(--mrd-panel-bg);
	--modal-border-color: var(--mrd-amber);
	--modal-border-width: 1px;
	--prompt-border-color: var(--mrd-amber);
	--prompt-border-width: 1px;

	/* graph view — Obsidian reads these variables even though the canvas itself
	 * is pixel-rendered, so the palette carries through. */
	--graph-line: var(--mrd-line);
	--graph-node: var(--mrd-bone);
	--graph-text: var(--mrd-bone);
	--graph-node-unresolved: var(--mrd-red);
	--graph-node-focused: var(--mrd-hazard);
	--graph-node-tag: var(--mrd-teal);
	--graph-node-attachment: var(--mrd-teal-soft);
}

/* ============================================================ app chrome
 * All guarded. Desktop selectors are the common case; mobile-specific selectors
 * are grouped at the end (see "mobile chrome"). */

/* --- status bar: the telemetry strip (folded in from theme.css) --- */
body.mrd-skin-on .status-bar {
	font-family: var(--mrd-font-mono);
	font-size: 11px;
	letter-spacing: 0.1em;
	border-top: 1px solid var(--mrd-line);
	text-transform: uppercase;
}

/* --- left ribbon --- */
body.mrd-skin-on .workspace-ribbon {
	border-right: 1px solid var(--mrd-ash);
}
body.mrd-skin-on .side-dock-ribbon-action:hover,
body.mrd-skin-on .workspace-ribbon .clickable-icon:hover {
	color: var(--mrd-amber-soft);
}
body.mrd-skin-on .side-dock-ribbon-action.is-active,
body.mrd-skin-on .workspace-ribbon .clickable-icon.is-active {
	color: var(--mrd-hazard);
}

/* --- tab headers: mono, letter-spaced titles for the telemetry feel --- */
body.mrd-skin-on .workspace-tab-header-inner-title {
	font-family: var(--mrd-font-mono);
	font-size: 0.72rem;
	letter-spacing: 0.08em;
}
body.mrd-skin-on .workspace-tab-header.is-active {
	border-top: 2px solid var(--mrd-amber);
}

/* --- side dock / file explorer / outline: nav headers as mini-placards --- */
body.mrd-skin-on .nav-header,
body.mrd-skin-on .workspace-leaf-content[data-type] .view-header-title,
body.mrd-skin-on .tree-item-self.is-clickable.nav-folder-title {
	letter-spacing: 0.04em;
}
body.mrd-skin-on .nav-folder-title-content,
body.mrd-skin-on .nav-file-title-content {
	font-family: var(--mrd-font-body);
}
/* Right/left sidebar pane titles read as small placards. */
body.mrd-skin-on .workspace-split.mod-left-split .view-header-title,
body.mrd-skin-on .workspace-split.mod-right-split .view-header-title {
	font-family: var(--mrd-font-display);
	text-transform: uppercase;
	letter-spacing: 0.14em;
	font-size: 0.8rem;
	color: var(--mrd-bone-dim);
}

/* --- title bar: warm-black + bone, mono. Only takes effect with Obsidian's own
 * window frame selected; with the native/OS frame the compositor draws it and
 * CSS cannot reach it (documented as a prerequisite). --- */
body.mrd-skin-on .titlebar-inner {
	font-family: var(--mrd-font-mono);
	letter-spacing: 0.1em;
	text-transform: uppercase;
	font-size: 0.7rem;
}

/* --- modals, prompts, command palette, quick switcher --- */
body.mrd-skin-on .prompt-input,
body.mrd-skin-on .modal input[type="text"],
body.mrd-skin-on .modal input[type="search"] {
	font-family: var(--mrd-font-mono);
	letter-spacing: 0.04em;
}
body.mrd-skin-on .suggestion-item.is-selected,
body.mrd-skin-on .menu-item.selected,
body.mrd-skin-on .menu-item:hover:not(.is-disabled):not(.is-label) {
	background: rgba(181, 84, 26, 0.16);
	color: var(--mrd-bone);
}
/* Settings-modal section headers read as MERIDIAN placards. */
body.mrd-skin-on .vertical-tab-content .setting-item-heading .setting-item-name,
body.mrd-skin-on .setting-item-heading .setting-item-name {
	font-family: var(--mrd-font-display);
	text-transform: uppercase;
	letter-spacing: 0.14em;
	color: var(--mrd-bone);
}

/* --- context menus: Obsidian draws its own in most cases --- */
body.mrd-skin-on .menu {
	background: var(--mrd-panel-bg);
	border: 1px solid var(--mrd-line);
}
body.mrd-skin-on .menu-item {
	color: var(--mrd-bone);
}

/* --- global search: mono query, amber-tinted match highlights (via vars) --- */
body.mrd-skin-on .search-input-container input {
	font-family: var(--mrd-font-mono);
	letter-spacing: 0.04em;
}

/* ============================================================ reading view — full placards (§3.1/§3.2)
 * The marquee tier: command-deck banners, stencil section numbering, hazard-
 * stripe rules. Per the user's request the same full treatment now applies in
 * BOTH reading and Live Preview (the two tiers were previously split); shared
 * heading visuals live in one place below and each mode wires the counters to
 * its own DOM.
 *
 * Counter scoping note (this was the 1.1 / 1.1 / 1.1 bug): Obsidian's reading
 * view wraps every heading in its OWN block div (.el-h1 / .el-h2 / …), so a
 * counter-reset placed on an <h1> is NOT in scope for the sibling <h2> blocks —
 * and a counter-increment with no reset in scope implicitly resets to 0 on that
 * element, so every H2 came out as .1. The fix is to drive the counters from the
 * .el-hN WRAPPERS, which are true siblings, so H1's reset of the sub-counter
 * reaches the following H2/H3 blocks. Live Preview lines (.HyperMD-header-N) are
 * already flat siblings, so they can carry the counters directly.
 *
 * Numbering is display-only (never leaks into copied Markdown; see the README for
 * the PDF-export caveat + the meridian-skin:false opt-out). In Live Preview the
 * editor only renders on-screen lines, so on a very long note the numbers can
 * drift while scrolled — reading view is always exact (also noted in the README). */

/* ---- shared heading visuals: apply identically in reading + Live Preview so
 * the two modes match and switching between them doesn't jump. ---- */
body.mrd-skin-on .markdown-reading-view :is(h1, h2, h3, h4, h5, h6),
body.mrd-skin-on .markdown-source-view.mod-cm6 .HyperMD-header {
	font-family: var(--mrd-font-display);
	text-transform: uppercase;
	font-weight: 600;
}
/* Text colours. In Live Preview these must land on the inline .cm-header-N
 * spans, not the .HyperMD-header-N line: Obsidian sets heading colour on the
 * span, and a colour inherited from the line element would not override a direct
 * declaration on the span. Letter-spacing rides along on the span too. */
body.mrd-skin-on .markdown-reading-view h1,
body.mrd-skin-on .markdown-source-view.mod-cm6 .cm-header-1 {
	color: var(--mrd-hazard);
	letter-spacing: 0.12em;
}
body.mrd-skin-on .markdown-reading-view h2,
body.mrd-skin-on .markdown-source-view.mod-cm6 .cm-header-2 {
	color: var(--mrd-bone);
	letter-spacing: 0.1em;
}
body.mrd-skin-on .markdown-reading-view h3,
body.mrd-skin-on .markdown-source-view.mod-cm6 .cm-header-3 {
	color: var(--mrd-bone);
	letter-spacing: 0.09em;
}
body.mrd-skin-on .markdown-reading-view h4,
body.mrd-skin-on .markdown-source-view.mod-cm6 .cm-header-4 {
	color: var(--mrd-bone-dim);
	letter-spacing: 0.08em;
}
/* H5/H6 in mono — sub-labels / telemetry. */
body.mrd-skin-on .markdown-reading-view :is(h5, h6),
body.mrd-skin-on .markdown-source-view.mod-cm6 :is(.cm-header-5, .cm-header-6) {
	font-family: var(--mrd-font-mono);
	color: var(--mrd-bone-dim);
	letter-spacing: 0.1em;
}

/* Number prefix — one mono, amber, fixed-width-ish string, shared by both modes.
 * Kept inline (not absolutely positioned) so it never clips against the editor
 * gutter; a stable leading prefix reads calmly and doesn't reflow while typing. */
body.mrd-skin-on .markdown-reading-view h1::before,
body.mrd-skin-on .markdown-source-view.mod-cm6 .HyperMD-header-1::before {
	content: "SECTOR " counter(mrd-sector, decimal-leading-zero) " \\2014 \\00a0";
	color: var(--mrd-amber);
	font-family: var(--mrd-font-mono);
	font-size: 0.62em;
	letter-spacing: 0.08em;
	vertical-align: 0.18em;
}
body.mrd-skin-on .markdown-reading-view h2::before,
body.mrd-skin-on .markdown-source-view.mod-cm6 .HyperMD-header-2::before {
	content: counter(mrd-sector, decimal-leading-zero) "." counter(mrd-sub) "\\00a0\\00a0";
	color: var(--mrd-amber-soft);
	font-family: var(--mrd-font-mono);
	font-size: 0.66em;
	letter-spacing: 0.06em;
}
body.mrd-skin-on .markdown-reading-view h3::before,
body.mrd-skin-on .markdown-source-view.mod-cm6 .HyperMD-header-3::before {
	content: counter(mrd-sector, decimal-leading-zero) "." counter(mrd-sub) "." counter(mrd-subsub) "\\00a0\\00a0";
	color: var(--mrd-amber-soft);
	font-family: var(--mrd-font-mono);
	font-size: 0.68em;
	letter-spacing: 0.06em;
}

/* Vertical rhythm — placards need breathing room. Reading view can carry the
 * full margins; the editor uses lighter margins so adding/removing a heading
 * line doesn't shove the whole document. */
body.mrd-skin-on .markdown-reading-view h1 {
	margin-top: 1.6em;
	margin-bottom: 0.7em;
}
body.mrd-skin-on .markdown-reading-view h2 {
	margin-top: 1.4em;
	margin-bottom: 0.55em;
}
body.mrd-skin-on .markdown-reading-view h3 {
	margin-top: 1.2em;
	margin-bottom: 0.45em;
}

/* Hazard-stripe underline under H1 + the thin amber rule under H2. Both are
 * ABSOLUTELY positioned so they paint over the heading's own padding and never
 * take part in layout — that's what keeps the editor from jumping as lines
 * reflow (the original jerkiness concern). The heading reserves the space with
 * padding-bottom, constant whether or not the rule is drawn. */
body.mrd-skin-on .markdown-reading-view h1,
body.mrd-skin-on .markdown-source-view.mod-cm6 .HyperMD-header-1 {
	position: relative;
	padding-bottom: 0.28em;
}
body.mrd-skin-on .markdown-reading-view h1::after,
body.mrd-skin-on .markdown-source-view.mod-cm6 .HyperMD-header-1::after {
	/* hazard-stripe underline rule — matches .dash-placard::after */
	content: "";
	position: absolute;
	left: 0;
	bottom: 0;
	width: 58px;
	height: 2px;
	background: repeating-linear-gradient(
		-45deg,
		var(--mrd-hazard) 0 5px,
		var(--mrd-warm-black) 5px 10px
	);
}
body.mrd-skin-on .markdown-reading-view h2,
body.mrd-skin-on .markdown-source-view.mod-cm6 .HyperMD-header-2 {
	position: relative;
	padding-bottom: 0.22em;
}
body.mrd-skin-on .markdown-reading-view h2::after,
body.mrd-skin-on .markdown-source-view.mod-cm6 .HyperMD-header-2::after {
	content: "";
	position: absolute;
	left: 0;
	bottom: 0;
	width: 100%;
	height: 1px;
	background: var(--mrd-amber);
	opacity: 0.7;
}

/* ---- counters: reading view via the .el-hN wrappers (see scoping note) ---- */
body.mrd-skin-on .markdown-reading-view {
	counter-reset: mrd-sector 0 mrd-sub 0 mrd-subsub 0;
}
body.mrd-skin-on .markdown-reading-view .el-h1 {
	counter-increment: mrd-sector;
	counter-reset: mrd-sub 0 mrd-subsub 0;
}
body.mrd-skin-on .markdown-reading-view .el-h2 {
	counter-increment: mrd-sub;
	counter-reset: mrd-subsub 0;
}
body.mrd-skin-on .markdown-reading-view .el-h3 {
	counter-increment: mrd-subsub;
}

/* ---- counters: Live Preview lines are flat siblings, so drive them directly ---- */
body.mrd-skin-on .markdown-source-view.mod-cm6 .cm-content {
	counter-reset: mrd-sector 0 mrd-sub 0 mrd-subsub 0;
}
body.mrd-skin-on .markdown-source-view.mod-cm6 .HyperMD-header-1 {
	counter-increment: mrd-sector;
	counter-reset: mrd-sub 0 mrd-subsub 0;
}
body.mrd-skin-on .markdown-source-view.mod-cm6 .HyperMD-header-2 {
	counter-increment: mrd-sub;
	counter-reset: mrd-subsub 0;
}
body.mrd-skin-on .markdown-source-view.mod-cm6 .HyperMD-header-3 {
	counter-increment: mrd-subsub;
}

/* ---- per-note opt-out (meridian-skin: false) ----
 * The plugin adds .mrd-skin-exempt to the exempt note's content container, which
 * wraps both the reading and source views. Drop the numbering + the heavier
 * placard treatment in both, reverting to plain headings, so a note flagged for
 * export/sharing carries no SECTOR NN prefix or rules. */
body.mrd-skin-on .mrd-skin-exempt .markdown-reading-view :is(h1, h2, h3, h4, h5, h6),
body.mrd-skin-on .mrd-skin-exempt .markdown-source-view.mod-cm6 .HyperMD-header {
	font-family: var(--font-text);
	text-transform: none;
	letter-spacing: normal;
	font-weight: 700;
}
body.mrd-skin-on .mrd-skin-exempt .markdown-reading-view :is(h1, h2, h3)::before,
body.mrd-skin-on .mrd-skin-exempt .markdown-reading-view :is(h1, h2)::after,
body.mrd-skin-on .mrd-skin-exempt .markdown-source-view.mod-cm6 :is(.HyperMD-header-1, .HyperMD-header-2, .HyperMD-header-3)::before,
body.mrd-skin-on .mrd-skin-exempt .markdown-source-view.mod-cm6 :is(.HyperMD-header-1, .HyperMD-header-2)::after {
	content: none;
}

/* ============================================================ body + editor content (§4)
 * Full immersion — bone on warm-black, comfortable rhythm. Applies across
 * reading and source view where sensible. */
body.mrd-skin-on .markdown-preview-view,
body.mrd-skin-on .markdown-source-view.mod-cm6 .cm-content {
	font-family: var(--mrd-font-body);
	line-height: 1.6;
}

/* Inline code + code blocks — mono (via var), a subtle ash border + a faint
 * corner tick for the facility feel. */
body.mrd-skin-on .markdown-rendered pre,
body.mrd-skin-on .markdown-source-view.mod-cm6 .HyperMD-codeblock-bg {
	border: 1px solid var(--mrd-ash);
	border-radius: 4px;
}
body.mrd-skin-on .markdown-rendered pre {
	position: relative;
}
body.mrd-skin-on .markdown-rendered pre::before {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	width: 8px;
	height: 8px;
	border-top: 2px solid var(--mrd-amber);
	border-left: 2px solid var(--mrd-amber);
	opacity: 0.55;
}

/* Blockquotes — amber left border (via var) + a small facility glyph, so they
 * read as system readouts. */
body.mrd-skin-on .markdown-rendered blockquote {
	position: relative;
}
body.mrd-skin-on .markdown-rendered blockquote::after {
	content: "\\25B8"; /* small right-pointing triangle — a readout tick */
	position: absolute;
	top: 0.15em;
	left: -0.05em;
	color: var(--mrd-amber);
	font-size: 0.7em;
	opacity: 0.7;
}

/* Callout title bars as small placards, keeping the tuned callout colours. */
body.mrd-skin-on .callout-title {
	font-family: var(--mrd-font-display);
	text-transform: uppercase;
	letter-spacing: 0.1em;
}

/* Tables — ensure horizontal scroll on mobile stays intact (do not force wide
 * fixed widths). Header row in the panel tone (via vars); mono numerics are left
 * to the user. */
body.mrd-skin-on .markdown-rendered table {
	border: 1px solid var(--mrd-line);
}
body.mrd-skin-on .markdown-rendered th {
	font-family: var(--mrd-font-display);
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: var(--mrd-bone);
}

/* Selection tint in the editor (Obsidian's --text-selection covers most, this
 * catches the raw ::selection in the CM editor). */
body.mrd-skin-on .cm-editor .cm-selectionBackground,
body.mrd-skin-on .markdown-rendered ::selection {
	background: rgba(181, 84, 26, 0.28);
}

/* ============================================================ mobile chrome (§6.2)
 * The mobile DOM is not identical to desktop — the ribbon and tab bar render
 * differently and the OS status bar (clock/battery) is never reachable. These
 * selectors are the mobile-only companions to the desktop chrome above; the
 * editor/reading/heading rules already apply on mobile unchanged.
 * VERIFY ON DEVICE — the agent build environment cannot render mobile chrome. */
body.mrd-skin-on.is-mobile .mobile-navbar,
body.mrd-skin-on.is-mobile .mobile-toolbar {
	background: var(--mrd-warm-black);
	border-color: var(--mrd-line);
}
body.mrd-skin-on.is-mobile .mobile-navbar-action.is-active {
	color: var(--mrd-hazard);
}
body.mrd-skin-on.is-mobile .workspace-drawer-header {
	font-family: var(--mrd-font-display);
	text-transform: uppercase;
	letter-spacing: 0.12em;
	color: var(--mrd-bone-dim);
}
`;

/**
 * Decide whether a note is exempt from the app-wide skin's numbering + heavy
 * placards, from its frontmatter. The switch is `meridian-skin: false` (§3.2);
 * any other value (absent, true, a string) keeps the skin on. Pure so it can be
 * unit-tested without a live metadata cache.
 */
export function isSkinExempt(
	frontmatter: Record<string, unknown> | undefined | null
): boolean {
	return frontmatter?.["meridian-skin"] === false;
}
