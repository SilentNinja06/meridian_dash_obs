import type { LocalEventsStore } from "dash-core";
import type MeridianDashPlugin from "./main";

/** Adapts the plugin's local-event CRUD to core's LocalEventsStore, so the
 * (now core) event modal never depends on the concrete plugin. */
export function meridianLocalEvents(plugin: MeridianDashPlugin): LocalEventsStore {
	return {
		add: (patch) => plugin.addLocalEvent(patch),
		update: (id, patch) => plugin.updateLocalEvent(id, patch),
		remove: (id) => plugin.removeLocalEvent(id),
	};
}
