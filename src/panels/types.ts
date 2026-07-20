import { App } from "obsidian";
import type MeridianDashPlugin from "../main";
import type { Bridge } from "../core/bridge";
import type { TodoStore } from "../core/todostore";
import type { MeridianSettings } from "../settings";

export type RefreshReason = "open" | "interval" | "vault" | "manual";

/** Cross-panel runtime hints (not persisted). */
export interface MeridianRuntime {
	/** ms timestamp the session started (this view open). */
	sessionStart: number;
	/** ms timestamp of the previous session's last access (for `session` pool). */
	previousAccess: number;
	/** Recent MERIDIAN lines shown this session, to avoid repeats. */
	recentLines: string[];
	/** While `Date.now() < foodFocusUntil`, the `food` pool is eligible (§7.3). */
	foodFocusUntil: number;
	/** While `Date.now() < typingUntil`, the Operator is typing in a free-text
	 * field; the vault-refresh bus is deferred so the layout doesn't jump. */
	typingUntil: number;
	/** YYYY-MM-DD on which the streak set a new all-time record — a milestone
	 * trigger for that day (§2.2). "" otherwise. */
	streakRecordDate: string;
}

export interface PanelContext {
	app: App;
	plugin: MeridianDashPlugin;
	bridge: Bridge;
	todos: TodoStore;
	runtime: MeridianRuntime;
	settings(): MeridianSettings;
	/** Re-render all mounted panels. */
	requestRefresh(reason?: RefreshReason): void;
	/** Signal that the Operator interacted with a food surface — nudges MERIDIAN's
	 * `food` pool for a short window (§7.3). */
	markFoodFocus(): void;
}

/** A dashboard panel module (§4). */
export interface Panel {
	id: string;
	title: string;
	mount(el: HTMLElement, ctx: PanelContext): void | Promise<void>;
	refresh?(reason?: RefreshReason): void | Promise<void>;
	unmount?(): void;
}

/**
 * Base class handling the mount/draw/refresh/cleanup lifecycle. Long-lived
 * timers and subscriptions go in `setup()` (run once on mount); `renderBody()`
 * draws into a cleared element and may run on every refresh.
 */
export abstract class BasePanel implements Panel {
	abstract id: string;
	abstract title: string;
	protected el!: HTMLElement;
	protected ctx!: PanelContext;
	private cleanups: Array<() => void> = [];

	async mount(el: HTMLElement, ctx: PanelContext): Promise<void> {
		this.el = el;
		this.ctx = ctx;
		await this.setup();
		await this.draw();
	}

	async refresh(reason?: RefreshReason): Promise<void> {
		if (this.el?.isConnected) await this.draw(reason);
	}

	unmount(): void {
		for (const c of this.cleanups) {
			try {
				c();
			} catch {
				/* ignore */
			}
		}
		this.cleanups = [];
	}

	protected onCleanup(fn: () => void): void {
		this.cleanups.push(fn);
	}

	/** One-time setup (intervals, event subscriptions). Optional. */
	protected async setup(): Promise<void> {
		/* override as needed */
	}

	/** Re-run the body render from within the panel (after a local change). */
	protected rerender(): void {
		void this.draw("manual");
	}

	private async draw(reason?: RefreshReason): Promise<void> {
		this.el.empty();
		await this.renderBody(reason);
	}

	protected abstract renderBody(reason?: RefreshReason): void | Promise<void>;

	protected setInterval(fn: () => void, ms: number): void {
		const id = window.setInterval(fn, ms);
		this.onCleanup(() => window.clearInterval(id));
	}
}

// ------------------------------------------------------- small DOM helpers

/** A stenciled panel placard header (§5). Returns the placard element so panels
 * can append status chips on the right. */
export function placard(el: HTMLElement, title: string): HTMLElement {
	const head = el.createDiv({ cls: "mrd-placard" });
	head.createSpan({ cls: "mrd-placard-title", text: title.toUpperCase() });
	return head;
}
