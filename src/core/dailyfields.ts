import { FieldSpec, headingField, labelField } from "./dailynote";

/**
 * The daily-note free-text sections the dashboard reads and writes, defined once
 * so the Daily Log panel and the log commands / URI actions (§1.1) target the
 * exact same regions. The specs mirror the bundled colon-free template.
 */
const SUPPLEMENTAL_STOP = /^\s*-\s+Supplemental\s*:?\s*$/i;
const SPIRAL_MARKER = /%%\s*spiral-log\s*%%/i;

export type LogField = "primary" | "supplemental" | "musing" | "reconsider";

/** Allowlist for the `field=` URI parameter (§1.1). */
export const LOG_FIELDS: LogField[] = ["primary", "supplemental", "musing", "reconsider"];

export const LOG_FIELD_SPECS: Record<LogField, FieldSpec> = {
	primary: labelField("Primary", [SUPPLEMENTAL_STOP, SPIRAL_MARKER]),
	supplemental: labelField("Supplemental", [SPIRAL_MARKER]),
	musing: headingField("Musings"),
	reconsider: headingField("Reconsider tomorrow"),
};

export const LOG_FIELD_LABELS: Record<LogField, string> = {
	primary: "Daily log · Primary",
	supplemental: "Daily log · Supplemental",
	musing: "Musings",
	reconsider: "Reconsider tomorrow",
};

export function isLogField(v: string): v is LogField {
	return (LOG_FIELDS as string[]).includes(v);
}
