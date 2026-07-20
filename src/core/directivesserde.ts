import type { TodoItem } from "./todostore";

/**
 * Pure (Obsidian-free) serialization for the Directives Markdown file, extracted
 * so the round-trip can be unit-tested. The list is stored as JSON inside a
 * fenced block in a `.md` file — Markdown always syncs via Obsidian Sync, so the
 * directives cross devices (see DirectivesStore for the full rationale). New
 * optional `TodoItem` fields (sub-items, per-occurrence sub-completions, note)
 * ride along in the JSON with no format change.
 */
interface DirectivesFile {
	version: number;
	todos: TodoItem[];
}

export const DIRECTIVES_HEADER =
	"%% MERIDIAN Dashboard — persistent directives. Managed automatically; " +
	"edit these in the dashboard, not here. %%";

/** JSON payload wrapped in a fenced block inside a Markdown file. */
export function buildMarkdown(items: TodoItem[]): string {
	const json = JSON.stringify({ version: 1, todos: items } as DirectivesFile, null, 2);
	return `${DIRECTIVES_HEADER}\n\n\`\`\`json\n${json}\n\`\`\`\n`;
}

/** Extract the todo list from a directives file. Tolerates a fenced ```json
 * block (current format) and a raw-JSON body (legacy `.json`). */
export function parseTodos(raw: string): TodoItem[] {
	const fenced = raw.match(/```json\s*([\s\S]*?)```/);
	const candidate = fenced ? fenced[1] : raw;
	try {
		const parsed = JSON.parse(candidate) as DirectivesFile;
		return Array.isArray(parsed?.todos) ? parsed.todos : [];
	} catch {
		return [];
	}
}
