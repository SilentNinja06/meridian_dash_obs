/**
 * Design tokens — the Halcyon Systems palette (§5). The canonical source of
 * these values for styling is `styles.css` (as `--mrd-*` custom properties);
 * this module mirrors the hexes for the few places JavaScript needs a literal
 * colour (per-calendar swatches, inline SVG marks). Keep the two in sync.
 */
export const PALETTE = {
	/** Warm Black — background */
	warmBlack: "#16140F",
	/** Institutional Bone — primary text / surface */
	bone: "#D8CFB8",
	/** Burnt Amber — primary accent */
	amber: "#B5541A",
	/** Containment Red — alert / destructive */
	red: "#8C1F1F",
	/** Slate Teal — the deliberate cold note */
	teal: "#3E5650",
	/** Hazard Yellow — stripes, warnings, focus rings (sparing) */
	hazard: "#D9A441",
	/** Ash Grey — muted UI chrome */
	ash: "#2A2722",
} as const;

/**
 * Per-calendar swatch palette for the agenda (§7.5). Drawn from the Halcyon
 * palette; deliberately excludes Containment Red (reserved for alerts) and
 * keeps Hazard Yellow sparing.
 */
export const CALENDAR_COLORS: string[] = [
	PALETTE.amber,
	PALETTE.teal,
	PALETTE.hazard,
	PALETTE.bone,
	"#7A8B6F", // moss — a cool secondary derived from teal/bone
	"#C97B4A", // warm sand — a lighter amber
	"#5B6E86", // dusk blue — a colder companion to teal
	"#A88C6A", // taupe — muted bone
	"#8E6F4E", // umber
	"#6F8079", // pale teal
];

export function calendarColor(index: number): string {
	return CALENDAR_COLORS[index % CALENDAR_COLORS.length];
}
