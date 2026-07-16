import { moment } from "obsidian";
import { BasePanel, placard } from "./types";

/**
 * Quote of the Day (§7.2).
 *
 * LANDMINE — epoch-day desync. `scripts/qotd/view.js` derives its day number
 * from the daily-note *filename* (`moment("YYYY-MM-DD")` = local midnight). An
 * ItemView has no filename, so a naive `moment()` uses the current instant and,
 * once the local clock has crossed into the next UTC day (from ~17:00 PDT),
 * `floor(valueOf()/86400000)` increments a day early — the dashboard and the
 * daily note would disagree for ~7 hours a day. We reproduce the filename path
 * exactly by round-tripping through the local date string.
 *
 * `n` is read from the file at runtime — never hardcoded (it has grown 665 →
 * 725 and will grow again). `quotes.json` is read-only to this plugin; the
 * daily-note Dataview block is left untouched. `dv.view()` is unavailable in an
 * ItemView, so we read the JSON ourselves via the vault adapter.
 */
const QUOTES_PATH = "scripts/qotd/quotes.json";

interface Quote {
	text: string;
	author: string;
}

export class QotdPanel extends BasePanel {
	id = "qotd";
	title = "Quote of the Day";

	protected async renderBody(): Promise<void> {
		placard(this.el, "Quote of the Day");
		const card = this.el.createDiv({ cls: "mrd-qotd" });

		let raw: string;
		try {
			raw = await this.ctx.app.vault.adapter.read(QUOTES_PATH);
		} catch {
			card.createDiv({
				cls: "mrd-muted",
				text: "The quotation archive is not on file at scripts/qotd/quotes.json. Nothing is broken; there is simply nothing to observe here yet.",
			});
			return;
		}

		const quotes = parseQuotes(raw);
		const n = quotes.length;
		if (n === 0) {
			card.createDiv({ cls: "mrd-muted", text: "The quotation archive is present but empty." });
			return;
		}

		// Reproduce the daily-note filename path exactly (local midnight).
		const m = moment(moment().format("YYYY-MM-DD"), "YYYY-MM-DD");
		const dayNumber = Math.floor(m.valueOf() / 86400000);
		const idx = ((dayNumber % n) + n) % n;
		const q = quotes[idx];

		const mark = card.createDiv({ cls: "mrd-qotd-mark", text: "“" });
		mark.setAttribute("aria-hidden", "true");
		card.createDiv({ cls: "mrd-qotd-text", text: q.text });
		if (q.author) card.createDiv({ cls: "mrd-qotd-author", text: `— ${q.author}` });
	}
}

/** Tolerant of a single JSON array of pairs and of JSONL (one `["q","a"]` per
 * line). Entries may be `[text, author]` pairs or `{quote, author}` objects. */
function parseQuotes(raw: string): Quote[] {
	const toQuote = (entry: unknown): Quote | null => {
		if (Array.isArray(entry)) return { text: String(entry[0] ?? "").trim(), author: String(entry[1] ?? "").trim() };
		if (entry && typeof entry === "object") {
			const o = entry as Record<string, unknown>;
			const text = String(o.quote ?? o.text ?? "").trim();
			return text ? { text, author: String(o.author ?? "").trim() } : null;
		}
		return null;
	};

	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) {
			return parsed.map(toQuote).filter((q): q is Quote => !!q && !!q.text);
		}
	} catch {
		/* fall through to JSONL */
	}

	const out: Quote[] = [];
	for (const line of raw.split("\n")) {
		const t = line.trim().replace(/,\s*$/, "");
		if (!t || t === "[" || t === "]") continue;
		try {
			const q = toQuote(JSON.parse(t));
			if (q && q.text) out.push(q);
		} catch {
			/* skip malformed line */
		}
	}
	return out;
}
