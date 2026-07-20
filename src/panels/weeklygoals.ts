import { App, Modal, Notice, Setting, moment } from "obsidian";
import type MeridianDashPlugin from "../main";

/**
 * Weekly goals: at the start of a week the operator can jot a few goals. They're
 * drawn on the printed week planner and can each be sent to the Directives list.
 * Goals are keyed by the week-start date. Plainly-functional UI — not MERIDIAN
 * utterances.
 */
export function weekKeyOf(weekStart: moment.Moment): string {
	return weekStart.clone().startOf("week").format("YYYY-MM-DD");
}

export function currentWeekKey(): string {
	return weekKeyOf(moment());
}

/** "Jul 20 – Jul 26" for a week key (YYYY-MM-DD week start). */
export function weekLabel(weekKey: string): string {
	const start = moment(weekKey, "YYYY-MM-DD");
	return `${start.format("MMM D")} – ${start.clone().add(6, "days").format("MMM D")}`;
}

export class WeeklyGoalsModal extends Modal {
	private draft = "";

	constructor(app: App, private plugin: MeridianDashPlugin, private weekKey: string, private onDone: () => void) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(`Weekly goals · ${weekLabel(this.weekKey)}`);
		this.render();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		const goals = this.plugin.weeklyGoalsFor(this.weekKey);

		const list = contentEl.createDiv({ cls: "mrd-goals-list" });
		if (goals.length === 0) {
			list.createDiv({ cls: "mrd-muted", text: "No goals set for this week yet." });
		}
		for (const goal of goals) {
			const row = list.createDiv({ cls: "mrd-goals-row" });
			row.createSpan({ cls: "mrd-goals-text", text: goal.text });
			const actions = row.createDiv({ cls: "mrd-goals-actions" });
			const toDir = actions.createEl("button", { cls: "mrd-btn mrd-btn-sm", text: "→ Directive" });
			toDir.addEventListener("click", () => void this.toDirective(goal.text));
			const del = actions.createEl("button", { cls: "mrd-icon-btn", text: "🗑", attr: { "aria-label": "Remove goal", title: "Remove goal" } });
			del.addEventListener("click", async () => {
				await this.plugin.removeWeeklyGoal(this.weekKey, goal.id);
				this.onDone();
				this.render();
			});
		}

		const addRow = new Setting(contentEl).setName("Add a goal");
		addRow.addText((t) => {
			t.setPlaceholder("A goal for the week").setValue(this.draft).onChange((v) => (this.draft = v));
			t.inputEl.classList.add("mrd-modal-wide");
			t.inputEl.focus();
			t.inputEl.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					void this.add();
				}
			});
		});
		addRow.addButton((b) => b.setButtonText("Add").setCta().onClick(() => void this.add()));

		new Setting(contentEl).addButton((b) => b.setButtonText("Done").onClick(() => this.close()));
	}

	private async add(): Promise<void> {
		const text = this.draft.trim();
		if (!text) return;
		await this.plugin.addWeeklyGoal(this.weekKey, text);
		this.draft = "";
		this.onDone();
		this.render();
	}

	/** Send a goal to the Directives list as a one-time item due at week's end. */
	private async toDirective(text: string): Promise<void> {
		const due = moment(this.weekKey, "YYYY-MM-DD").add(6, "days").format("YYYY-MM-DD");
		await this.plugin.todos.add({ text, dueDate: due });
		new Notice("Added to Directives.");
		this.onDone();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
