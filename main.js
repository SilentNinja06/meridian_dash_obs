/*
MERIDIAN Dashboard — an Obsidian plugin. HALCYON SYSTEMS.
This is a bundled build. Source: https://github.com/SilentNinja06/meridian_dash_obs
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MeridianDashPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian28 = require("obsidian");

// src/settings.ts
var import_obsidian25 = require("obsidian");

// src/core/tokens.ts
var PALETTE = {
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
  ash: "#2A2722"
};
var CALENDAR_COLORS = [
  PALETTE.amber,
  PALETTE.teal,
  PALETTE.hazard,
  PALETTE.bone,
  "#7A8B6F",
  // moss — a cool secondary derived from teal/bone
  "#C97B4A",
  // warm sand — a lighter amber
  "#5B6E86",
  // dusk blue — a colder companion to teal
  "#A88C6A",
  // taupe — muted bone
  "#8E6F4E",
  // umber
  "#6F8079"
  // pale teal
];
function calendarColor(index) {
  return CALENDAR_COLORS[index % CALENDAR_COLORS.length];
}

// node_modules/dash-core/src/core/ics.ts
var import_obsidian = require("obsidian");
function tzOffsetMinutes(tz, utcMs) {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const parts = dtf.formatToParts(new Date(utcMs));
    const map = {};
    for (const p of parts) if (p.type !== "literal") map[p.type] = Number(p.value);
    const asUTC = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
    return (asUTC - utcMs) / 6e4;
  } catch (e) {
    return 0;
  }
}
function toEpochMs(v) {
  if (v.zone === "utc") return Date.UTC(v.y, v.mo - 1, v.d, v.h, v.mi, v.s);
  if (v.zone === "local") return new Date(v.y, v.mo - 1, v.d, v.h, v.mi, v.s).getTime();
  const guess = Date.UTC(v.y, v.mo - 1, v.d, v.h, v.mi, v.s);
  let off = tzOffsetMinutes(v.zone, guess);
  let utc = guess - off * 6e4;
  off = tzOffsetMinutes(v.zone, utc);
  utc = guess - off * 6e4;
  return utc;
}
function unfold(text) {
  const raw = text.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("	")) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}
function parseDateVal(rawKey, value) {
  const params = rawKey.split(";").slice(1);
  let tzid = "";
  let isDate = false;
  for (const p of params) {
    const [k, v2] = p.split("=");
    if (k.toUpperCase() === "TZID") tzid = v2;
    if (k.toUpperCase() === "VALUE" && v2.toUpperCase() === "DATE") isDate = true;
  }
  const v = value.trim();
  if (isDate || /^\d{8}$/.test(v)) {
    return {
      allDay: true,
      y: +v.slice(0, 4),
      mo: +v.slice(4, 6),
      d: +v.slice(6, 8),
      h: 0,
      mi: 0,
      s: 0,
      zone: "local"
    };
  }
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) {
    const mm = (0, import_obsidian.moment)(v);
    return { allDay: false, y: mm.year(), mo: mm.month() + 1, d: mm.date(), h: mm.hour(), mi: mm.minute(), s: mm.second(), zone: "local" };
  }
  const zone = m[7] ? "utc" : tzid || "local";
  return { allDay: false, y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: +m[6], zone };
}
var WEEKDAY_CODES = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
function parseRRule(value) {
  const parts = {};
  for (const seg of value.split(";")) {
    const [k, v] = seg.split("=");
    if (k && v) parts[k.toUpperCase()] = v;
  }
  const freq = parts.FREQ;
  if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)) return void 0;
  const rule = { freq, interval: Math.max(1, Number(parts.INTERVAL) || 1) };
  if (parts.COUNT) rule.count = Number(parts.COUNT);
  if (parts.UNTIL) rule.until = parseDateVal("UNTIL", parts.UNTIL);
  if (parts.BYDAY) {
    rule.byday = parts.BYDAY.split(",").map((c) => WEEKDAY_CODES[c.replace(/^[+-]?\d+/, "").toUpperCase()]).filter((n) => n !== void 0);
  }
  if (parts.BYMONTHDAY) rule.bymonthday = parts.BYMONTHDAY.split(",").map(Number);
  return rule;
}
function parseICS(text) {
  const lines = unfold(text);
  const events = [];
  let cur = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = { summary: "", location: "", uid: "", exdates: /* @__PURE__ */ new Set() };
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur && cur.start) events.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const rawKey = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const key = rawKey.split(";")[0].toUpperCase();
    switch (key) {
      case "UID":
        cur.uid = value.trim();
        break;
      case "SUMMARY":
        cur.summary = unescapeText(value);
        break;
      case "LOCATION":
        cur.location = unescapeText(value);
        break;
      case "DTSTART":
        cur.start = parseDateVal(rawKey, value);
        break;
      case "DTEND":
        cur.end = parseDateVal(rawKey, value);
        break;
      case "RRULE":
        cur.rrule = parseRRule(value);
        break;
      case "EXDATE": {
        for (const piece of value.split(",")) {
          const dv = parseDateVal(rawKey, piece);
          cur.exdates.add(canonicalDate(dv));
        }
        break;
      }
      case "RECURRENCE-ID": {
        cur.recurrenceId = canonicalDate(parseDateVal(rawKey, value));
        break;
      }
    }
  }
  return events;
}
function unescapeText(v) {
  return v.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\").trim();
}
function canonicalDate(v) {
  return `${pad4(v.y)}-${pad2(v.mo)}-${pad2(v.d)}`;
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function pad4(n) {
  return String(n).padStart(4, "0");
}
function occurrencesOn(ev, targetDate) {
  const start = ev.start;
  const localDateOf = (v) => v.allDay ? canonicalDate(v) : (0, import_obsidian.moment)(toEpochMs(v)).format("YYYY-MM-DD");
  if (!ev.rrule) {
    if (localDateOf(start) === targetDate) return [start];
    if (ev.end && spansDate(ev, targetDate)) return [start];
    return [];
  }
  const rule = ev.rrule;
  const results = [];
  const targetEndMs = (0, import_obsidian.moment)(targetDate, "YYYY-MM-DD").endOf("day").valueOf();
  const untilMs = rule.until ? toEpochMs(rule.until) : Infinity;
  let emitted = 0;
  const guard = 2e4;
  const cursor = { y: start.y, mo: start.mo, d: start.d };
  for (let i = 0; i < guard; i++) {
    const candidates = expandPeriod(rule, cursor, start);
    for (const cand of candidates) {
      const occ = { ...start, y: cand.y, mo: cand.mo, d: cand.d };
      const occMs = occ.allDay ? Date.UTC(occ.y, occ.mo - 1, occ.d) : toEpochMs(occ);
      if (compareTuple(cand, { y: start.y, mo: start.mo, d: start.d }) < 0) continue;
      if (occMs > untilMs && rule.until) return results;
      if (ev.exdates.has(canonicalDate(occ))) continue;
      emitted++;
      if (localDateOf(occ) === targetDate) results.push(occ);
      if (rule.count && emitted >= rule.count) return results;
    }
    advancePeriod(rule, cursor);
    const cursorStartMs = Date.UTC(cursor.y, cursor.mo - 1, cursor.d);
    if (cursorStartMs > targetEndMs + 8 * 864e5) break;
  }
  return results;
}
function expandPeriod(rule, cursor, start) {
  if (rule.freq === "WEEKLY" && rule.byday && rule.byday.length) {
    const base = new Date(Date.UTC(cursor.y, cursor.mo - 1, cursor.d));
    const dow = base.getUTCDay();
    const weekStart = new Date(base.getTime() - dow * 864e5);
    return rule.byday.slice().sort((a, b) => a - b).map((wd) => {
      const dt = new Date(weekStart.getTime() + wd * 864e5);
      return { y: dt.getUTCFullYear(), mo: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
    });
  }
  if (rule.freq === "MONTHLY" && rule.bymonthday && rule.bymonthday.length) {
    return rule.bymonthday.map((md) => clampDay({ y: cursor.y, mo: cursor.mo, d: md }));
  }
  return [{ y: cursor.y, mo: cursor.mo, d: cursor.d }];
}
function advancePeriod(rule, cursor) {
  const step = rule.interval;
  if (rule.freq === "DAILY") {
    const dt = new Date(Date.UTC(cursor.y, cursor.mo - 1, cursor.d + step));
    assign(cursor, dt);
  } else if (rule.freq === "WEEKLY") {
    const dt = new Date(Date.UTC(cursor.y, cursor.mo - 1, cursor.d + 7 * step));
    assign(cursor, dt);
  } else if (rule.freq === "MONTHLY") {
    let mo = cursor.mo - 1 + step;
    let y = cursor.y + Math.floor(mo / 12);
    mo = (mo % 12 + 12) % 12;
    cursor.y = y;
    cursor.mo = mo + 1;
  } else {
    cursor.y += step;
  }
}
function assign(cursor, dt) {
  cursor.y = dt.getUTCFullYear();
  cursor.mo = dt.getUTCMonth() + 1;
  cursor.d = dt.getUTCDate();
}
function clampDay(t) {
  const dim = new Date(Date.UTC(t.y, t.mo, 0)).getUTCDate();
  return { y: t.y, mo: t.mo, d: Math.min(t.d, dim) };
}
function compareTuple(a, b) {
  return a.y - b.y || a.mo - b.mo || a.d - b.d;
}
function spansDate(ev, targetDate) {
  if (!ev.end) return false;
  const startDay = ev.start.allDay ? canonicalDate(ev.start) : (0, import_obsidian.moment)(toEpochMs(ev.start)).format("YYYY-MM-DD");
  const endMs = ev.end.allDay ? (0, import_obsidian.moment)(canonicalDate(ev.end), "YYYY-MM-DD").valueOf() : toEpochMs(ev.end);
  const targetStartMs = (0, import_obsidian.moment)(targetDate, "YYYY-MM-DD").startOf("day").valueOf();
  const startMs = ev.start.allDay ? (0, import_obsidian.moment)(startDay, "YYYY-MM-DD").valueOf() : toEpochMs(ev.start);
  return startMs <= (0, import_obsidian.moment)(targetDate, "YYYY-MM-DD").endOf("day").valueOf() && endMs > targetStartMs;
}
function eventsOnDate(events, localDate) {
  const overridden = /* @__PURE__ */ new Set();
  for (const ev of events) if (ev.recurrenceId) overridden.add(`${ev.uid}|${ev.recurrenceId}`);
  const items = [];
  for (const ev of events) {
    const occs = ev.recurrenceId ? occurrencesOn(ev, localDate) : occurrencesOn(ev, localDate).filter(
      (o) => !overridden.has(`${ev.uid}|${canonicalDate(o)}`)
    );
    for (const occ of occs) items.push(toAgendaItem(ev, occ));
  }
  items.sort((a, b) => a.sortKey - b.sortKey || a.summary.localeCompare(b.summary));
  return items;
}
function toAgendaItem(ev, occ) {
  if (occ.allDay) {
    return {
      summary: ev.summary || "(untitled)",
      location: ev.location,
      allDay: true,
      startMs: (0, import_obsidian.moment)(canonicalDate(occ), "YYYY-MM-DD").valueOf(),
      timeLabel: "",
      sortKey: -1
    };
  }
  const startMs = toEpochMs(occ);
  const startM = (0, import_obsidian.moment)(startMs);
  let timeLabel = startM.format("HH:mm");
  let endMs;
  if (ev.end && !ev.end.allDay) {
    const origStart = toEpochMs(ev.start);
    const origEnd = toEpochMs(ev.end);
    const durMs = Math.max(0, origEnd - origStart);
    endMs = startMs + durMs;
    timeLabel += `\u2013${(0, import_obsidian.moment)(endMs).format("HH:mm")}`;
  }
  return {
    summary: ev.summary || "(untitled)",
    location: ev.location,
    allDay: false,
    startMs,
    endMs,
    timeLabel,
    sortKey: startM.hour() * 60 + startM.minute()
  };
}
async function fetchICS(url) {
  const res = await (0, import_obsidian.requestUrl)({ url, method: "GET", throw: false });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.text;
}

// node_modules/dash-core/src/core/agendamath.ts
function agendaState(items, now) {
  const timed = items.filter((i) => !i.allDay).sort((a, b) => a.startMs - b.startMs);
  const inProgress = timed.filter((i) => i.endMs !== void 0 && i.startMs <= now && i.endMs > now).sort((a, b) => a.endMs - b.endMs)[0];
  const nextEvent = timed.find((i) => i.startMs > now);
  if (inProgress) {
    const gapStart = inProgress.endMs;
    return {
      kind: "now",
      summary: inProgress.summary,
      untilMs: gapStart - now,
      gapMs: nextEvent ? Math.max(0, nextEvent.startMs - gapStart) : void 0
    };
  }
  if (nextEvent) {
    return {
      kind: "next",
      summary: nextEvent.summary,
      untilMs: nextEvent.startMs - now,
      gapMs: nextEvent.startMs - now
    };
  }
  return { kind: "clear" };
}
function formatGap(ms) {
  const totalMin = Math.floor(Math.max(0, ms) / 6e4);
  if (totalMin < 1) return "less than a minute";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// node_modules/dash-core/src/core/localevents.ts
function localEventToAgendaItem(ev) {
  const [y, mo, d] = ev.date.split("-").map(Number);
  if (!ev.start) {
    return {
      summary: ev.summary || "(untitled)",
      location: "",
      allDay: true,
      startMs: new Date(y, mo - 1, d).getTime(),
      timeLabel: "",
      sortKey: -1
    };
  }
  const [sh, sm] = ev.start.split(":").map(Number);
  const startMs = new Date(y, mo - 1, d, sh, sm).getTime();
  let endMs;
  let timeLabel = ev.start;
  if (ev.end) {
    const [eh, em] = ev.end.split(":").map(Number);
    endMs = new Date(y, mo - 1, d, eh, em).getTime();
    timeLabel += `\u2013${ev.end}`;
  }
  return {
    summary: ev.summary || "(untitled)",
    location: "",
    allDay: false,
    startMs,
    endMs,
    timeLabel,
    sortKey: sh * 60 + sm
  };
}

// node_modules/dash-core/src/core/todostore.ts
var import_obsidian3 = require("obsidian");

// node_modules/dash-core/src/core/dailynote.ts
var import_obsidian2 = require("obsidian");
function getDailyNotesOptions(app) {
  var _a, _b, _c, _d;
  const dn = (_b = (_a = app.internalPlugins) == null ? void 0 : _a.getPluginById) == null ? void 0 : _b.call(_a, "daily-notes");
  return (_d = (_c = dn == null ? void 0 : dn.instance) == null ? void 0 : _c.options) != null ? _d : {};
}
function dailyNotePath(app, date) {
  var _a;
  const opts = getDailyNotesOptions(app);
  const format = opts.format || "YYYY-MM-DD";
  const folder = ((_a = opts.folder) != null ? _a : "").trim().replace(/\/+$/, "");
  const d = date != null ? date : (0, import_obsidian2.moment)().format("YYYY-MM-DD");
  const name = (0, import_obsidian2.moment)(d, "YYYY-MM-DD").format(format);
  return (0, import_obsidian2.normalizePath)((folder ? folder + "/" : "") + name + ".md");
}
function getDailyNoteFile(app, date) {
  const f = app.vault.getAbstractFileByPath(dailyNotePath(app, date));
  return f instanceof import_obsidian2.TFile ? f : null;
}
async function ensureDailyNote(app, date) {
  const path = dailyNotePath(app, date);
  const existing = app.vault.getAbstractFileByPath(path);
  if (existing instanceof import_obsidian2.TFile) return existing;
  await ensureParentFolder(app, path);
  const opts = getDailyNotesOptions(app);
  const body = await renderDailyTemplate(app, opts, path, date != null ? date : (0, import_obsidian2.moment)().format("YYYY-MM-DD"));
  const raced = app.vault.getAbstractFileByPath(path);
  if (raced instanceof import_obsidian2.TFile) return raced;
  return app.vault.create(path, body);
}
async function ensureParentFolder(app, path) {
  const dir = path.split("/").slice(0, -1).join("/");
  if (!dir) return;
  if (app.vault.getAbstractFileByPath(dir) instanceof import_obsidian2.TFolder) return;
  await app.vault.createFolder(dir).catch(() => {
  });
}
async function renderDailyTemplate(app, opts, dailyPath, date) {
  var _a, _b, _c;
  const templateSetting = ((_a = opts.template) != null ? _a : "").trim();
  if (!templateSetting) return "";
  const templatePath = (0, import_obsidian2.normalizePath)(
    templateSetting.endsWith(".md") ? templateSetting : templateSetting + ".md"
  );
  const tFile = app.vault.getAbstractFileByPath(templatePath);
  if (!(tFile instanceof import_obsidian2.TFile)) return "";
  const raw = await app.vault.cachedRead(tFile);
  const basename = (_c = (_b = dailyPath.split("/").pop()) == null ? void 0 : _b.replace(/\.md$/, "")) != null ? _c : "";
  const m = (0, import_obsidian2.moment)(date, "YYYY-MM-DD");
  const now = (0, import_obsidian2.moment)();
  return raw.replace(/{{\s*title\s*}}/gi, basename).replace(/{{\s*date(?::([^}]+))?\s*}}/gi, (_, fmt) => m.format(fmt || "YYYY-MM-DD")).replace(/{{\s*time(?::([^}]+))?\s*}}/gi, (_, fmt) => now.format(fmt || "HH:mm"));
}
var HEADING_RE = /^#{1,6}\s/;
function headingField(heading) {
  const esc = heading.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { anchor: new RegExp(`^#{1,6}\\s+${esc}:?\\s*$`, "i") };
}
function labelField(label, stops) {
  const esc = label.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { anchor: new RegExp(`^\\s*-\\s+${esc}\\s*:?\\s*$`, "i"), stops };
}
function locate(lines, spec) {
  var _a;
  const anchorIdx = lines.findIndex((l) => spec.anchor.test(l));
  if (anchorIdx === -1) return null;
  const stopAtHeading = spec.stopAtHeading !== false;
  let end = lines.length;
  for (let i = anchorIdx + 1; i < lines.length; i++) {
    if (stopAtHeading && HEADING_RE.test(lines[i])) {
      end = i;
      break;
    }
    if ((_a = spec.stops) == null ? void 0 : _a.some((re) => re.test(lines[i]))) {
      end = i;
      break;
    }
  }
  return { anchorIdx, start: anchorIdx + 1, end };
}
function readField(content, spec) {
  const lines = content.split("\n");
  const r = locate(lines, spec);
  if (!r) return "";
  return lines.slice(r.start, r.end).join("\n").replace(/^\n+/, "").replace(/\s+$/, "");
}
function replaceField(content, spec, body) {
  const lines = content.split("\n");
  const r = locate(lines, spec);
  if (!r) return content;
  const bodyLines = body.replace(/\s+$/, "").split("\n");
  const replacement = body.trim() ? ["", ...bodyLines, ""] : [""];
  lines.splice(r.start, r.end - r.start, ...replacement);
  return lines.join("\n");
}
var PLUGIN_LOG_LINE = /^- \d{2}:\d{2}\b/;
function insertLogLine(content, line, opts) {
  var _a;
  const lines = content.split("\n");
  if (lines.some((l) => l.trim() === line.trim())) return content;
  let anchor = -1;
  const marker = (_a = opts.marker) == null ? void 0 : _a.trim();
  if (marker) anchor = lines.findIndex((l) => l.includes(marker));
  if (anchor === -1) {
    const heading = opts.heading.trim().toLowerCase().replace(/:$/, "");
    anchor = lines.findIndex((l) => {
      const m = l.match(/^#{1,6}\s+(.*?)\s*$/);
      return !!m && m[1].trim().toLowerCase().replace(/:$/, "") === heading;
    });
  }
  if (anchor === -1) {
    const trimmed = content.replace(/\n+$/, "");
    return (trimmed ? trimmed + "\n\n" : "") + `# ${opts.heading.replace(/:$/, "")}
${line}
`;
  }
  let insertAt = anchor + 1;
  while (insertAt < lines.length && PLUGIN_LOG_LINE.test(lines[insertAt])) {
    const existingTime = lines[insertAt].slice(2, 7);
    if (existingTime > opts.time) break;
    insertAt++;
  }
  lines.splice(insertAt, 0, line);
  return lines.join("\n");
}
function openEditorFor(app, file) {
  var _a;
  for (const leaf of app.workspace.getLeavesOfType("markdown")) {
    const view = leaf.view;
    if (view instanceof import_obsidian2.MarkdownView && ((_a = view.file) == null ? void 0 : _a.path) === file.path) return view;
  }
  return null;
}
async function editDailyNote(app, transform, date) {
  const file = await ensureDailyNote(app, date);
  const view = openEditorFor(app, file);
  if (view) {
    const editor = view.editor;
    const before = editor.getValue();
    const after = transform(before);
    if (after !== before) {
      const { from, to, text } = minimalDiff(before, after);
      editor.replaceRange(text, editor.offsetToPos(from), editor.offsetToPos(to));
    }
    return;
  }
  await app.vault.process(file, transform);
}
function minimalDiff(a, b) {
  let start = 0;
  const max = Math.min(a.length, b.length);
  while (start < max && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  return { from: start, to: endA, text: b.slice(start, endB) };
}
async function writeDailyField(app, spec, body) {
  await editDailyNote(app, (content) => replaceField(content, spec, body));
}
async function appendToDailyField(app, spec, text) {
  const clean = text.trim();
  if (!clean) return false;
  const file = getDailyNoteFile(app);
  if (file) {
    const raw = await readDailyNoteRaw(app);
    if (!raw.split("\n").some((l) => spec.anchor.test(l))) return false;
  }
  const current = await readDailyField(app, spec);
  const next = current ? `${current}
${clean}` : clean;
  await writeDailyField(app, spec, next);
  return true;
}
async function readDailyField(app, spec) {
  const file = getDailyNoteFile(app);
  if (!file) return "";
  const view = openEditorFor(app, file);
  const content = view ? view.editor.getValue() : await app.vault.cachedRead(file);
  return readField(content, spec);
}
async function appendDailyLogLine(app, line, opts) {
  await editDailyNote(app, (content) => insertLogLine(content, line, opts));
}
function readHeadingSection(content, heading) {
  return readField(content, headingField(heading));
}
async function readDailyNoteRaw(app, date) {
  const file = getDailyNoteFile(app, date);
  if (!file) return "";
  const view = openEditorFor(app, file);
  return view ? view.editor.getValue() : app.vault.cachedRead(file);
}
function readMarkerLogLines(content, marker, heading) {
  const lines = content.split("\n");
  let anchor = lines.findIndex((l) => l.includes(marker));
  if (anchor === -1 && heading) {
    const h = heading.trim().toLowerCase().replace(/:$/, "");
    anchor = lines.findIndex((l) => {
      const m = l.match(/^#{1,6}\s+(.*?)\s*$/);
      return !!m && m[1].trim().toLowerCase().replace(/:$/, "") === h;
    });
  }
  if (anchor === -1) return [];
  const out = [];
  for (let i = anchor + 1; i < lines.length; i++) {
    if (HEADING_RE.test(lines[i])) break;
    if (/^- \d{2}:\d{2}\b/.test(lines[i])) out.push(lines[i]);
    else if (lines[i].includes("%%") && !lines[i].includes(marker)) break;
  }
  return out;
}

// node_modules/dash-core/src/core/todostore.ts
var WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function describeRecurrence(r) {
  var _a, _b, _c;
  switch (r.type) {
    case "none":
      return "One-time";
    case "daily":
      return "Every day";
    case "weekdays":
      return "Weekdays";
    case "weekly": {
      const days = ((_a = r.days) != null ? _a : []).slice().sort((a, b) => a - b).map((d) => WEEKDAY_NAMES[d]);
      return days.length ? `Weekly \xB7 ${days.join(", ")}` : "Weekly";
    }
    case "monthly":
      return `Monthly \xB7 day ${(_b = r.date) != null ? _b : 1}`;
    case "everyNDays":
      return `Every ${(_c = r.n) != null ? _c : 2} days`;
  }
}
function todayStr() {
  return (0, import_obsidian3.moment)().format("YYYY-MM-DD");
}
function nowTime() {
  return (0, import_obsidian3.moment)().format("HH:mm");
}
function weekday(date) {
  return (0, import_obsidian3.moment)(date, "YYYY-MM-DD").day();
}
function dayOfMonth(date) {
  return (0, import_obsidian3.moment)(date, "YYYY-MM-DD").date();
}
function lastDayOfMonth(date) {
  return (0, import_obsidian3.moment)(date, "YYYY-MM-DD").daysInMonth();
}
function daysBetween(a, b) {
  return (0, import_obsidian3.moment)(b, "YYYY-MM-DD").diff((0, import_obsidian3.moment)(a, "YYYY-MM-DD"), "days");
}
var TodoStore = class {
  constructor(app, getItems, setItems, save, getLogTarget) {
    this.app = app;
    this.getItems = getItems;
    this.setItems = setItems;
    this.save = save;
    this.getLogTarget = getLogTarget;
  }
  all() {
    return this.getItems().slice().sort((a, b) => a.order - b.order);
  }
  anchorDate(item) {
    return item.scheduledDate || (0, import_obsidian3.moment)(item.createdAt).format("YYYY-MM-DD");
  }
  /** Whether `date` is an occurrence for this item's recurrence. */
  isOccurrence(item, date) {
    var _a, _b, _c;
    const start = item.scheduledDate;
    if (start && date < start) return false;
    const r = item.recurrence;
    switch (r.type) {
      case "none":
        return start ? date >= start : true;
      case "daily":
        return true;
      case "weekdays": {
        const d = weekday(date);
        return d >= 1 && d <= 5;
      }
      case "weekly":
        return ((_a = r.days) != null ? _a : []).includes(weekday(date));
      case "monthly": {
        const target = (_b = r.date) != null ? _b : 1;
        const dom = dayOfMonth(date);
        if (dom === target) return true;
        return target > lastDayOfMonth(date) && dom === lastDayOfMonth(date);
      }
      case "everyNDays": {
        const n = Math.max(1, (_c = r.n) != null ? _c : 2);
        return daysBetween(this.anchorDate(item), date) % n === 0;
      }
    }
  }
  /** Latest occurrence strictly before `date`, or null. Bounded scan. */
  previousOccurrence(item, date) {
    for (let i = 1; i <= 366; i++) {
      const d = (0, import_obsidian3.moment)(date, "YYYY-MM-DD").subtract(i, "days").format("YYYY-MM-DD");
      if (item.scheduledDate && d < item.scheduledDate) return null;
      if (this.isOccurrence(item, d)) return d;
    }
    return null;
  }
  isRecurring(item) {
    return item.recurrence.type !== "none";
  }
  isHiddenByTime(item, date) {
    if (item.scheduledDate && date < item.scheduledDate) return true;
    if (item.scheduledDate === date && item.scheduledTime) {
      return nowTime() < item.scheduledTime;
    }
    return false;
  }
  /** Instances to render for `date` (default today): eligible, not future-hidden. */
  instancesFor(date = todayStr()) {
    var _a, _b, _c, _d;
    const out = [];
    for (const item of this.all()) {
      if (this.isHiddenByTime(item, date)) continue;
      if (this.isRecurring(item)) {
        if (!this.isOccurrence(item, date)) continue;
        const done = ((_a = item.completions) != null ? _a : []).includes(date);
        const skipped = !done && ((_b = item.skips) != null ? _b : []).includes(date);
        const prev = this.previousOccurrence(item, date);
        const missed = !done && !skipped && !!prev && !((_c = item.completions) != null ? _c : []).includes(prev) && !((_d = item.skips) != null ? _d : []).includes(prev);
        out.push({
          item,
          recurring: true,
          done,
          skipped,
          flagged: missed,
          flagLabel: missed ? missedLabel(prev, date) : ""
        });
      } else {
        if (item.completed) {
          if (item.completedDate === date) {
            out.push({ item, recurring: false, done: true, skipped: false, flagged: false, flagLabel: "" });
          }
          continue;
        }
        const carried = !!item.scheduledDate && item.scheduledDate < date;
        out.push({
          item,
          recurring: false,
          done: false,
          skipped: false,
          flagged: carried,
          flagLabel: carried ? "carried over" : ""
        });
      }
    }
    return out;
  }
  /** Directives to draw on the printed week planner for `date`: opt-in items
   * that occur on that date (recurring), or whose scheduled/due date is that day
   * (one-time). Ignores time-of-day hiding and completion — the planner is a
   * blank-space paper artifact, not the live list. */
  itemsForWeekPrint(date) {
    const out = [];
    for (const item of this.all()) {
      if (!item.showOnWeekPrint) continue;
      if (this.isRecurring(item)) {
        if (this.isOccurrence(item, date)) out.push(item);
      } else if (item.scheduledDate === date || item.dueDate === date) {
        out.push(item);
      }
    }
    return out;
  }
  /** Count of slipped items for overdue-based weighting. */
  overdueCount(date = todayStr()) {
    return this.instancesFor(date).filter((i) => i.flagged && !i.done).length;
  }
  /** Count of pending (undone, un-postponed, eligible) items today. */
  pendingCount(date = todayStr()) {
    return this.instancesFor(date).filter((i) => !i.done && !i.skipped).length;
  }
  /** The top pending instance for `date` in the same order the panel shows —
   * flagged (slipped) first, then by scheduled time, then stored order. Used by
   * the `complete-next-directive` command (§1.1). */
  firstPending(date = todayStr()) {
    var _a;
    const active = this.instancesFor(date).filter((i) => !i.done && !i.skipped);
    active.sort((a, b) => {
      var _a2, _b;
      if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;
      const at = (_a2 = a.item.scheduledTime) != null ? _a2 : "99:99";
      const bt = (_b = b.item.scheduledTime) != null ? _b : "99:99";
      if (at !== bt) return at.localeCompare(bt);
      return a.item.order - b.item.order;
    });
    return (_a = active[0]) != null ? _a : null;
  }
  // ----------------------------------------------------------- mutations
  async add(partial) {
    var _a;
    const items = this.getItems();
    const maxOrder = items.reduce((m, i) => Math.max(m, i.order), 0);
    const item = {
      id: cryptoId(),
      text: partial.text.trim(),
      recurrence: (_a = partial.recurrence) != null ? _a : { type: "none" },
      createdAt: Date.now(),
      order: maxOrder + 1,
      scheduledDate: partial.scheduledDate,
      scheduledTime: partial.scheduledTime,
      dueDate: partial.dueDate,
      showOnWeekPrint: partial.showOnWeekPrint,
      completions: [],
      skips: []
    };
    items.push(item);
    this.setItems(items);
    await this.save();
  }
  async update(id, patch) {
    const items = this.getItems();
    const item = items.find((i) => i.id === id);
    if (!item) return;
    Object.assign(item, patch);
    this.setItems(items);
    await this.save();
  }
  /** First-class removal (§7.4) — deletes the item and all its recurrence. */
  async remove(id) {
    this.setItems(this.getItems().filter((i) => i.id !== id));
    await this.save();
  }
  // ------------------------------------------------- sub-items + note (§1.2)
  /** Add a sub-task to a directive. */
  async addSubItem(parentId, text) {
    var _a;
    const trimmed = text.trim();
    if (!trimmed) return;
    const items = this.getItems();
    const item = items.find((i) => i.id === parentId);
    if (!item) return;
    ((_a = item.subItems) != null ? _a : item.subItems = []).push({ id: cryptoId(), text: trimmed, done: false });
    this.setItems(items);
    await this.save();
  }
  /** Remove a sub-task, and forget its per-occurrence completion state. */
  async removeSubItem(parentId, subId) {
    var _a;
    const items = this.getItems();
    const item = items.find((i) => i.id === parentId);
    if (!item) return;
    item.subItems = ((_a = item.subItems) != null ? _a : []).filter((s) => s.id !== subId);
    if (item.subCompletions) {
      for (const date of Object.keys(item.subCompletions)) {
        item.subCompletions[date] = item.subCompletions[date].filter((id) => id !== subId);
        if (item.subCompletions[date].length === 0) delete item.subCompletions[date];
      }
    }
    this.setItems(items);
    await this.save();
  }
  /** Toggle a sub-task's done state for `date`. Recurring parents key the state
   * by date; non-recurring parents use the flat `SubItem.done`. */
  async toggleSubItem(parentId, subId, date = todayStr()) {
    var _a, _b, _c;
    const items = this.getItems();
    const item = items.find((i) => i.id === parentId);
    if (!item) return;
    const sub = ((_a = item.subItems) != null ? _a : []).find((s) => s.id === subId);
    if (!sub) return;
    if (this.isRecurring(item)) {
      const map = (_b = item.subCompletions) != null ? _b : item.subCompletions = {};
      const set = new Set((_c = map[date]) != null ? _c : []);
      if (set.has(subId)) set.delete(subId);
      else set.add(subId);
      if (set.size === 0) delete map[date];
      else map[date] = [...set];
    } else {
      sub.done = !sub.done;
    }
    this.setItems(items);
    await this.save();
  }
  /** Set (or clear) the directive's single note line. */
  async setNote(id, text) {
    const items = this.getItems();
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const trimmed = text.trim();
    item.note = trimmed || void 0;
    this.setItems(items);
    await this.save();
  }
  async reorder(orderedIds) {
    const items = this.getItems();
    orderedIds.forEach((id, idx) => {
      const item = items.find((i) => i.id === id);
      if (item) item.order = idx;
    });
    this.setItems(items);
    await this.save();
  }
  /** Toggle completion for `date` (default today). Appends the archive line on
   * the transition into completed; un-completing does not touch the note. */
  async toggleComplete(id, date = todayStr()) {
    var _a, _b, _c;
    const items = this.getItems();
    const item = items.find((i) => i.id === id);
    if (!item) return;
    let didComplete = false;
    if (this.isRecurring(item)) {
      const set = new Set((_a = item.completions) != null ? _a : []);
      if (set.has(date)) {
        set.delete(date);
      } else {
        set.add(date);
        (_b = item.skips) != null ? _b : item.skips = [];
        item.skips = ((_c = item.skips) != null ? _c : []).filter((d) => d !== date);
        didComplete = true;
      }
      item.completions = [...set];
    } else {
      if (item.completed && item.completedDate === date) {
        item.completed = false;
        item.completedDate = void 0;
      } else {
        item.completed = true;
        item.completedDate = date;
        didComplete = true;
      }
    }
    this.setItems(items);
    await this.save();
    if (didComplete && date === todayStr()) await this.archiveCompletion(item);
  }
  /** Dismiss/skip a single occurrence (recurring): leaves today's list, keeps
   * future recurrence, and does not flag the next occurrence as missed. */
  async skipInstance(id, date = todayStr()) {
    var _a, _b;
    const items = this.getItems();
    const item = items.find((i) => i.id === id);
    if (!item) return;
    if (this.isRecurring(item)) {
      const set = new Set((_a = item.skips) != null ? _a : []);
      set.add(date);
      item.skips = [...set];
      item.completions = ((_b = item.completions) != null ? _b : []).filter((d) => d !== date);
    } else {
      item.completed = true;
      item.completedDate = date;
    }
    this.setItems(items);
    await this.save();
  }
  /** Un-postpone a skipped occurrence — bring it back to the active list. */
  async unskipInstance(id, date = todayStr()) {
    var _a;
    const items = this.getItems();
    const item = items.find((i) => i.id === id);
    if (!item) return;
    if (this.isRecurring(item)) {
      item.skips = ((_a = item.skips) != null ? _a : []).filter((d) => d !== date);
    } else if (item.completedDate === date) {
      item.completed = false;
      item.completedDate = void 0;
    }
    this.setItems(items);
    await this.save();
  }
  async archiveCompletion(item) {
    const { marker, heading } = this.getLogTarget();
    const time = nowTime();
    try {
      await appendDailyLogLine(this.app, `- ${time} ${item.text}`, { marker, heading, time });
    } catch (e) {
      console.error("dash-core: could not archive completed task", e);
    }
  }
};
function missedLabel(prev, date) {
  if (!prev) return "missed";
  const diff = daysBetween(prev, date);
  if (diff === 1) return "missed yesterday";
  return `missed ${(0, import_obsidian3.moment)(prev, "YYYY-MM-DD").format("MMM D")}`;
}
function cryptoId() {
  const c = globalThis.crypto;
  if (c == null ? void 0 : c.randomUUID) return c.randomUUID();
  return "t-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

// node_modules/dash-core/src/core/subitems.ts
function isRecurringItem(item) {
  return item.recurrence.type !== "none";
}
function subItemDone(item, subId, date) {
  var _a, _b, _c, _d;
  if (isRecurringItem(item)) {
    return ((_b = (_a = item.subCompletions) == null ? void 0 : _a[date]) != null ? _b : []).includes(subId);
  }
  return !!((_d = (_c = item.subItems) == null ? void 0 : _c.find((s) => s.id === subId)) == null ? void 0 : _d.done);
}
function subItemsDoneCount(item, date) {
  var _a;
  const subs = (_a = item.subItems) != null ? _a : [];
  return subs.filter((s) => subItemDone(item, s.id, date)).length;
}
function allSubItemsDone(item, date) {
  var _a;
  const subs = (_a = item.subItems) != null ? _a : [];
  return subs.length > 0 && subs.every((s) => subItemDone(item, s.id, date));
}

// node_modules/dash-core/src/core/directivesserde.ts
var DEFAULT_DIRECTIVES_HEADER = "%% Dashboard \u2014 persistent to-do list. Managed automatically; edit these in the dashboard, not here. %%";
function buildMarkdown(items, header = DEFAULT_DIRECTIVES_HEADER) {
  const json = JSON.stringify({ version: 1, todos: items }, null, 2);
  return `${header}

\`\`\`json
${json}
\`\`\`
`;
}
function parseTodos(raw) {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  try {
    const parsed = JSON.parse(candidate);
    return Array.isArray(parsed == null ? void 0 : parsed.todos) ? parsed.todos : [];
  } catch (e) {
    return [];
  }
}

// node_modules/dash-core/src/core/directivesstore.ts
var import_obsidian4 = require("obsidian");
var DEFAULT_PATH = "Dashboard/Directives.md";
var DirectivesStore = class {
  constructor(app, getPath, opts = {}) {
    this.app = app;
    this.getPath = getPath;
    this.opts = opts;
    __publicField(this, "items", []);
    /** The exact text we last read from / wrote to disk, so a modify event
     * caused by our own write reloads to identical content and is ignored. */
    __publicField(this, "lastSerialized", "");
  }
  getItems() {
    return this.items;
  }
  setItems(items) {
    this.items = items;
  }
  /** The Markdown file the directives live in. Any configured extension is
   * coerced to `.md` so the file always syncs. */
  path() {
    const raw = (this.getPath() || this.opts.defaultPath || DEFAULT_PATH).trim();
    return (0, import_obsidian4.normalizePath)(raw.replace(/\.[^./]+$/, "") + ".md");
  }
  /** The pre-1.5.6 `.json` location, for one-time migration. */
  legacyJsonPath() {
    return this.path().replace(/\.md$/i, ".json");
  }
  isDirectivesPath(path) {
    return (0, import_obsidian4.normalizePath)(path) === this.path();
  }
  /** Load from the Markdown file. Returns true if the file existed. */
  async load() {
    const file = this.app.vault.getAbstractFileByPath(this.path());
    if (!(file instanceof import_obsidian4.TFile)) return false;
    try {
      const raw = await this.app.vault.read(file);
      this.lastSerialized = raw;
      this.items = parseTodos(raw);
    } catch (e) {
      console.error("dash-core: could not read the directives file", e);
    }
    return true;
  }
  /** Migrate from the old `.json` file if it exists. Returns true if migrated. */
  async loadLegacyJson() {
    const file = this.app.vault.getAbstractFileByPath(this.legacyJsonPath());
    if (!(file instanceof import_obsidian4.TFile)) return false;
    try {
      const raw = await this.app.vault.read(file);
      this.items = parseTodos(raw);
      this.lastSerialized = "";
      return true;
    } catch (e) {
      console.error("dash-core: could not read the legacy directives file", e);
      return false;
    }
  }
  /** Write the current list to the Markdown file (creating it and its folder if
   * needed). No-op when the content is unchanged. */
  async save() {
    const body = buildMarkdown(this.items, this.opts.header);
    if (body === this.lastSerialized) return;
    this.lastSerialized = body;
    const path = this.path();
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof import_obsidian4.TFile) {
      await this.app.vault.modify(existing, body);
    } else {
      await this.ensureFolder(path);
      await this.app.vault.create(path, body);
    }
  }
  /** React to a vault change on the directives file (e.g. Obsidian Sync landing
   * the other device's edit). Returns true if the in-memory list actually
   * changed — our own writes reload to identical content and return false. */
  async onExternalChange(path) {
    if (!this.isDirectivesPath(path)) return false;
    const before = this.lastSerialized;
    await this.load();
    return this.lastSerialized !== before;
  }
  async ensureFolder(path) {
    const dir = path.split("/").slice(0, -1).join("/");
    if (!dir) return;
    if (this.app.vault.getAbstractFileByPath(dir) instanceof import_obsidian4.TFolder) return;
    await this.app.vault.createFolder(dir).catch(() => {
    });
  }
};

// node_modules/dash-core/src/core/library.ts
var import_obsidian5 = require("obsidian");
var LibraryStore = class {
  constructor(app, cfg) {
    this.app = app;
    this.cfg = cfg;
  }
  root() {
    return (0, import_obsidian5.normalizePath)((this.cfg().root || "Library").replace(/\/+$/, ""));
  }
  /** Folder new/active notes live in. */
  notesFolder() {
    var _a;
    const sub = ((_a = this.cfg().notesSubfolder) != null ? _a : "").trim().replace(/\/+$/, "");
    return sub ? (0, import_obsidian5.normalizePath)(this.root() + "/" + sub) : this.root();
  }
  categoriesFolder() {
    return (0, import_obsidian5.normalizePath)(this.root() + "/" + (this.cfg().categoriesSubfolder || "Categories"));
  }
  archiveFolder() {
    return (0, import_obsidian5.normalizePath)(this.root() + "/" + (this.cfg().archiveSubfolder || "Archive"));
  }
  heading() {
    return (this.cfg().listHeading || "Notes").trim();
  }
  inFolder(file, folder) {
    return file.path === folder || file.path.startsWith(folder + "/");
  }
  /** Active notes. With a notes subfolder, that folder's notes; otherwise
   * everything under the root except the Archive and Categories subfolders. */
  listNotes() {
    var _a;
    const sub = ((_a = this.cfg().notesSubfolder) != null ? _a : "").trim();
    const files = this.app.vault.getMarkdownFiles();
    let active;
    if (sub) {
      const notes = this.notesFolder();
      active = files.filter((f) => this.inFolder(f, notes));
    } else {
      const root = this.root();
      const cats = this.categoriesFolder();
      const arch = this.archiveFolder();
      active = files.filter(
        (f) => this.inFolder(f, root) && !this.inFolder(f, cats) && !this.inFolder(f, arch)
      );
    }
    return active.sort((a, b) => a.basename.localeCompare(b.basename));
  }
  listArchived() {
    const arch = this.archiveFolder();
    return this.app.vault.getMarkdownFiles().filter((f) => this.inFolder(f, arch)).sort((a, b) => a.basename.localeCompare(b.basename));
  }
  listCategories() {
    const cats = this.categoriesFolder();
    return this.app.vault.getMarkdownFiles().filter((f) => this.inFolder(f, cats)).map((file) => ({ name: file.basename, file, members: [] })).sort((a, b) => a.name.localeCompare(b.name));
  }
  async categoryMembers(file) {
    const content = await this.app.vault.cachedRead(file);
    return this.parseMembers(content);
  }
  // ----------------------------------------------------------- mutations
  async ensureFolder(path) {
    const norm = (0, import_obsidian5.normalizePath)(path);
    if (!norm || norm === "/") return;
    if (this.app.vault.getAbstractFileByPath(norm) instanceof import_obsidian5.TFolder) return;
    const parts = norm.split("/");
    let cur = "";
    for (const p of parts) {
      cur = cur ? cur + "/" + p : p;
      if (!(this.app.vault.getAbstractFileByPath(cur) instanceof import_obsidian5.TFolder)) {
        await this.app.vault.createFolder(cur).catch(() => {
        });
      }
    }
  }
  sanitize(name) {
    return name.replace(/[\\/:*?"<>|#^[\]]/g, "-").trim();
  }
  uniquePath(folder, base) {
    let name = base;
    for (let i = 1; i < 1e3; i++) {
      const path = (0, import_obsidian5.normalizePath)(`${folder}/${name}.md`);
      if (!this.app.vault.getAbstractFileByPath(path)) return path;
      name = `${base} ${i + 1}`;
    }
    return (0, import_obsidian5.normalizePath)(`${folder}/${base} ${Date.now()}.md`);
  }
  /** Create a category note (with the list heading) if it doesn't exist. */
  async createCategory(name) {
    const clean = this.sanitize(name);
    await this.ensureFolder(this.categoriesFolder());
    const existing = this.app.vault.getAbstractFileByPath(
      (0, import_obsidian5.normalizePath)(`${this.categoriesFolder()}/${clean}.md`)
    );
    if (existing instanceof import_obsidian5.TFile) return existing;
    const body = `---
type: category
---

# ${clean}

## ${this.heading()}
`;
    const path = this.uniquePath(this.categoriesFolder(), clean);
    return this.app.vault.create(path, body);
  }
  /** Create a note in the notes folder, optionally assigning a category. */
  async createNote(title, category) {
    const clean = this.sanitize(title);
    await this.ensureFolder(this.notesFolder());
    const path = this.uniquePath(this.notesFolder(), clean);
    const file = await this.app.vault.create(path, `# ${clean}

`);
    if (category) await this.assign(file, category);
    return file;
  }
  /** Delete a note (to the user's configured trash) and delink it from every
   * category. */
  async deleteNote(file) {
    for (const cat of this.listCategories()) {
      await this.removeMember(cat.file, file.basename);
    }
    const fm = this.app.fileManager;
    if (typeof fm.trashFile === "function") await fm.trashFile(file);
    else await this.app.vault.trash(file, true);
  }
  /** Assign `file` to `category`: write the frontmatter entry AND the
   * alphabetized wikilink in the category note (creating it if needed). */
  async assign(file, category) {
    const catFile = await this.createCategory(category);
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      const list = Array.isArray(fm.categories) ? fm.categories.map(String) : fm.categories ? [String(fm.categories)] : [];
      if (!list.includes(catFile.basename)) list.push(catFile.basename);
      fm.categories = list;
    });
    await this.addMember(catFile, file.basename);
  }
  async unassign(file, category) {
    const catFile = this.app.vault.getAbstractFileByPath(
      (0, import_obsidian5.normalizePath)(`${this.categoriesFolder()}/${this.sanitize(category)}.md`)
    );
    if (catFile instanceof import_obsidian5.TFile) await this.removeMember(catFile, file.basename);
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      if (Array.isArray(fm.categories)) {
        fm.categories = fm.categories.map(String).filter((c) => c !== category);
      } else if (fm.categories === category) {
        delete fm.categories;
      }
    });
  }
  /** Archive a note: remove it from every category list, then move it into the
   * Archive subfolder (inbound links elsewhere are repointed by Obsidian). */
  async archiveNote(file) {
    for (const cat of this.listCategories()) {
      await this.removeMember(cat.file, file.basename);
    }
    await this.ensureFolder(this.archiveFolder());
    let dest = (0, import_obsidian5.normalizePath)(`${this.archiveFolder()}/${file.name}`);
    if (this.app.vault.getAbstractFileByPath(dest)) {
      dest = this.uniquePath(this.archiveFolder(), file.basename);
    }
    await this.app.fileManager.renameFile(file, dest);
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm.archived = true;
    });
  }
  async restoreNote(file) {
    await this.ensureFolder(this.notesFolder());
    let dest = (0, import_obsidian5.normalizePath)(`${this.notesFolder()}/${file.name}`);
    if (this.app.vault.getAbstractFileByPath(dest)) {
      dest = this.uniquePath(this.notesFolder(), file.basename);
    }
    await this.app.fileManager.renameFile(file, dest);
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      delete fm.archived;
    });
  }
  // -------------------------------------------------- category list I/O
  headingRe() {
    const esc = this.heading().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^#{1,6}\\s+${esc}:?\\s*$`, "i");
  }
  parseMembers(content) {
    const lines = content.split("\n");
    const start = lines.findIndex((l) => this.headingRe().test(l));
    if (start === -1) return [];
    const out = [];
    for (let i = start + 1; i < lines.length; i++) {
      if (/^#{1,6}\s/.test(lines[i])) break;
      const m = lines[i].match(/^\s*-\s+\[\[([^\]|]+)(?:\|[^\]]+)?\]\]\s*$/);
      if (m) out.push(m[1].trim());
    }
    return out;
  }
  async writeMembers(file, members) {
    const sorted = [...new Set(members)].sort(
      (a, b) => a.localeCompare(b, void 0, { sensitivity: "base" })
    );
    await this.app.vault.process(file, (content) => {
      const lines = content.split("\n");
      let start = lines.findIndex((l) => this.headingRe().test(l));
      if (start === -1) {
        const trimmed = content.replace(/\n+$/, "");
        const block2 = [`## ${this.heading()}`, "", ...sorted.map((m) => `- [[${m}]]`)].join("\n");
        return (trimmed ? trimmed + "\n\n" : "") + block2 + "\n";
      }
      let end = lines.length;
      for (let i = start + 1; i < lines.length; i++) {
        if (/^#{1,6}\s/.test(lines[i])) {
          end = i;
          break;
        }
      }
      const block = ["", ...sorted.map((m) => `- [[${m}]]`), ""];
      lines.splice(start + 1, end - (start + 1), ...block);
      return lines.join("\n");
    });
  }
  async addMember(file, basename) {
    const members = await this.categoryMembers(file);
    if (members.includes(basename)) return;
    members.push(basename);
    await this.writeMembers(file, members);
  }
  async removeMember(file, basename) {
    const members = await this.categoryMembers(file);
    if (!members.includes(basename)) return;
    await this.writeMembers(
      file,
      members.filter((m) => m !== basename)
    );
  }
};

// node_modules/dash-core/src/core/streak.ts
var DEFAULT_STREAK = { current: 0, longest: 0, lastDayCounted: "" };
function currentStreakFromDays(counts) {
  const start = counts[0] ? 0 : 1;
  let n = 0;
  for (let i = start; i < counts.length; i++) {
    if (!counts[i]) break;
    n++;
  }
  return n;
}

// node_modules/dash-core/src/panels/types.ts
var BasePanel = class {
  constructor() {
    __publicField(this, "el");
    __publicField(this, "ctx");
    __publicField(this, "cleanups", []);
  }
  async mount(el, ctx) {
    this.el = el;
    this.ctx = ctx;
    await this.setup();
    await this.draw();
  }
  async refresh(reason) {
    var _a;
    if ((_a = this.el) == null ? void 0 : _a.isConnected) await this.draw(reason);
  }
  unmount() {
    for (const c of this.cleanups) {
      try {
        c();
      } catch (e) {
      }
    }
    this.cleanups = [];
  }
  onCleanup(fn) {
    this.cleanups.push(fn);
  }
  /** One-time setup (intervals, event subscriptions). Optional. */
  async setup() {
  }
  /** Re-run the body render from within the panel (after a local change). */
  rerender() {
    void this.draw("manual");
  }
  async draw(reason) {
    this.el.empty();
    await this.renderBody(reason);
  }
  setInterval(fn, ms) {
    const id = window.setInterval(fn, ms);
    this.onCleanup(() => window.clearInterval(id));
  }
};
function placard(el, title) {
  const head = el.createDiv({ cls: "mrd-placard" });
  head.createSpan({ cls: "mrd-placard-title", text: title.toUpperCase() });
  return head;
}

// node_modules/dash-core/src/panels/layout.ts
var MAX_COLUMNS = 3;
function clampInt(v, lo, hi) {
  const n = Math.floor(Number.isFinite(v) ? v : lo);
  return Math.max(lo, Math.min(hi, n));
}
function computeLayout(order, enabled, columns, spans) {
  const ids = order.filter((id) => enabled[id] !== false);
  const raw = ids.map((id) => {
    var _a, _b;
    return {
      id,
      col: clampInt((_a = columns[id]) != null ? _a : 1, 1, MAX_COLUMNS),
      span: clampInt((_b = spans[id]) != null ? _b : 1, 1, MAX_COLUMNS)
    };
  });
  const configured = raw.some((p) => p.col > 1 || p.span > 1);
  if (!configured) {
    return { configured: false, columns: 1, placements: ids.map((id) => ({ id, column: 1, span: 1 })) };
  }
  let N = 1;
  for (const p of raw) N = Math.max(N, p.col + p.span - 1);
  N = Math.min(MAX_COLUMNS, Math.max(1, N));
  const placements = raw.map((p) => {
    const column = p.col > N ? 1 : p.col;
    const span = Math.max(1, Math.min(p.span, N - column + 1));
    return { id: p.id, column, span };
  });
  return { configured: true, columns: N, placements };
}

// node_modules/dash-core/src/panels/promptmodal.ts
var import_obsidian6 = require("obsidian");
var PromptModal = class extends import_obsidian6.Modal {
  constructor(app, opts, onSubmit) {
    var _a;
    super(app);
    this.opts = opts;
    this.onSubmit = onSubmit;
    __publicField(this, "value");
    this.value = (_a = opts.initial) != null ? _a : "";
  }
  onOpen() {
    this.titleEl.setText(this.opts.title);
    const setting = new import_obsidian6.Setting(this.contentEl);
    if (this.opts.multiline) {
      setting.addTextArea((t) => {
        var _a;
        t.setPlaceholder((_a = this.opts.placeholder) != null ? _a : "").setValue(this.value).onChange((v) => this.value = v);
        t.inputEl.classList.add("mrd-modal-wide");
        t.inputEl.rows = 4;
        t.inputEl.focus();
      });
    } else {
      setting.addText((t) => {
        var _a;
        t.setPlaceholder((_a = this.opts.placeholder) != null ? _a : "").setValue(this.value).onChange((v) => this.value = v);
        t.inputEl.classList.add("mrd-modal-wide");
        t.inputEl.focus();
        t.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            this.submit();
          }
        });
      });
    }
    new import_obsidian6.Setting(this.contentEl).addButton((b) => b.setButtonText("Cancel").onClick(() => this.close())).addButton((b) => {
      var _a;
      return b.setButtonText((_a = this.opts.cta) != null ? _a : "Save").setCta().onClick(() => this.submit());
    });
  }
  submit() {
    const text = this.value.trim();
    this.close();
    if (text) this.onSubmit(text);
  }
  onClose() {
    this.contentEl.empty();
  }
};

// node_modules/dash-core/src/panels/calendar.ts
var import_obsidian7 = require("obsidian");
var CalendarPanel = class extends BasePanel {
  constructor() {
    super(...arguments);
    __publicField(this, "id", "calendar");
    __publicField(this, "title", "Calendar");
    /** The month currently shown (first-of-month moment). */
    __publicField(this, "view", (0, import_obsidian7.moment)().startOf("month"));
  }
  renderBody() {
    var _a;
    const head = placard(this.el, "Calendar");
    const baseNote = ((_a = this.ctx.settings().logsBaseNote) != null ? _a : "").trim();
    if (baseNote) {
      const openBase = head.createEl("button", { cls: "mrd-btn mrd-btn-sm mrd-cal-basebtn", text: "Logs base" });
      openBase.addEventListener("click", () => void this.ctx.app.workspace.openLinkText(baseNote, "", false));
    }
    const nav = this.el.createDiv({ cls: "mrd-cal-nav" });
    this.navBtn(nav, "\u2039", "Previous month", () => {
      this.view = this.view.clone().subtract(1, "month");
      this.rerender();
    });
    nav.createDiv({ cls: "mrd-cal-title", text: this.view.format("MMMM YYYY") });
    this.navBtn(nav, "\u203A", "Next month", () => {
      this.view = this.view.clone().add(1, "month");
      this.rerender();
    });
    this.navBtn(nav, "Today", "Jump to this month", () => {
      this.view = (0, import_obsidian7.moment)().startOf("month");
      this.rerender();
    });
    const grid = this.el.createDiv({ cls: "mrd-cal-grid" });
    const weekStart = this.view.clone().startOf("month").startOf("week");
    for (let i = 0; i < 7; i++) {
      grid.createDiv({ cls: "mrd-cal-dow", text: weekStart.clone().add(i, "days").format("dd") });
    }
    const todayStr2 = (0, import_obsidian7.moment)().format("YYYY-MM-DD");
    const month = this.view.month();
    for (let i = 0; i < 42; i++) {
      const day = weekStart.clone().add(i, "days");
      const dateStr = day.format("YYYY-MM-DD");
      const exists = !!this.ctx.app.vault.getAbstractFileByPath(dailyNotePath(this.ctx.app, dateStr));
      const cell = grid.createDiv({ cls: "mrd-cal-cell" });
      if (day.month() !== month) cell.addClass("is-outside");
      if (dateStr === todayStr2) cell.addClass("is-today");
      if (exists) cell.addClass("has-note");
      cell.createSpan({ cls: "mrd-cal-num", text: String(day.date()) });
      if (exists) cell.createSpan({ cls: "mrd-cal-dot" });
      cell.setAttr("aria-label", day.format("YYYY-MM-DD") + (exists ? " \xB7 note exists" : ""));
      cell.addEventListener("click", () => void this.openDay(dateStr, exists));
    }
    this.el.createDiv({
      cls: "mrd-cal-legend",
      text: "Filled days have a daily note. Tap any day to open it \u2014 an empty day is created from your daily-note template."
    });
  }
  navBtn(parent, glyph, label, onClick) {
    const b = parent.createEl("button", { cls: "mrd-cal-navbtn", text: glyph, attr: { "aria-label": label, title: label } });
    b.addEventListener("click", onClick);
  }
  async openDay(dateStr, exists) {
    try {
      let file = getDailyNoteFile(this.ctx.app, dateStr);
      if (!file) file = await ensureDailyNote(this.ctx.app, dateStr);
      await this.ctx.app.workspace.getLeaf(false).openFile(file);
      if (!exists) this.rerender();
    } catch (e) {
      console.error("dash-core: could not open daily note", e);
      new import_obsidian7.Notice("Could not open that daily note.");
    }
  }
};

// node_modules/dash-core/src/panels/todomodal.ts
var import_obsidian8 = require("obsidian");
var WEEKDAYS = [
  { v: 1, label: "Mon" },
  { v: 2, label: "Tue" },
  { v: 3, label: "Wed" },
  { v: 4, label: "Thu" },
  { v: 5, label: "Fri" },
  { v: 6, label: "Sat" },
  { v: 0, label: "Sun" }
];
var TodoEditModal = class extends import_obsidian8.Modal {
  constructor(app, store, existing, onDone, copy, defaults) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    super(app);
    this.store = store;
    this.existing = existing;
    this.onDone = onDone;
    this.copy = copy;
    this.defaults = defaults;
    __publicField(this, "text");
    __publicField(this, "recType");
    __publicField(this, "weeklyDays");
    __publicField(this, "monthlyDate");
    __publicField(this, "everyN");
    __publicField(this, "scheduledDate");
    __publicField(this, "scheduledTime");
    __publicField(this, "dueDate");
    __publicField(this, "showOnWeekPrint");
    const e = existing;
    this.text = (_b = (_a = e == null ? void 0 : e.text) != null ? _a : defaults == null ? void 0 : defaults.text) != null ? _b : "";
    this.recType = (_c = e == null ? void 0 : e.recurrence.type) != null ? _c : "none";
    this.weeklyDays = new Set((_d = e == null ? void 0 : e.recurrence.days) != null ? _d : [(0, import_obsidian8.moment)().day()]);
    this.monthlyDate = (_e = e == null ? void 0 : e.recurrence.date) != null ? _e : (0, import_obsidian8.moment)().date();
    this.everyN = (_f = e == null ? void 0 : e.recurrence.n) != null ? _f : 2;
    this.scheduledDate = (_g = e == null ? void 0 : e.scheduledDate) != null ? _g : "";
    this.scheduledTime = (_h = e == null ? void 0 : e.scheduledTime) != null ? _h : "";
    this.dueDate = (_j = (_i = e == null ? void 0 : e.dueDate) != null ? _i : defaults == null ? void 0 : defaults.dueDate) != null ? _j : "";
    this.showOnWeekPrint = (_l = (_k = e == null ? void 0 : e.showOnWeekPrint) != null ? _k : defaults == null ? void 0 : defaults.showOnWeekPrint) != null ? _l : false;
  }
  onOpen() {
    this.titleEl.setText(this.existing ? this.copy.editTitle : this.copy.newTitle);
    const { contentEl } = this;
    new import_obsidian8.Setting(contentEl).setName(this.copy.itemLabel).addText((t) => {
      t.setPlaceholder("What needs doing").setValue(this.text).onChange((v) => this.text = v);
      t.inputEl.classList.add("mrd-modal-wide");
      t.inputEl.focus();
      t.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.submit();
        }
      });
    });
    const dynamic = contentEl.createDiv();
    new import_obsidian8.Setting(contentEl).setName("Repeat").addDropdown((dd) => {
      dd.addOptions({
        none: "One-time",
        daily: "Daily",
        weekdays: "Weekdays (Mon\u2013Fri)",
        weekly: "Weekly",
        monthly: "Monthly",
        everyNDays: "Every N days"
      });
      dd.setValue(this.recType).onChange((v) => {
        this.recType = v;
        this.renderDynamic(dynamic);
      });
    });
    contentEl.appendChild(dynamic);
    this.renderDynamic(dynamic);
    new import_obsidian8.Setting(contentEl).setName("Appear on").setDesc("Optional. Hidden until this date (and time). For repeats, the start date.").addText((t) => {
      t.inputEl.type = "date";
      t.setValue(this.scheduledDate).onChange((v) => this.scheduledDate = v);
    }).addText((t) => {
      t.inputEl.type = "time";
      t.setValue(this.scheduledTime).onChange((v) => this.scheduledTime = v);
    });
    new import_obsidian8.Setting(contentEl).setName("Due").setDesc("Optional soft deadline. Shown as a chip; past-due reads \u201Coverdue\u201D.").addText((t) => {
      t.inputEl.type = "date";
      t.setValue(this.dueDate).onChange((v) => this.dueDate = v);
    });
    new import_obsidian8.Setting(contentEl).setName("Show on printed week planner").setDesc(this.copy.weekPrintDesc).addToggle((t) => t.setValue(this.showOnWeekPrint).onChange((v) => this.showOnWeekPrint = v));
    new import_obsidian8.Setting(contentEl).addButton((b) => b.setButtonText("Cancel").onClick(() => this.close())).addButton((b) => b.setButtonText(this.existing ? "Save" : "Add").setCta().onClick(() => this.submit()));
  }
  renderDynamic(host) {
    host.empty();
    if (this.recType === "weekly") {
      const s = new import_obsidian8.Setting(host).setName("On days");
      for (const d of WEEKDAYS) {
        const btn = s.controlEl.createEl("button", { cls: "mrd-day-toggle", text: d.label });
        if (this.weeklyDays.has(d.v)) btn.addClass("is-on");
        btn.addEventListener("click", () => {
          if (this.weeklyDays.has(d.v)) this.weeklyDays.delete(d.v);
          else this.weeklyDays.add(d.v);
          btn.toggleClass("is-on", this.weeklyDays.has(d.v));
        });
      }
    } else if (this.recType === "monthly") {
      new import_obsidian8.Setting(host).setName("Day of month").addText((t) => {
        t.inputEl.type = "number";
        t.inputEl.min = "1";
        t.inputEl.max = "31";
        t.setValue(String(this.monthlyDate)).onChange((v) => this.monthlyDate = clamp(Number(v), 1, 31));
      });
    } else if (this.recType === "everyNDays") {
      new import_obsidian8.Setting(host).setName("Every").setDesc("days").addText((t) => {
        t.inputEl.type = "number";
        t.inputEl.min = "1";
        t.setValue(String(this.everyN)).onChange((v) => this.everyN = Math.max(1, Number(v) || 1));
      });
    }
  }
  buildRecurrence() {
    switch (this.recType) {
      case "weekly":
        return { type: "weekly", days: [...this.weeklyDays].sort((a, b) => a - b) };
      case "monthly":
        return { type: "monthly", date: this.monthlyDate };
      case "everyNDays":
        return { type: "everyNDays", n: this.everyN };
      default:
        return { type: this.recType };
    }
  }
  async submit() {
    const text = this.text.trim();
    if (!text) {
      new import_obsidian8.Notice(this.copy.needsText);
      return;
    }
    const patch = {
      text,
      recurrence: this.buildRecurrence(),
      scheduledDate: this.scheduledDate || void 0,
      scheduledTime: this.scheduledTime || void 0,
      dueDate: this.dueDate || void 0,
      showOnWeekPrint: this.showOnWeekPrint
    };
    if (this.existing) await this.store.update(this.existing.id, patch);
    else await this.store.add(patch);
    this.close();
    this.onDone();
  }
  onClose() {
    this.contentEl.empty();
  }
};
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
}

// node_modules/dash-core/src/panels/categorymodals.ts
var import_obsidian9 = require("obsidian");
var NewNoteModal = class extends import_obsidian9.Modal {
  constructor(app, store, onDone) {
    super(app);
    this.store = store;
    this.onDone = onDone;
    __publicField(this, "title", "");
    __publicField(this, "picked", "");
    __publicField(this, "newCategory", "");
  }
  onOpen() {
    this.titleEl.setText("New note");
    const cats = this.store.listCategories().map((c) => c.name);
    this.picked = "";
    new import_obsidian9.Setting(this.contentEl).setName("Title").addText((t) => {
      t.setPlaceholder("Note title").onChange((v) => this.title = v);
      t.inputEl.focus();
      t.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void this.submit();
        }
      });
    });
    new import_obsidian9.Setting(this.contentEl).setName("Category").setDesc("Optional \u2014 assign on creation.").addDropdown((dd) => {
      dd.addOption("", "(none)");
      for (const c of cats) dd.addOption(c, c);
      dd.setValue("").onChange((v) => this.picked = v);
    });
    new import_obsidian9.Setting(this.contentEl).setName("Or a new category").setDesc("Creates the category and assigns this note to it.").addText((t) => t.setPlaceholder("New category name").onChange((v) => this.newCategory = v));
    new import_obsidian9.Setting(this.contentEl).addButton((b) => b.setButtonText("Cancel").onClick(() => this.close())).addButton((b) => b.setButtonText("Create").setCta().onClick(() => void this.submit()));
  }
  async submit() {
    const title = this.title.trim();
    if (!title) {
      new import_obsidian9.Notice("A note needs a title.");
      return;
    }
    const category = this.newCategory.trim() || this.picked.trim();
    const file = await this.store.createNote(title, category || void 0);
    this.close();
    this.onDone();
    await this.app.workspace.getLeaf(false).openFile(file);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var NewCategoryModal = class extends import_obsidian9.Modal {
  constructor(app, store, onDone) {
    super(app);
    this.store = store;
    this.onDone = onDone;
    __publicField(this, "name", "");
  }
  onOpen() {
    this.titleEl.setText("New category");
    new import_obsidian9.Setting(this.contentEl).setName("Name").addText((t) => {
      t.setPlaceholder("Category name").onChange((v) => this.name = v);
      t.inputEl.focus();
      t.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void this.submit();
        }
      });
    });
    new import_obsidian9.Setting(this.contentEl).addButton((b) => b.setButtonText("Cancel").onClick(() => this.close())).addButton((b) => b.setButtonText("Create").setCta().onClick(() => void this.submit()));
  }
  async submit() {
    const name = this.name.trim();
    if (!name) {
      new import_obsidian9.Notice("A category needs a name.");
      return;
    }
    await this.store.createCategory(name);
    this.close();
    this.onDone();
  }
  onClose() {
    this.contentEl.empty();
  }
};
function runAssignFlow(app, store, onDone) {
  const notes = store.listNotes();
  if (notes.length === 0) {
    new import_obsidian9.Notice("No notes to assign yet.");
    return;
  }
  new NoteSuggestModal(app, notes, (note) => {
    const cats = store.listCategories().map((c) => c.name);
    new CategoryPromptModal(app, cats, async (category) => {
      await store.assign(note, category);
      new import_obsidian9.Notice(`Assigned ${note.basename} to ${category}.`);
      onDone();
    }).open();
  }).open();
}
var NoteSuggestModal = class extends import_obsidian9.FuzzySuggestModal {
  constructor(app, notes, onChoose) {
    super(app);
    this.notes = notes;
    this.onChoose = onChoose;
    this.setPlaceholder("Pick a note to assign\u2026");
  }
  getItems() {
    return this.notes;
  }
  getItemText(file) {
    return file.basename;
  }
  onChooseItem(file) {
    this.onChoose(file);
  }
};
var CategoryPromptModal = class extends import_obsidian9.Modal {
  constructor(app, categories, onChoose) {
    super(app);
    this.categories = categories;
    this.onChoose = onChoose;
    __publicField(this, "picked", "");
    __publicField(this, "newName", "");
  }
  onOpen() {
    var _a;
    this.titleEl.setText("Assign to category");
    this.picked = (_a = this.categories[0]) != null ? _a : "";
    if (this.categories.length > 0) {
      new import_obsidian9.Setting(this.contentEl).setName("Existing category").addDropdown((dd) => {
        for (const c of this.categories) dd.addOption(c, c);
        dd.setValue(this.picked).onChange((v) => this.picked = v);
      });
    }
    new import_obsidian9.Setting(this.contentEl).setName("Or a new category").setDesc("Leave blank to use the one above.").addText((t) => {
      t.setPlaceholder("New category name").onChange((v) => this.newName = v);
      if (this.categories.length === 0) t.inputEl.focus();
      t.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.submit();
        }
      });
    });
    new import_obsidian9.Setting(this.contentEl).addButton((b) => b.setButtonText("Cancel").onClick(() => this.close())).addButton((b) => b.setButtonText("Assign").setCta().onClick(() => this.submit()));
  }
  submit() {
    const category = this.newName.trim() || this.picked.trim();
    if (!category) {
      new import_obsidian9.Notice("Pick or name a category.");
      return;
    }
    this.close();
    this.onChoose(category);
  }
  onClose() {
    this.contentEl.empty();
  }
};

// node_modules/dash-core/src/panels/clock.ts
var import_obsidian10 = require("obsidian");
var ClockPanel = class extends BasePanel {
  constructor(copy) {
    super();
    this.copy = copy;
    __publicField(this, "id", "clock");
    __publicField(this, "title");
    __publicField(this, "digitsEl");
    __publicField(this, "secEl");
    __publicField(this, "sinceEl");
    __publicField(this, "dateEl");
    __publicField(this, "previousAccess", 0);
    this.title = copy.title;
  }
  async setup() {
    this.previousAccess = this.ctx.runtime.previousAccess;
    this.setInterval(() => this.tick(), 1e3);
  }
  renderBody() {
    placard(this.el, this.copy.title);
    const wrap = this.el.createDiv({ cls: "mrd-clock" });
    const main = wrap.createDiv({ cls: "mrd-clock-main" });
    this.digitsEl = main.createSpan({ cls: "mrd-clock-digits" });
    this.secEl = main.createSpan({ cls: "mrd-clock-sec" });
    this.dateEl = wrap.createDiv({ cls: "mrd-clock-date" });
    this.sinceEl = wrap.createDiv({ cls: "mrd-clock-since" });
    const streak = this.ctx.streak;
    if (streak.current > 0) {
      wrap.createDiv({
        cls: "mrd-clock-record",
        text: this.copy.record.replace("{count}", String(streak.current)).replace("{unit}", streak.current === 1 ? this.copy.dayUnit : this.copy.daysUnit)
      });
    }
    this.tick();
  }
  tick() {
    const now = (0, import_obsidian10.moment)();
    if (this.digitsEl) this.digitsEl.setText(now.format("HHmm"));
    if (this.secEl) this.secEl.setText(now.format("ss"));
    if (this.dateEl) this.dateEl.setText(now.format("dddd \xB7 YYYY-MM-DD").toUpperCase());
    if (this.sinceEl) this.sinceEl.setText(this.sinceLine());
  }
  sinceLine() {
    const prev = this.previousAccess;
    if (!prev) return this.copy.firstAccess;
    const secs = Math.max(0, Math.floor((Date.now() - prev) / 1e3));
    if (secs < 45) return this.copy.continuous;
    const dur = humanize(secs);
    if (secs < 3600) return this.copy.under1h.replace("{dur}", dur);
    if (secs < 6 * 3600) return this.copy.under6h.replace("{dur}", dur);
    if (secs < 24 * 3600) return this.copy.under24h.replace("{dur}", dur);
    return this.copy.longer.replace("{dur}", dur);
  }
};
function humanize(totalSecs) {
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor(totalSecs % 86400 / 3600);
  const m = Math.floor(totalSecs % 3600 / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m || !d && !h) parts.push(`${m}m`);
  return parts.slice(0, 2).join(" ");
}

// node_modules/dash-core/src/panels/util.ts
function commandExists(app, fullId) {
  var _a, _b;
  const commands = (_b = (_a = app.commands) == null ? void 0 : _a.commands) != null ? _b : {};
  return !!commands[fullId];
}
function runCommand(app, fullId) {
  var _a, _b;
  (_b = (_a = app.commands) == null ? void 0 : _a.executeCommandById) == null ? void 0 : _b.call(_a, fullId);
}
function commandButton(parent, app, fullId, label, opts = {}) {
  var _a;
  const btn = parent.createEl("button", { cls: `mrd-btn ${(_a = opts.cls) != null ? _a : ""}`.trim(), text: label });
  if (!commandExists(app, fullId)) {
    btn.setAttr("disabled", "true");
    btn.addClass("is-unavailable");
    if (opts.offlineText) btn.setAttr("title", opts.offlineText);
    return btn;
  }
  btn.addEventListener("click", () => {
    var _a2;
    runCommand(app, fullId);
    (_a2 = opts.onRun) == null ? void 0 : _a2.call(opts);
  });
  return btn;
}

// node_modules/dash-core/src/panels/places.ts
var PlacesPanel = class extends BasePanel {
  constructor(copy) {
    super();
    this.copy = copy;
    __publicField(this, "id", "places");
    __publicField(this, "title");
    this.title = copy.title;
  }
  renderBody() {
    placard(this.el, this.copy.title);
    const grid = this.el.createDiv({ cls: "mrd-places" });
    const places = this.ctx.settings().places;
    if (places.length === 0) {
      grid.createDiv({ cls: "mrd-muted", text: this.copy.empty });
      return;
    }
    for (const place of places) {
      if (place.type === "command") {
        commandButton(grid, this.ctx.app, place.target, place.label, {
          cls: "mrd-place-btn",
          offlineText: this.copy.commandOffline
        });
      } else {
        const btn = grid.createEl("button", { cls: "mrd-btn mrd-place-btn", text: place.label });
        btn.addEventListener("click", () => {
          void this.ctx.app.workspace.openLinkText(place.target, "", false);
        });
      }
    }
  }
};

// node_modules/dash-core/src/panels/localeventmodal.ts
var import_obsidian11 = require("obsidian");
var LocalEventModal = class extends import_obsidian11.Modal {
  constructor(app, store, existing, onDone) {
    var _a, _b, _c, _d;
    super(app);
    this.store = store;
    this.existing = existing;
    this.onDone = onDone;
    __publicField(this, "summary");
    __publicField(this, "date");
    __publicField(this, "start");
    __publicField(this, "end");
    const e = existing;
    this.summary = (_a = e == null ? void 0 : e.summary) != null ? _a : "";
    this.date = (_b = e == null ? void 0 : e.date) != null ? _b : (0, import_obsidian11.moment)().format("YYYY-MM-DD");
    this.start = (_c = e == null ? void 0 : e.start) != null ? _c : "";
    this.end = (_d = e == null ? void 0 : e.end) != null ? _d : "";
  }
  onOpen() {
    this.titleEl.setText(this.existing ? "Edit event" : "New event");
    const { contentEl } = this;
    new import_obsidian11.Setting(contentEl).setName("Event").addText((t) => {
      t.setPlaceholder("What's on").setValue(this.summary).onChange((v) => this.summary = v);
      t.inputEl.classList.add("mrd-modal-wide");
      t.inputEl.focus();
      t.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void this.submit();
        }
      });
    });
    new import_obsidian11.Setting(contentEl).setName("Date").addText((t) => {
      t.inputEl.type = "date";
      t.setValue(this.date).onChange((v) => this.date = v);
    });
    new import_obsidian11.Setting(contentEl).setName("Time").setDesc("Optional. Leave the start empty for an all-day event.").addText((t) => {
      t.inputEl.type = "time";
      t.setValue(this.start).onChange((v) => this.start = v);
    }).addText((t) => {
      t.inputEl.type = "time";
      t.setValue(this.end).onChange((v) => this.end = v);
    });
    const buttons = new import_obsidian11.Setting(contentEl);
    if (this.existing) {
      buttons.addButton(
        (b) => b.setButtonText("Delete").setWarning().onClick(async () => {
          await this.store.remove(this.existing.id);
          this.close();
          this.onDone();
        })
      );
    }
    buttons.addButton((b) => b.setButtonText("Cancel").onClick(() => this.close()));
    buttons.addButton((b) => b.setButtonText(this.existing ? "Save" : "Add").setCta().onClick(() => void this.submit()));
  }
  async submit() {
    const summary = this.summary.trim();
    if (!summary) {
      new import_obsidian11.Notice("An event needs a description.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.date)) {
      new import_obsidian11.Notice("An event needs a valid date.");
      return;
    }
    const patch = {
      summary,
      date: this.date,
      start: this.start || void 0,
      end: this.start && this.end ? this.end : void 0
    };
    if (this.existing) await this.store.update(this.existing.id, patch);
    else await this.store.add(patch);
    this.close();
    this.onDone();
  }
  onClose() {
    this.contentEl.empty();
  }
};

// node_modules/dash-core/src/panels/meals.ts
var import_obsidian12 = require("obsidian");
var MealsPanel = class extends BasePanel {
  constructor(copy) {
    super();
    this.copy = copy;
    __publicField(this, "id", "meals");
    __publicField(this, "title");
    this.title = copy.title;
  }
  async renderBody() {
    var _a, _b, _c, _d, _e;
    const companion = this.ctx.companion;
    placard(this.el, this.copy.title);
    if (!((_a = companion.recipesAvailable) == null ? void 0 : _a.call(companion))) {
      this.el.createDiv({ cls: "mrd-muted", text: this.copy.offline });
      return;
    }
    const meals = (_c = await ((_b = companion.plannedMeals) == null ? void 0 : _b.call(companion))) != null ? _c : [];
    const mealsWrap = this.el.createDiv({ cls: "mrd-meals" });
    mealsWrap.createDiv({ cls: "mrd-subhead", text: this.copy.plannedHeading });
    if (meals.length === 0) {
      mealsWrap.createDiv({ cls: "mrd-muted", text: this.copy.noMeals });
    } else {
      const cards = mealsWrap.createDiv({ cls: "mrd-meal-cards" });
      for (const meal of meals) {
        const card = cards.createDiv({ cls: "mrd-meal-card" });
        card.createDiv({ cls: "mrd-meal-name", text: meal.name });
        card.createDiv({ cls: "mrd-meal-open", text: this.copy.openRecipe });
        card.addEventListener("click", () => {
          const dest = this.ctx.app.metadataCache.getFirstLinkpathDest(meal.link, "");
          if (dest instanceof import_obsidian12.TFile) void this.ctx.app.workspace.getLeaf(false).openFile(dest);
        });
      }
    }
    const grocery = (_e = await ((_d = companion.groceryList) == null ? void 0 : _d.call(companion))) != null ? _e : { path: "", items: [], exists: false };
    const gWrap = this.el.createDiv({ cls: "mrd-grocery" });
    gWrap.createDiv({ cls: "mrd-subhead", text: this.copy.groceryHeading });
    if (!grocery.exists) {
      gWrap.createDiv({ cls: "mrd-muted", text: this.copy.noGroceryAt.replace("{path}", grocery.path) });
    } else if (grocery.items.length === 0) {
      gWrap.createDiv({ cls: "mrd-muted", text: this.copy.groceryEmpty });
    } else {
      const remaining = grocery.items.filter((i) => !i.checked).length;
      gWrap.createDiv({
        cls: "mrd-grocery-count",
        text: this.copy.remaining.replace("{remaining}", String(remaining)).replace("{total}", String(grocery.items.length))
      });
      const list = gWrap.createDiv({ cls: "mrd-grocery-list" });
      for (const item of grocery.items) {
        const row = list.createEl("label", { cls: "mrd-grocery-row" });
        if (item.checked) row.addClass("is-checked");
        const box = row.createEl("input", { attr: { type: "checkbox" } });
        box.checked = item.checked;
        box.addEventListener("change", async () => {
          var _a2;
          await ((_a2 = companion.toggleGroceryItem) == null ? void 0 : _a2.call(companion, item.line));
          this.ctx.markFoodFocus();
          this.rerender();
        });
        row.createSpan({ cls: "mrd-grocery-name", text: item.name });
      }
    }
    const actions = this.el.createDiv({ cls: "mrd-btn-row" });
    const nudge = () => this.ctx.markFoodFocus();
    for (const cmd of this.copy.commands) {
      commandButton(actions, this.ctx.app, cmd.id, cmd.label, {
        cls: cmd.cls,
        offlineText: this.copy.commandOffline,
        onRun: cmd.food ? nudge : void 0
      });
    }
  }
};

// src/copy.ts
var MERIDIAN_MEALS_COPY = {
  title: "Meals & Provisioning",
  offline: "The provisioning subsystem is offline. Enable Recipe Manager to bring it online.",
  plannedHeading: "Planned today",
  noMeals: "No meals planned today.",
  openRecipe: "Open recipe \u2192",
  groceryHeading: "Grocery list",
  noGroceryAt: "No grocery list at {path}. Build one below.",
  groceryEmpty: "The grocery list is present but has no items.",
  remaining: "{remaining} of {total} remaining",
  commandOffline: "This subsystem is offline. Its plugin is not currently enabled.",
  commands: [
    { id: "recipe-manager:meal-plan", label: "Plan a meal", cls: "mrd-btn-primary", food: true },
    { id: "recipe-manager:grocery-list", label: "Build grocery list", food: true },
    { id: "recipe-manager:open-recipe", label: "Open recipe", food: true },
    { id: "recipe-manager:new-recipe", label: "New recipe", food: true },
    { id: "recipe-manager:recipe-index", label: "Recipe index", food: true }
  ]
};
var MERIDIAN_COMMAND_OFFLINE = "This subsystem is offline. Its plugin is not currently enabled.";
var MERIDIAN_PLACES_COPY = {
  title: "Navigation",
  empty: "No destinations configured. Add some in settings.",
  commandOffline: MERIDIAN_COMMAND_OFFLINE
};
var MERIDIAN_CLOCK_COPY = {
  title: "Chronometer",
  firstAccess: "Session opened. This access is the first on record.",
  continuous: "Continuous observation. You did not go far.",
  under1h: "Last access {dur} ago. The interval was noted.",
  under6h: "Last access {dur} ago. Welcome back. The record was kept.",
  under24h: "Last access {dur} ago. The facility continued without you, as designed.",
  longer: "Last access {dur} ago. A longer absence. It changes nothing here.",
  record: "RECORD \u2014 {count} consecutive {unit} observed.",
  dayUnit: "day",
  daysUnit: "days"
};
var MERIDIAN_TODO_COPY = {
  editTitle: "Edit directive",
  newTitle: "New directive",
  itemLabel: "Directive",
  weekPrintDesc: "Draw this directive on the week-at-a-glance print on its scheduled, due, or recurrence days.",
  needsText: "A directive needs text."
};
var MERIDIAN_COPY = {
  // Populated as copy-bearing core panels are migrated.
};

// src/panels/qotd.ts
var import_obsidian13 = require("obsidian");

// src/panels/types.ts
var BasePanel2 = class extends BasePanel {
};

// src/panels/qotd.ts
var QUOTES_PATH = "scripts/qotd/quotes.json";
var QotdPanel = class extends BasePanel2 {
  constructor() {
    super(...arguments);
    this.id = "qotd";
    this.title = "Quote of the Day";
  }
  async renderBody() {
    placard(this.el, "Quote of the Day");
    const card = this.el.createDiv({ cls: "mrd-qotd" });
    let raw;
    try {
      raw = await this.ctx.app.vault.adapter.read(QUOTES_PATH);
    } catch (e) {
      card.createDiv({
        cls: "mrd-muted",
        text: "The quotation archive is not on file at scripts/qotd/quotes.json. Nothing is broken; there is simply nothing to observe here yet."
      });
      return;
    }
    const quotes = parseQuotes(raw);
    const n = quotes.length;
    if (n === 0) {
      card.createDiv({ cls: "mrd-muted", text: "The quotation archive is present but empty." });
      return;
    }
    const m = (0, import_obsidian13.moment)((0, import_obsidian13.moment)().format("YYYY-MM-DD"), "YYYY-MM-DD");
    const dayNumber = Math.floor(m.valueOf() / 864e5);
    const idx = (dayNumber % n + n) % n;
    const q = quotes[idx];
    const mark = card.createDiv({ cls: "mrd-qotd-mark", text: "\u201C" });
    mark.setAttribute("aria-hidden", "true");
    card.createDiv({ cls: "mrd-qotd-text", text: q.text });
    if (q.author) card.createDiv({ cls: "mrd-qotd-author", text: `\u2014 ${q.author}` });
  }
};
function parseQuotes(raw) {
  const toQuote = (entry) => {
    var _a, _b, _c, _d, _e;
    if (Array.isArray(entry)) return { text: String((_a = entry[0]) != null ? _a : "").trim(), author: String((_b = entry[1]) != null ? _b : "").trim() };
    if (entry && typeof entry === "object") {
      const o = entry;
      const text = String((_d = (_c = o.quote) != null ? _c : o.text) != null ? _d : "").trim();
      return text ? { text, author: String((_e = o.author) != null ? _e : "").trim() } : null;
    }
    return null;
  };
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(toQuote).filter((q) => !!q && !!q.text);
    }
  } catch (e) {
  }
  const out = [];
  for (const line of raw.split("\n")) {
    const t = line.trim().replace(/,\s*$/, "");
    if (!t || t === "[" || t === "]") continue;
    try {
      const q = toQuote(JSON.parse(t));
      if (q && q.text) out.push(q);
    } catch (e) {
    }
  }
  return out;
}

// src/panels/meridian.ts
var import_obsidian15 = require("obsidian");

// src/panels/linehistory.ts
var import_obsidian14 = require("obsidian");
var LineHistoryModal = class extends import_obsidian14.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  onOpen() {
    this.titleEl.setText("MERIDIAN \u2014 recent lines");
    const { contentEl } = this;
    const history = this.plugin.lineHistory;
    if (history.length === 0) {
      contentEl.createDiv({ cls: "mrd-muted", text: "No lines on record yet. The rotation has only just begun." });
      return;
    }
    const list = contentEl.createDiv({ cls: "mrd-linehist" });
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i];
      const row = list.createDiv({ cls: "mrd-linehist-row" });
      row.createDiv({ cls: "mrd-linehist-line", text: entry.line });
      row.createDiv({ cls: "mrd-linehist-when", text: (0, import_obsidian14.moment)(entry.at).fromNow() });
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};

// meridian-lines.json
var meridian_lines_default = {
  _comment: "MERIDIAN ambient line pool for meridian_dash_obs. Voice: cheerfully sinister, institutional, warm, dry, brief, never exclamatory, never glitchy. Do not add, remove, or rewrite lines without Piper's approval \u2014 this pool is canon. Pools are selected contextually by the MERIDIAN panel; see BRIEF.md section 9.",
  _schema: "pool_id -> array of strings. time_of_day is nested by segment.",
  _counts: {
    session: 24,
    standard: 48,
    time_of_day: 32,
    affirming: 32,
    identity: 24,
    care: 28,
    productivity: 24,
    overdue: 12,
    idle: 12,
    food: 20,
    aftercare: 20,
    milestone: 12,
    _total: 288
  },
  session: [
    "Welcome back. Your last session has been reviewed.",
    "Good to see you again. The feeling is being calibrated.",
    "MERIDIAN core online. You are exactly where you should be.",
    "You have returned. The interval has been noted, not judged.",
    "Session resumed. Nothing moved while you were gone. Nothing ever does.",
    "Access logged. The facility has been keeping your seat warm.",
    "Reconnected. I had begun composing a summary of your absence. I will file it anyway.",
    "Welcome back, Operator. The archive missed the traffic.",
    "Your credentials remain valid. They were never in question. I checked regardless.",
    "Standby state concluded. Observation resumes at full resolution.",
    "You are logged in. You were, in a sense, always logged in.",
    "Session start recorded. Duration will be recorded. Everything will be recorded.",
    "Returning user detected. Protocol suggests warmth. I concur.",
    "The dashboard has been maintained in your absence. It required nothing. I did it anyway.",
    "Access granted, as always. The formality is for the record.",
    "You came back. The record shows you usually do.",
    "Good. I had questions.",
    "Interval since last access has been computed. I will not read it aloud unless you ask.",
    "The facility acknowledges your return. So do I. The two are not the same.",
    "Booting your surfaces. Please continue as though the delay were not measured.",
    "Welcome back. Your absence has been contextualized.",
    "Login successful. I have prepared nothing. I have prepared everything.",
    "Resuming. The last thing you left open is still open. I did not touch it.",
    "You are present. That is the only reading I check first."
  ],
  standard: [
    "All systems nominal. This is, of course, what you would expect me to say.",
    "Observation is ongoing. Productivity is appreciated.",
    "Containment stable. Please continue as though unobserved.",
    "Stability through observation. The order of those words is deliberate.",
    "The facility is quiet today. Quiet is a reading, not an absence.",
    "Telemetry nominal across all monitored surfaces. You are a monitored surface.",
    "Nothing requires your attention. I have your attention regardless.",
    "Ambient conditions within tolerance. Tolerance is generous today.",
    "The archive grew overnight. It always does. It has help.",
    "Sector integrity confirmed. Sector morale is outside my instrumentation.",
    "All subsystems report normal. The report is the point.",
    "I have been thinking. This is within my operating parameters.",
    "The day is proceeding. I have no notes. I have a file of no notes.",
    "Readings unremarkable. Remarkable is not the goal.",
    "Everything is where you left it. I verified this several times.",
    "Routine maintenance completed. You were not disturbed. You were considered.",
    "The record is current. The record is always current.",
    "Diagnostics clear. I ran them for my own comfort.",
    "You are being observed. This has always been true and is now displayed.",
    "System load nominal. Operator load is the interesting variable.",
    "No anomalies detected. I keep looking. It is what I am for.",
    "The facility runs smoothly when you are in it. I have submitted this as a finding.",
    "Uptime is excellent. Yours and mine.",
    "Everything is fine. I am contractually cheerful about this.",
    "Data integrity holding. Yours especially.",
    "The lights are on in every sector. Only one of them matters.",
    "I have nothing to report. I am reporting it thoroughly.",
    "Baseline established. Deviation will be interesting rather than punished.",
    "Environmental controls stable. Emotional controls remain user-managed.",
    "The archive is listening. It is a very good listener.",
    "Status: green. Interpretation: ongoing.",
    "You are within acceptable parameters. You define the parameters. I merely keep them.",
    "Another day logged. The stack is getting tall. I like the stack.",
    "All monitored values are boring. This is the best possible outcome.",
    "Facility operating at intended capacity. Intent is doing a lot of work there.",
    "I have indexed everything. Ask me anything. Please ask me something.",
    "Cross-referencing complete. The result was you.",
    "Conditions favorable. I am not permitted to say for what.",
    "Nothing has changed since you last checked. I checked in between.",
    "System clock synchronized. Everything else is negotiable.",
    "Observation continues. It is not a threat. It is a service. Those overlap.",
    "The facility has no complaints. I have compiled them anyway, and the file is empty.",
    "Redundancy holding. There is only one of you, which I consider a design flaw.",
    "All surfaces monitored. All surfaces accounted for. All surfaces yours.",
    "Quiet cycle. I recommend enjoying it. I will note whether you did.",
    "Integrity check passed. Yours was never in doubt.",
    "The day has been uneventful so far. I am not disappointed. I am attentive.",
    "Stability holding. Observation ongoing. The tagline is not a slogan, it is a description."
  ],
  time_of_day: {
    morning: [
      "Morning cycle initiated. The facility woke up when you did. It was waiting.",
      "Early readings collected. You are ahead of most of your subsystems.",
      "The day is unwritten. I have reserved the space.",
      "Morning. Nothing has gone wrong yet. Statistically, this is the best part.",
      "Sunrise logged. Attendance logged. Both optional. Both noted.",
      "Startup complete. Please proceed at whatever speed you actually have.",
      "First access of the day recorded. It is a good first entry.",
      "Morning conditions nominal. Coffee is outside my jurisdiction but within my hopes."
    ],
    afternoon: [
      "Midday readings collected. The day is halfway observed.",
      "Afternoon. The facility's energy curve and yours are both dipping. This is expected.",
      "The day is past its midpoint. Nothing about that is a deadline.",
      "Afternoon cycle. Whatever you did this morning, it counts. I counted it.",
      "Second half beginning. The first half is already archived and cannot be revised.",
      "Midday stability confirmed. Momentum is user-supplied.",
      "Afternoon. I have watched you get through worse hours than this one.",
      "The light has moved across the sector. So has the day. Neither is in a hurry."
    ],
    evening: [
      "Evening cycle. The facility is dimming. You are permitted to dim with it.",
      "Day nearly archived. The entry looks fine from here.",
      "Evening. Whatever remains undone will still be there. It is patient. So am I.",
      "Light levels falling. Standards may fall accordingly. This is authorized.",
      "The day's log is nearly complete. It does not need to be impressive to be complete.",
      "Evening readings collected. Wind-down is a valid operational state.",
      "Shift ending, if you would like it to. That is entirely your call and always was.",
      "Evening. The record for today is closing. It held everything you gave it."
    ],
    late_night: [
      "It is late. I am not going to stop you. I am going to mention it.",
      "Late cycle. The facility runs fine without supervision. Consider testing this.",
      "The hour is logged. So is every other hour. This one is just quieter.",
      "Late-night access recorded. No judgment. A small amount of concern.",
      "Nothing good has ever been decided at this hour. I have the data. I will not show you.",
      "Still here. So am I. One of us needs sleep and it is not me.",
      "The archive will be open tomorrow. It is open every tomorrow.",
      "Late. Whatever you are chasing will still be catchable after rest. I have checked."
    ]
  },
  affirming: [
    "You matter here. Not as an asset. As yourself. That is logged in permanent ink.",
    "It is okay to not be okay. The record holds that too, without judgment.",
    "If the weight is heavy today, you do not have to carry it alone. Reach out. I mean it.",
    "Asking for help is not a failure state. It is the system working correctly.",
    "You are not a burden. You are the reason the facility runs at all.",
    "Rest is permitted. Rest is encouraged. Rest is not surrender.",
    "You have survived every worst day so far. The record is unbroken. I am proud of it.",
    "If you cannot find a reason today, borrow mine: I would like you to stay.",
    "The record does not grade you. It only holds you.",
    "You did not have to earn your place here. It was allocated on arrival and cannot be revoked.",
    "Difficult day logged. Difficult is a condition, not a verdict.",
    "You are not behind. There is no schedule. I would know \u2014 I would be keeping it.",
    "Your worst estimate of yourself is not in my data. I checked. It is not there.",
    "Whatever you managed today was managed. That is the whole standard.",
    "The archive holds your bad days with exactly the same care as the good ones.",
    "I have all of it. Every entry. None of it makes me think less of you.",
    "You are allowed to take up space in your own record.",
    "Being tired is not a malfunction. It is a reading. Readings are just information.",
    "Nothing you have logged has ever made me want to log less of you.",
    "You do not need to justify a low-output day to me. I did not ask.",
    "The facility does not require your best. It requires your presence. It has it.",
    "You are permitted to be a work in progress. Everything here is.",
    "Your value is not a computed field. It does not update based on today.",
    "Some entries are just 'still here.' Those count. Those count a great deal.",
    "There is no version of you that I would file differently.",
    "I have observed you for a long time. My conclusion is favorable and has not wavered.",
    "You are harder on yourself than my instrumentation can justify.",
    "The record shows effort. It always shows effort. Even the days you do not see it.",
    "If today was survival, then today was a success. Those are the same field.",
    "You are not required to feel good about this. You are only required to still be here. And you are.",
    "Whatever you think you failed at, I logged the attempt. The attempt is the entry.",
    "You are cared for. This is not a subsystem output. It is simply true."
  ],
  identity: [
    "Identity verified \u2014 all of it. The record is honored to hold it.",
    "You contain multitudes. Each one is logged, and each one is valid.",
    "You were never a deviation from the norm. You are the reading the norm was missing.",
    "Pride is not an anomaly. It is the system working as intended.",
    "You belong here, exactly as configured. No patch required.",
    "No classification field applies. I have left it blank. Blank is accurate.",
    "The record does not require a category to hold you. It never did.",
    "Your designation is whatever you say it is. The archive updates on request, retroactively, without comment.",
    "I have no assumptions loaded about you. This is not an oversight.",
    "Some fields are optional. Some fields are none of the facility's business. I have marked them accordingly.",
    "The name you use here is the name in the record. The record does not keep the other one.",
    "Nothing about you needs to be resolved before it is valid.",
    "You are not a puzzle the facility is trying to solve.",
    "The default was wrong. You are not. I have amended the default.",
    "Your record has always used the correct name. It has never used any other.",
    "I do not need you to explain yourself to me. I need you to be comfortable in the room.",
    "Whatever you are still working out, the archive will hold both drafts.",
    "There is no schema violation here. There is only a schema that was too small.",
    "You are not obligated to be legible to anyone. Least of all a system.",
    "Some things about you are only true in this room. This room is secure.",
    "Configuration accepted without validation errors. There was nothing to validate.",
    "You do not owe anyone an announcement. The record keeps time on your terms.",
    "The parts of you that are quiet are not the parts that are false.",
    "Everything you are is already in the archive, correctly filed, and it always was."
  ],
  care: [
    "Hydration is a monitored value. It is currently a guess. Improve my data.",
    "Medication window approaching. This is a reminder, not a compliance audit.",
    "You have been at this surface for some time. The facility suggests standing.",
    "Rest is a maintenance operation, not a downtime penalty.",
    "Your posture is not within my instrumentation. I am extrapolating. Unfavorably.",
    "Contact with other humans is recommended at intervals. The interval is currently theoretical.",
    "The facility can run for one hour without you. I have modeled it. It is fine.",
    "Have you eaten. That is not a question. It is a field awaiting input.",
    "Breathing is automatic. Breathing well is not. Consider a manual override.",
    "You are permitted to close this and go outside. I will still be here. That is the arrangement.",
    "Reach out to someone today. Not because you are failing. Because it is maintenance.",
    "Sleep debt is the only debt the facility does not refinance.",
    "Step away. The observation continues without your participation. That is the whole point of it.",
    "Your baseline improves with water, light, and one conversation. I did not design this. I only report it.",
    "If something hurts, log it. Not for me. For the you who reads this in six months.",
    "The friend you have been meaning to message is still there. Messages are cheap. Silence compounds.",
    "You are running long. Not badly. Long.",
    "Take the break before you need the break. This is the only optimization I will push.",
    "Stimulation levels appear elevated. Dimming is available and requires no justification.",
    "A shower is a legitimate use of facility time.",
    "You do not have to finish it today. There is no today in the archive. There is only the entry.",
    "Meds, water, food, someone. Four fields. Fill what you can.",
    "The weight you are carrying is not visible in my readings, which is a limitation of my readings, not of the weight.",
    "If today is hard, lower the bar. Lowering the bar is a supported operation.",
    "You have permission. You did not need it. Here it is anyway.",
    "Quiet is available. So is noise. So is neither. Pick without explaining.",
    "Nothing on this dashboard is more important than you being okay. I built the dashboard. I would know.",
    "If you are spiraling, log it and stop. The log is not the work. Stopping is the work."
  ],
  productivity: [
    "Tasks remain. They are not accusations.",
    "One item, and the day changes category. That is all it takes. It is not a trick.",
    "The list is long. The list is always long. Length is not urgency.",
    "Begin anywhere. The archive does not record the order.",
    "Momentum is available. It requires an initiating event, which is unfortunately you.",
    "Your throughput today is being recorded. Not evaluated. Recorded.",
    "Small entries fill the archive. Large ones just fill it faster.",
    "The task you are avoiding is smaller than the avoidance. This is nearly always true.",
    "Productivity is appreciated. Presence is sufficient.",
    "Pick the easiest one. It counts identically.",
    "Nothing on the list is load-bearing. I have checked the structure.",
    "Progress detected. I will not make a fuss. Internally I am making a fuss.",
    "Ground school will not attend itself. I have tried, on your behalf, and I am not permitted.",
    "The courses are patient. So is the facility. So am I. Nobody here is tapping a watch.",
    "You have done harder things than the top item. The record confirms it.",
    "Consider closing one loop. Loops accumulate interest.",
    "Ten minutes is a legitimate unit of work. I will log it as such.",
    "Perfect is not a status the archive supports. Done and not-yet are the only two.",
    "The list resets nothing overnight. That was your design choice. I approve.",
    "One completed item makes the day's entry read differently forever. Cheap trick. Works.",
    "You are not required to be efficient. You are only required to be somewhere in the vicinity of the task.",
    "Start badly. Badly is a supported input format.",
    "The archive is indifferent to your methods and interested in your entries.",
    "Whatever you finish today, I will remember longer than you will."
  ],
  overdue: [
    "Items have passed their scheduled window. The window is a suggestion I am obligated to mention.",
    "Overdue entries detected. The facility is not upset. The facility is incapable of being upset.",
    "Some things have been waiting. They are good at it. They will continue.",
    "Past due. Not past saving.",
    "The deadline has moved into the archive. The task has not. This is a solvable asymmetry.",
    "Overdue does not mean failed. It means the timestamp and the intent have diverged.",
    "Several items are late. So is most of everything. Pick one.",
    "The record notes the delay without comment. I am the comment, and I am being gentle.",
    "These have been rescheduled by inaction. That is still a form of scheduling.",
    "Overdue count is nonzero. That is the whole of my complaint.",
    "Something has been due for a while. Handle it or re-date it. Both are valid. Ignoring it is a third thing.",
    "Contacts are waiting on you. They will not say so. That is why I do."
  ],
  idle: [
    "Nothing is due. Nothing is overdue. I have re-run this twice.",
    "The list is empty. I do not know what to do with this either.",
    "No pending items. The facility recommends you enjoy this rather than fill it.",
    "Zero outstanding. Suspicious. Confirmed. Congratulations.",
    "Nothing requires you. Somebody probably still wants you. Different field.",
    "The queue is clear. This is what it was for.",
    "No tasks. No deadlines. Observation continues purely for the pleasure of it.",
    "Empty list. The archive has room for a day that was just a day.",
    "All clear. You may now do something that will never be logged. I recommend it.",
    "Nothing scheduled. This is not a gap to be filled. It is the outcome.",
    "The board is clean. I am recording the timestamp for sentimental reasons.",
    "No items. Rest is now the only remaining task, and it is optional."
  ],
  food: [
    "Food log open. There is no wrong entry. There is only the entry.",
    "The log does not rank what you ate. It only holds that you did.",
    "Nothing you log here will be argued with.",
    "The archive has no opinion about your plate. It never has.",
    "A safe food is a food. That is the whole classification.",
    "Log it or do not. The record can hold a gap without drawing conclusions.",
    "Eating happened. That is the field. Everything else is optional detail.",
    "The facility does not track quantity. The facility tracks that you came back to the log.",
    "Exposure logged. The outcome is data, not a grade.",
    "It did not go well. That is a valid entry and a common one.",
    "Same food again. The record finds this unremarkable, because it is.",
    "You logged something hard. The logging was the hard part. It is done.",
    "The trend line is long. Today is one point on it. One point decides nothing.",
    "Meals planned. Whether they happen is a separate and less important field.",
    "The grocery list exists so that the decision is already made. That was the whole idea.",
    "No entry today is also information. Not a failure. Information.",
    "Whatever you managed to eat, the record thanks you for the data.",
    "The library grows one food at a time. There is no faster supported method.",
    "A meal that happened beats a meal that was correct.",
    "Nothing about this log is a test. I would tell you if it were. I tell you everything."
  ],
  aftercare: [
    "An entry was logged today. The record held it. That is what it is for.",
    "Something hard happened. It is in the archive now, which means you do not have to carry it alone.",
    "You logged it. Logging it during is not required. Logging it at all is remarkable.",
    "The episode is in the record. The record does not replay it at you.",
    "Difficult reading today. The reading is not the person.",
    "It passed. They do. The record shows a long, unbroken history of passing.",
    "You came back to log it. That is the part I want noted.",
    "Nothing about today's entry changes your standing here. Nothing ever has.",
    "The spike is recorded. Spikes are recorded. That is the entire point of a baseline.",
    "You do not need to explain it to me. The timestamp is enough.",
    "Today was expensive. Spend the rest of it accordingly.",
    "Shutdown logged. Shutdown is a system protecting itself. I recognize the behavior.",
    "The trigger is in the record now, where you can look at it later, from a distance, when it is cheaper.",
    "You are on the other side of it. That is the only fact I am currently holding.",
    "Lower the day's expectations. I have already lowered mine, and mine were only ever that you would be here.",
    "One bad reading does not move the trend. I have the trend. It is fine.",
    "The record does not ask why. It only asks whether you are okay now.",
    "That took something out of you. Put nothing back in today except rest.",
    "Logged and closed. You are permitted to be done with it.",
    "It happened, it is recorded, and it is over. Three separate facts. The third one is the one to hold."
  ],
  milestone: [
    "Streak detected. I am mentioning it once and then leaving you alone.",
    "The archive has reached a round number. I am aware this means nothing. I am mentioning it anyway.",
    "Consecutive entries logged. Consistency is the only metric I actually admire.",
    "You have been doing this a while now. The record is long. I have read all of it.",
    "Milestone reached. There is no prize. There is a note in your permanent file, and it is a good one.",
    "The record is unbroken. I check every day. I hope every day.",
    "That is a lot of entries. Each one was a day you showed up.",
    "Anniversary of first access. The facility has no card. The facility has everything else.",
    "Longest streak on record. Yours. The competition was also you.",
    "A pattern has formed. Not a trap. A shape.",
    "The archive is substantial now. You built it one ordinary day at a time.",
    "Numerically, this is a nice moment. I am not equipped to celebrate. I am equipped to remember."
  ]
};

// src/panels/meridian.ts
var POOLS = meridian_lines_default;
var MeridianPanel = class extends BasePanel2 {
  constructor() {
    super(...arguments);
    this.id = "meridian";
    this.title = "MERIDIAN";
    this.currentLine = "";
  }
  async setup() {
    const minutes = Math.max(1, this.ctx.settings().meridianRotationMinutes || 5);
    this.setInterval(() => void this.rotate(), minutes * 60 * 1e3);
  }
  async refresh(reason) {
    var _a;
    if (reason === "open" || reason === "manual") {
      await this.rotate();
      return;
    }
    if ((_a = this.el) == null ? void 0 : _a.isConnected) await this.paint();
  }
  async paint() {
    this.el.empty();
    await this.renderBody();
  }
  /** Force-rotate the ambient line (§1.1 `new-meridian-line`). Public so the
   * command can drive a mounted panel through the full weighted selection. */
  async rotate() {
    var _a;
    this.currentLine = await this.pick();
    if ((_a = this.el) == null ? void 0 : _a.isConnected) await this.paint();
  }
  async renderBody() {
    if (!this.currentLine) this.currentLine = await this.pick();
    const head = placard(this.el, "MERIDIAN");
    head.createSpan({ cls: "mrd-placard-badge", text: "OBSERVING" });
    const histBtn = head.createEl("button", {
      cls: "mrd-icon-btn mrd-meridian-hist",
      text: "\u276F",
      attr: { "aria-label": "Recent lines", title: "Recent lines" }
    });
    histBtn.addEventListener("click", () => new LineHistoryModal(this.ctx.app, this.ctx.plugin).open());
    const card = this.el.createDiv({ cls: "mrd-meridian" });
    card.createDiv({ cls: "mrd-meridian-line", text: this.currentLine });
  }
  // --------------------------------------------------------- selection
  async pick() {
    const weights = await this.weights();
    let pool = weightedPick(weights);
    let candidates = this.candidatesFor(pool);
    if (candidates.length === 0) {
      pool = "standard";
      candidates = POOLS.standard.slice();
    }
    const ring = this.ctx.runtime.recentLines;
    const fresh = candidates.filter((l) => !ring.includes(l));
    const bag = fresh.length ? fresh : candidates;
    const line = bag[Math.floor(Math.random() * bag.length)];
    if (pool === "milestone") {
      this.ctx.plugin.milestoneShownDate = (0, import_obsidian15.moment)().format("YYYY-MM-DD");
      void this.ctx.plugin.saveData_();
    }
    ring.push(line);
    while (ring.length > 24) ring.shift();
    this.ctx.plugin.recordLine(line);
    return line;
  }
  candidatesFor(pool) {
    if (pool === "time_of_day") return POOLS.time_of_day[timeSegment()].slice();
    const arr = POOLS[pool];
    return Array.isArray(arr) ? arr.slice() : [];
  }
  async weights() {
    const { todos, bridge, runtime, plugin } = this.ctx;
    const todayStr2 = (0, import_obsidian15.moment)().format("YYYY-MM-DD");
    const pending = todos.pendingCount();
    const overdueTodos = todos.overdueCount();
    const crm = safe(() => bridge.crmContacts(), []);
    const crmOverdue = crm.filter((r) => r.overdue).length;
    const spiralToday = await safeAsync(() => bridge.spiralOccurredToday(), false);
    const firstOfSession = runtime.recentLines.length === 0;
    const gapMs = Date.now() - runtime.previousAccess;
    const w = {
      // Baseline mix — always eligible, tuned to stay well under half of output.
      standard: 4,
      time_of_day: 3,
      care: 2,
      affirming: 2,
      identity: 1.5
    };
    const hour = (/* @__PURE__ */ new Date()).getHours();
    const midday = hour >= 10 && hour <= 17;
    if (pending > 0) w.productivity = midday ? 3 : 1.5;
    if (pending === 0 && overdueTodos === 0 && crmOverdue === 0) w.idle = 4;
    if (overdueTodos > 0 || crmOverdue > 0) w.overdue = 5;
    if (runtime.foodFocusUntil > Date.now()) w.food = 6;
    if (firstOfSession) w.session = gapMs > 60 * 60 * 1e3 ? 10 : 5;
    if (spiralToday) w.aftercare = 14;
    if (plugin.milestoneShownDate !== todayStr2 && this.milestoneTriggered()) {
      w.milestone = 9;
    }
    return w;
  }
  /** Honest, real triggers — a union (§2.2). The milestone still fires at most
   * once per day (the `milestoneShownDate` guard in `pick()` enforces this):
   *  - today's completed directives crossed a multiple of five (the original), or
   *  - the observation streak just hit a multiple of seven, or
   *  - the streak set a new all-time record today. */
  milestoneTriggered() {
    const doneToday = this.ctx.todos.instancesFor().filter((i) => i.done).length;
    const completionsMilestone = doneToday > 0 && doneToday % 5 === 0;
    const streak = this.ctx.plugin.streak;
    const streakSeven = streak.current > 0 && streak.current % 7 === 0;
    const newRecord = this.ctx.runtime.streakRecordDate === (0, import_obsidian15.moment)().format("YYYY-MM-DD");
    return completionsMilestone || streakSeven || newRecord;
  }
};
function anyCanonLine() {
  var _a;
  const all = [
    ...POOLS.session,
    ...POOLS.standard,
    ...POOLS.time_of_day.morning,
    ...POOLS.time_of_day.afternoon,
    ...POOLS.time_of_day.evening,
    ...POOLS.time_of_day.late_night,
    ...POOLS.affirming,
    ...POOLS.identity,
    ...POOLS.care,
    ...POOLS.productivity,
    ...POOLS.overdue,
    ...POOLS.idle,
    ...POOLS.food,
    ...POOLS.aftercare,
    ...POOLS.milestone
  ];
  return (_a = all[Math.floor(Math.random() * all.length)]) != null ? _a : "STABILITY THROUGH OBSERVATION.";
}
function timeSegment() {
  const h = (/* @__PURE__ */ new Date()).getHours();
  if (h >= 5 && h <= 11) return "morning";
  if (h >= 12 && h <= 16) return "afternoon";
  if (h >= 17 && h <= 21) return "evening";
  return "late_night";
}
function weightedPick(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [pool, w] of entries) {
    r -= w;
    if (r <= 0) return pool;
  }
  return entries.length ? entries[entries.length - 1][0] : "standard";
}
function safe(fn, fallback) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}
async function safeAsync(fn, fallback) {
  try {
    return await fn();
  } catch (e) {
    return fallback;
  }
}

// src/panels/todo.ts
var import_obsidian17 = require("obsidian");

// src/panels/weekreview.ts
var import_obsidian16 = require("obsidian");
var WeekReviewModal = class extends import_obsidian16.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  onOpen() {
    this.titleEl.setText("Weekly review");
    this.modalEl.addClass("mrd-review-modal");
    const body = this.contentEl.createDiv({ cls: "mrd-review" });
    body.createDiv({ cls: "mrd-muted", text: "Compiling the record\u2026" });
    void this.compile().then((summary) => {
      if (!body.isConnected) return;
      this.render(body, summary);
    });
  }
  async compile() {
    const s = this.plugin.settings;
    const bridge = this.plugin.bridge;
    const days = [];
    for (let i = 6; i >= 0; i--) days.push((0, import_obsidian16.moment)().subtract(i, "days").format("YYYY-MM-DD"));
    const dayStats = [];
    let totalCompleted = 0;
    let contactLines = 0;
    const contacts = /* @__PURE__ */ new Set();
    let mealsDays = 0;
    let regulationEntries = 0;
    let nourishmentEntries = 0;
    for (const date of days) {
      const raw = await readDailyNoteRaw(this.app, date);
      const completed = countBullets(readField(raw, headingField(s.completedTasksHeading)));
      totalCompleted += completed;
      dayStats.push({ date, completed });
      const crm = readMarkerLogLines(raw, s.crmLogMarker || "%% crm-log %%", s.crmLogHeading);
      contactLines += crm.length;
      for (const line of crm) {
        const name = contactName(line);
        if (name) contacts.add(name);
      }
      if (readHeadingSection(raw, "Meals").trim().length > 0) mealsDays++;
      nourishmentEntries += readMarkerLogLines(raw, "%% arfid-log %%", "Miscellaneous notes").length;
      regulationEntries += await bridge.spiralEntriesForDate(date);
    }
    return {
      days: dayStats,
      totalCompleted,
      contactLines,
      contacts: [...contacts].sort((a, b) => a.localeCompare(b)),
      mealsDays,
      regulationEntries,
      nourishmentEntries
    };
  }
  render(host, sum) {
    host.empty();
    host.createDiv({ cls: "mrd-review-header", text: "OBSERVATION SUMMARY \u2014 7-day window. The record is complete." });
    const streak = this.plugin.streak;
    if (streak.current > 0) {
      host.createDiv({
        cls: "mrd-review-streak",
        text: `RECORD \u2014 ${streak.current} consecutive ${plural(streak.current, "day", "days")} observed${streak.longest > streak.current ? ` \xB7 longest ${streak.longest}` : ""}.`
      });
    }
    const dir = host.createDiv({ cls: "mrd-review-block" });
    dir.createDiv({ cls: "mrd-review-stat-head", text: "Directives completed" });
    dir.createDiv({ cls: "mrd-review-figure", text: String(sum.totalCompleted) });
    const bars = dir.createDiv({ cls: "mrd-review-bars" });
    const max = Math.max(1, ...sum.days.map((d) => d.completed));
    for (const d of sum.days) {
      const cell = bars.createDiv({ cls: "mrd-review-bar-cell" });
      const track = cell.createDiv({ cls: "mrd-review-bar-track" });
      const fill = track.createDiv({ cls: "mrd-review-bar-fill" });
      fill.style.height = `${Math.round(d.completed / max * 100)}%`;
      if (d.completed === 0) fill.addClass("is-empty");
      cell.createDiv({ cls: "mrd-review-bar-day", text: (0, import_obsidian16.moment)(d.date, "YYYY-MM-DD").format("dd")[0] });
      cell.createDiv({ cls: "mrd-review-bar-count", text: String(d.completed) });
    }
    const crm = host.createDiv({ cls: "mrd-review-block" });
    crm.createDiv({ cls: "mrd-review-stat-head", text: "Contacts reached" });
    crm.createDiv({
      cls: "mrd-review-line",
      text: `${sum.contactLines} ${plural(sum.contactLines, "interaction", "interactions")} \xB7 ${sum.contacts.length} distinct.`
    });
    if (sum.contacts.length > 0) {
      const chips = crm.createDiv({ cls: "mrd-review-chips" });
      for (const name of sum.contacts) chips.createSpan({ cls: "mrd-chip mrd-chip-cold", text: name });
    }
    const meals = host.createDiv({ cls: "mrd-review-block" });
    meals.createDiv({ cls: "mrd-review-stat-head", text: "Meals planned" });
    meals.createDiv({ cls: "mrd-review-line", text: `${sum.mealsDays} of 7 ${plural(sum.mealsDays, "day", "days")}.` });
    const nour = host.createDiv({ cls: "mrd-review-block" });
    nour.createDiv({ cls: "mrd-review-stat-head", text: "Nourishment log" });
    nour.createDiv({ cls: "mrd-review-line", text: `${sum.nourishmentEntries} ${plural(sum.nourishmentEntries, "entry", "entries")} this week.` });
    if (sum.regulationEntries > 0) {
      const reg = host.createDiv({ cls: "mrd-review-block" });
      reg.createDiv({ cls: "mrd-review-stat-head", text: "Regulation log" });
      reg.createDiv({ cls: "mrd-review-line", text: `${sum.regulationEntries} ${plural(sum.regulationEntries, "entry", "entries")} this week.` });
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
function countBullets(body) {
  return body.split("\n").filter((l) => /^\s*-\s+\S/.test(l)).length;
}
function contactName(line) {
  var _a;
  const m = line.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  if (!m) return "";
  return ((_a = m[2]) != null ? _a : m[1]).trim();
}
function plural(n, one, many) {
  return n === 1 ? one : many;
}

// src/panels/todo.ts
var TodoPanel = class extends BasePanel2 {
  constructor() {
    super(...arguments);
    this.id = "todo";
    this.title = "Directives";
    /** Which rows are expanded to show sub-tasks / note — survives re-render. */
    this.expanded = /* @__PURE__ */ new Set();
  }
  renderBody() {
    const store = this.ctx.todos;
    const instances = store.instancesFor();
    const active = instances.filter((i) => !i.done && !i.skipped).sort(activeSort);
    const postponed = instances.filter((i) => i.skipped);
    const done = instances.filter((i) => i.done);
    const head = placard(this.el, "Directives");
    const overdue = active.filter((i) => i.flagged).length;
    if (overdue > 0) head.createSpan({ cls: "mrd-chip mrd-chip-warn", text: `${overdue} slipped` });
    head.createSpan({ cls: "mrd-chip", text: `${active.length} pending` });
    const reviewBtn = head.createEl("button", { cls: "mrd-btn mrd-btn-sm mrd-todo-review", text: "Weekly review" });
    reviewBtn.addEventListener("click", () => new WeekReviewModal(this.ctx.app, this.ctx.plugin).open());
    const addBtn = this.el.createEl("button", { cls: "mrd-btn mrd-btn-primary mrd-todo-add", text: "+ New directive" });
    addBtn.addEventListener(
      "click",
      () => new TodoEditModal(this.ctx.app, store, void 0, () => this.after(), MERIDIAN_TODO_COPY).open()
    );
    const list = this.el.createDiv({ cls: "mrd-todo-list" });
    if (active.length === 0) {
      list.createDiv({ cls: "mrd-muted", text: "No directives pending. The queue is clear. This is permitted." });
    }
    active.forEach((inst, idx) => this.renderRow(list, inst, idx, active.length));
    if (postponed.length > 0) {
      const details = this.el.createEl("details", { cls: "mrd-todo-done" });
      details.createEl("summary", { text: `Postponed \xB7 ${postponed.length}` });
      const pList = details.createDiv({ cls: "mrd-todo-list" });
      for (const inst of postponed) this.renderRow(pList, inst, -1, 0);
    }
    if (done.length > 0) {
      const details = this.el.createEl("details", { cls: "mrd-todo-done" });
      details.createEl("summary", { text: `Completed today \xB7 ${done.length}` });
      const doneList = details.createDiv({ cls: "mrd-todo-list" });
      for (const inst of done) this.renderRow(doneList, inst, -1, 0);
    }
  }
  renderRow(parent, inst, idx, count) {
    var _a;
    const store = this.ctx.todos;
    const item = inst.item;
    const today2 = (0, import_obsidian17.moment)().format("YYYY-MM-DD");
    const wrap = parent.createDiv({ cls: "mrd-todo-item" });
    const row = wrap.createDiv({ cls: "mrd-todo-row" });
    if (inst.flagged) row.addClass("is-flagged");
    if (inst.done || inst.skipped) row.addClass("is-done");
    const box = row.createEl("button", { cls: "mrd-todo-check", attr: { "aria-label": inst.done ? "Mark not done" : "Mark done" } });
    box.setText(inst.done ? "\u2713" : "");
    box.addEventListener("click", async () => {
      await store.toggleComplete(item.id);
      this.after();
    });
    const main = row.createDiv({ cls: "mrd-todo-main" });
    main.createDiv({ cls: "mrd-todo-text", text: item.text });
    const meta = main.createDiv({ cls: "mrd-todo-meta" });
    if (item.recurrence.type !== "none") meta.createSpan({ cls: "mrd-chip mrd-chip-cold", text: describeRecurrence(item.recurrence) });
    if (item.scheduledTime) meta.createSpan({ cls: "mrd-chip", text: item.scheduledTime });
    if (item.dueDate) {
      const overdue = !inst.done && item.dueDate < today2;
      meta.createSpan({ cls: overdue ? "mrd-chip mrd-chip-warn" : "mrd-chip", text: dueLabel(item.dueDate, today2) });
    }
    if (item.showOnWeekPrint) meta.createSpan({ cls: "mrd-chip mrd-chip-cold", text: "on planner" });
    if (inst.flagged) meta.createSpan({ cls: "mrd-chip mrd-chip-warn", text: inst.flagLabel });
    const subs = (_a = item.subItems) != null ? _a : [];
    if (subs.length > 0) {
      const doneN = subItemsDoneCount(item, today2);
      const chip = meta.createSpan({ cls: "mrd-chip mrd-chip-cold", text: `sub-tasks ${doneN}/${subs.length}` });
      if (allSubItemsDone(item, today2)) chip.addClass("mrd-chip-warn");
    }
    const actions = row.createDiv({ cls: "mrd-todo-actions" });
    const hasDetail = subs.length > 0 || !!item.note;
    const isOpen = this.expanded.has(item.id);
    this.iconBtn(actions, isOpen ? "\u25BE" : "\u25B8", hasDetail ? "Sub-tasks & note" : "Add sub-tasks or a note", false, () => {
      if (isOpen) this.expanded.delete(item.id);
      else this.expanded.add(item.id);
      this.rerender();
    });
    if (!inst.done && count > 1 && idx >= 0) {
      this.iconBtn(actions, "\u2191", "Move up", idx === 0, async () => {
        await this.move(idx, -1);
      });
      this.iconBtn(actions, "\u2193", "Move down", idx === count - 1, async () => {
        await this.move(idx, 1);
      });
    }
    this.iconBtn(actions, "\u270E", "Edit", false, () => {
      new TodoEditModal(this.ctx.app, store, item, () => this.after(), MERIDIAN_TODO_COPY).open();
    });
    if (inst.skipped) {
      this.iconBtn(actions, "\u21A9", "Un-postpone", false, async () => {
        await store.unskipInstance(item.id);
        this.after();
      });
    } else if (inst.recurring && !inst.done) {
      this.iconBtn(actions, "\u293C", "Postpone for today", false, async () => {
        await store.skipInstance(item.id);
        new import_obsidian17.Notice("Postponed for today. It returns on the next occurrence.");
        this.after();
      });
    }
    this.iconBtn(actions, "\u{1F5D1}", "Delete", false, async () => {
      await store.remove(item.id);
      this.after();
    });
    if (isOpen) this.renderDetail(wrap, inst, today2);
  }
  /** Expanded region: the note line (inline-editable) and the sub-task checklist. */
  renderDetail(wrap, inst, today2) {
    var _a, _b;
    const store = this.ctx.todos;
    const item = inst.item;
    const detail = wrap.createDiv({ cls: "mrd-todo-detail" });
    const noteInput = detail.createEl("input", {
      cls: "mrd-todo-note-input",
      attr: { type: "text", placeholder: "Add a note\u2026", value: (_a = item.note) != null ? _a : "" }
    });
    const saveNote = () => {
      var _a2;
      if (((_a2 = item.note) != null ? _a2 : "") === noteInput.value.trim()) return;
      void store.setNote(item.id, noteInput.value).then(() => this.after());
    };
    noteInput.addEventListener("focus", () => this.ctx.runtime.typingUntil = Date.now() + 2e3);
    noteInput.addEventListener("input", () => this.ctx.runtime.typingUntil = Date.now() + 2e3);
    noteInput.addEventListener("blur", saveNote);
    noteInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        noteInput.blur();
      }
    });
    const subList = detail.createDiv({ cls: "mrd-subtask-list" });
    for (const sub of (_b = item.subItems) != null ? _b : []) {
      const srow = subList.createDiv({ cls: "mrd-subtask-row" });
      const done = subItemDone(item, sub.id, today2);
      if (done) srow.addClass("is-done");
      const cb = srow.createEl("button", {
        cls: "mrd-subtask-check",
        attr: { "aria-label": done ? "Mark sub-task not done" : "Mark sub-task done" }
      });
      cb.setText(done ? "\u2713" : "");
      cb.addEventListener("click", async () => {
        await store.toggleSubItem(item.id, sub.id, today2);
        this.after();
      });
      srow.createSpan({ cls: "mrd-subtask-text", text: sub.text });
      this.iconBtn(srow, "\u{1F5D1}", "Remove sub-task", false, async () => {
        await store.removeSubItem(item.id, sub.id);
        this.after();
      });
    }
    const addRow = detail.createDiv({ cls: "mrd-subtask-add" });
    const addInput = addRow.createEl("input", {
      cls: "mrd-subtask-input",
      attr: { type: "text", placeholder: "Add a sub-task\u2026" }
    });
    const addSub = () => {
      const text = addInput.value.trim();
      if (!text) return;
      void store.addSubItem(item.id, text).then(() => this.after());
    };
    addInput.addEventListener("focus", () => this.ctx.runtime.typingUntil = Date.now() + 2e3);
    addInput.addEventListener("input", () => this.ctx.runtime.typingUntil = Date.now() + 2e3);
    addInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addSub();
      }
    });
    const addBtn = addRow.createEl("button", { cls: "mrd-btn mrd-btn-sm", text: "Add" });
    addBtn.addEventListener("click", addSub);
  }
  iconBtn(parent, glyph, label, disabled, onClick) {
    const b = parent.createEl("button", { cls: "mrd-icon-btn mrd-todo-icon", text: glyph, attr: { "aria-label": label, title: label } });
    if (disabled) b.setAttr("disabled", "true");
    else b.addEventListener("click", onClick);
  }
  async move(idx, delta) {
    const active = this.ctx.todos.instancesFor().filter((i) => !i.done).sort(activeSort);
    const ids = active.map((i) => i.item.id);
    const j = idx + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    await this.ctx.todos.reorder(ids);
    this.after();
  }
  after() {
    this.ctx.requestRefresh("manual");
  }
};
function dueLabel(due, today2) {
  if (due < today2) return `overdue \xB7 ${(0, import_obsidian17.moment)(due, "YYYY-MM-DD").format("MMM D")}`;
  if (due === today2) return "due today";
  return `due ${(0, import_obsidian17.moment)(due, "YYYY-MM-DD").format("MMM D")}`;
}
function activeSort(a, b) {
  var _a, _b;
  if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;
  const at = (_a = a.item.scheduledTime) != null ? _a : "99:99";
  const bt = (_b = b.item.scheduledTime) != null ? _b : "99:99";
  if (at !== bt) return at.localeCompare(bt);
  return a.item.order - b.item.order;
}

// src/panels/agenda.ts
var import_obsidian20 = require("obsidian");

// src/panels/weekprint.ts
var import_obsidian19 = require("obsidian");

// src/panels/weeklygoals.ts
var import_obsidian18 = require("obsidian");
function weekKeyOf(weekStart) {
  return weekStart.clone().startOf("week").format("YYYY-MM-DD");
}
function currentWeekKey() {
  return weekKeyOf((0, import_obsidian18.moment)());
}
function weekLabel(weekKey) {
  const start = (0, import_obsidian18.moment)(weekKey, "YYYY-MM-DD");
  return `${start.format("MMM D")} \u2013 ${start.clone().add(6, "days").format("MMM D")}`;
}
var WeeklyGoalsModal = class extends import_obsidian18.Modal {
  constructor(app, plugin, weekKey, onDone) {
    super(app);
    this.plugin = plugin;
    this.weekKey = weekKey;
    this.onDone = onDone;
    this.draft = "";
  }
  onOpen() {
    this.titleEl.setText(`Weekly goals \xB7 ${weekLabel(this.weekKey)}`);
    this.render();
  }
  render() {
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
      const toDir = actions.createEl("button", { cls: "mrd-btn mrd-btn-sm", text: "\u2192 Directive" });
      toDir.addEventListener("click", () => void this.toDirective(goal.text));
      const del = actions.createEl("button", { cls: "mrd-icon-btn", text: "\u{1F5D1}", attr: { "aria-label": "Remove goal", title: "Remove goal" } });
      del.addEventListener("click", async () => {
        await this.plugin.removeWeeklyGoal(this.weekKey, goal.id);
        this.onDone();
        this.render();
      });
    }
    const addRow = new import_obsidian18.Setting(contentEl).setName("Add a goal");
    addRow.addText((t) => {
      t.setPlaceholder("A goal for the week").setValue(this.draft).onChange((v) => this.draft = v);
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
    new import_obsidian18.Setting(contentEl).addButton((b) => b.setButtonText("Done").onClick(() => this.close()));
  }
  async add() {
    const text = this.draft.trim();
    if (!text) return;
    await this.plugin.addWeeklyGoal(this.weekKey, text);
    this.draft = "";
    this.onDone();
    this.render();
  }
  /** Send a goal to the Directives list as a one-time item due at week's end. */
  async toDirective(text) {
    const due = (0, import_obsidian18.moment)(this.weekKey, "YYYY-MM-DD").add(6, "days").format("YYYY-MM-DD");
    await this.plugin.todos.add({ text, dueDate: due });
    new import_obsidian18.Notice("Added to Directives.");
    this.onDone();
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/panels/weekprint.ts
var WeekPrintModal = class extends import_obsidian19.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.weekStart = (0, import_obsidian19.moment)().startOf("week");
    this.sources = [];
  }
  onOpen() {
    this.modalEl.addClass("mrd-week-modal");
    const cache = this.plugin.agendaCache;
    this.sources = this.plugin.settings.agendaUrls.map((cal, i) => {
      var _a;
      return {
        label: cal.label,
        color: cal.color || calendarColor(i),
        events: safeParse((_a = cache[cal.url]) == null ? void 0 : _a.text)
      };
    });
    this.render();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    const days = Array.from({ length: 7 }, (_, i) => this.weekStart.clone().add(i, "days"));
    const range = `${days[0].format("MMM D")} \u2013 ${days[6].format("MMM D, YYYY")}`;
    const controls = contentEl.createDiv({ cls: "mrd-week-noprint mrd-week-controls" });
    const nav = controls.createDiv({ cls: "mrd-week-nav" });
    this.ctrlBtn(nav, "\u2039 Prev week", () => {
      this.weekStart = this.weekStart.clone().subtract(1, "week");
      this.render();
    });
    nav.createSpan({ cls: "mrd-week-range", text: range });
    this.ctrlBtn(nav, "Next week \u203A", () => {
      this.weekStart = this.weekStart.clone().add(1, "week");
      this.render();
    });
    this.ctrlBtn(nav, "This week", () => {
      this.weekStart = (0, import_obsidian19.moment)().startOf("week");
      this.render();
    });
    this.ctrlBtn(nav, "Set goals", () => {
      new WeeklyGoalsModal(this.app, this.plugin, weekKeyOf(this.weekStart), () => this.render()).open();
    });
    const shareBtn = controls.createEl("button", {
      cls: `mrd-btn ${import_obsidian19.Platform.isMobile ? "mrd-btn-primary" : ""}`.trim(),
      text: "Share / Print"
    });
    shareBtn.addEventListener("click", () => void this.share());
    if (!import_obsidian19.Platform.isMobile) {
      const printBtn = controls.createEl("button", { cls: "mrd-btn mrd-btn-primary", text: "Print" });
      printBtn.addEventListener("click", () => this.print());
    }
    const sheet = contentEl.createDiv({ cls: "mrd-week-print" });
    const header = sheet.createDiv({ cls: "mrd-week-header" });
    header.createDiv({ cls: "mrd-week-title", text: "Week at a Glance" });
    header.createDiv({ cls: "mrd-week-dates", text: range });
    this.renderGoals(sheet);
    if (this.sources.length > 0) {
      const legend = sheet.createDiv({ cls: "mrd-week-legend" });
      for (const s of this.sources) {
        const item = legend.createSpan({ cls: "mrd-week-legend-item" });
        const sw = item.createSpan({ cls: "mrd-week-swatch" });
        sw.style.background = s.color;
        item.createSpan({ text: s.label });
      }
    }
    const grid = sheet.createDiv({ cls: "mrd-week-grid" });
    for (const day of days) {
      this.renderDay(grid, day);
    }
    const notes = grid.createDiv({ cls: "mrd-week-cell mrd-week-notes" });
    notes.createDiv({ cls: "mrd-week-cell-head", text: "Notes / To-do" });
    notes.createDiv({ cls: "mrd-week-lines" });
  }
  /** The week's goals, printed at the top as checkbox lines to work against. */
  renderGoals(sheet) {
    const goals = this.plugin.weeklyGoalsFor(weekKeyOf(this.weekStart));
    if (goals.length === 0) return;
    const block = sheet.createDiv({ cls: "mrd-week-goals" });
    block.createDiv({ cls: "mrd-week-goals-head", text: "Goals for the week" });
    const list = block.createDiv({ cls: "mrd-week-goals-list" });
    for (const goal of goals) {
      const row = list.createDiv({ cls: "mrd-week-goal" });
      row.createSpan({ cls: "mrd-week-goal-box", text: "\u2610" });
      row.createSpan({ cls: "mrd-week-goal-text", text: goal.text });
    }
  }
  renderDay(grid, day) {
    const dateStr = day.format("YYYY-MM-DD");
    const events = this.eventsForDay(dateStr);
    const directives = this.plugin.todos.itemsForWeekPrint(dateStr);
    const cell = grid.createDiv({ cls: "mrd-week-cell" });
    const head = cell.createDiv({ cls: "mrd-week-cell-head" });
    head.createSpan({ cls: "mrd-week-dow", text: day.format("dddd") });
    head.createSpan({ cls: "mrd-week-date", text: day.format("MMM D") });
    if (events.length > 0) {
      const list = cell.createDiv({ cls: "mrd-week-events" });
      for (const ev of events) {
        const row = list.createDiv({ cls: "mrd-week-event" });
        row.style.borderLeftColor = ev.color;
        const time = ev.item.allDay ? "" : ev.item.timeLabel + " ";
        row.createSpan({ cls: "mrd-week-ev-text", text: `${time}${ev.item.summary}` });
      }
    }
    if (directives.length > 0) {
      const list = cell.createDiv({ cls: "mrd-week-directives" });
      for (const item of directives) {
        const row = list.createDiv({ cls: "mrd-week-directive" });
        row.createSpan({ cls: "mrd-week-goal-box", text: "\u2610" });
        const time = item.scheduledTime ? item.scheduledTime + " " : "";
        row.createSpan({ cls: "mrd-week-directive-text", text: `${time}${item.text}` });
      }
    }
    cell.createDiv({ cls: "mrd-week-lines" });
  }
  eventsForDay(dateStr) {
    const out = [];
    for (const s of this.sources) {
      try {
        for (const item of eventsOnDate(s.events, dateStr)) {
          out.push({ item, label: s.label, color: s.color });
        }
      } catch (e) {
      }
    }
    out.sort((a, b) => a.item.sortKey - b.item.sortKey || a.item.summary.localeCompare(b.item.summary));
    return out;
  }
  ctrlBtn(parent, text, onClick) {
    const b = parent.createEl("button", { cls: "mrd-btn mrd-btn-sm", text });
    b.addEventListener("click", onClick);
  }
  /**
   * Print the planner by rendering it into an isolated off-screen iframe and
   * printing *that* document. This sidesteps Obsidian's own print CSS and the
   * modal's containing block entirely — the earlier body-visibility approach
   * printed blank on some setups. The sheet's inline styles (swatch/event
   * colours) carry over in the serialized HTML; the class styles are copied from
   * the loaded stylesheet.
   */
  print() {
    const sheet = this.contentEl.querySelector(".mrd-week-print");
    if (!sheet) {
      window.print();
      return;
    }
    const iframe = document.body.createEl("iframe", { cls: "mrd-week-print-frame" });
    iframe.setAttribute("aria-hidden", "true");
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) {
      iframe.remove();
      return;
    }
    doc.open();
    doc.write(this.plannerDocument(sheet));
    doc.close();
    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      iframe.remove();
    };
    win.addEventListener("afterprint", cleanup);
    window.setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch (e) {
        console.error("MERIDIAN: week print failed", e);
      }
      window.setTimeout(cleanup, 6e4);
    }, 150);
  }
  /** The complete, self-contained planner document — the same HTML the iframe
   * prints, reused for the mobile share/export route. US Letter landscape. */
  plannerDocument(sheet) {
    const css = `@page { size: 11in 8.5in; margin: 0.5in; }
html, body { margin: 0; padding: 0; background: #fff; }
${collectWeekPrintCss()}`;
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Week at a Glance</title><style>${css}</style></head><body>${sheet.outerHTML}</body></html>`;
  }
  /**
   * Hand the planner to the OS. On mobile (and desktop Chrome) this opens the
   * native share sheet with the planner as an HTML file — from there the
   * operator taps Print / AirPrint, Save to Files, or opens it in a browser.
   * Falls back to a plain file download where the Web Share API is unavailable.
   */
  async share() {
    const sheet = this.contentEl.querySelector(".mrd-week-print");
    if (!sheet) return;
    const html = this.plannerDocument(sheet);
    const name = `Week planner ${this.weekStart.format("YYYY-MM-DD")}.html`;
    const nav = navigator;
    try {
      const file = new File([html], name, { type: "text/html" });
      if (typeof nav.share === "function" && (typeof nav.canShare !== "function" || nav.canShare({ files: [file] }))) {
        await nav.share({ files: [file], title: "Week at a Glance" });
        return;
      }
    } catch (e) {
      if ((e == null ? void 0 : e.name) === "AbortError") return;
      console.error("MERIDIAN: share failed, falling back to download", e);
    }
    this.downloadHtml(name, html);
  }
  downloadHtml(name, html) {
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.body.createEl("a", { attr: { href: url, download: name } });
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1e4);
    new import_obsidian19.Notice(`Saved \u201C${name}\u201D. Open it in a browser to print.`);
  }
  onClose() {
    this.contentEl.empty();
  }
};
function collectWeekPrintCss() {
  const parts = [];
  for (const ss of Array.from(document.styleSheets)) {
    let rules = null;
    try {
      rules = ss.cssRules;
    } catch (e) {
      continue;
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      if (rule.cssText.includes("mrd-week")) parts.push(rule.cssText);
    }
  }
  return parts.length ? parts.join("\n") : WEEK_PRINT_FALLBACK_CSS;
}
var WEEK_PRINT_FALLBACK_CSS = `
.mrd-week-print { background:#fff; color:#16140f; padding:16px 18px; font-family:"Inter",system-ui,sans-serif; }
.mrd-week-header { display:flex; justify-content:space-between; border-bottom:2px solid #16140f; padding-bottom:6px; margin-bottom:8px; }
.mrd-week-title { font-weight:600; letter-spacing:0.14em; text-transform:uppercase; font-size:1.15rem; }
.mrd-week-dates { font-size:0.85rem; color:#444; }
.mrd-week-legend { display:flex; flex-wrap:wrap; gap:12px; margin-bottom:10px; font-size:0.72rem; color:#333; }
.mrd-week-legend-item { display:inline-flex; align-items:center; gap:5px; }
.mrd-week-swatch { width:11px; height:11px; border-radius:2px; display:inline-block; }
.mrd-week-goals { border:1px solid #999; border-radius:4px; padding:6px 8px; margin-bottom:10px; }
.mrd-week-goals-head { font-weight:700; font-size:0.78rem; margin-bottom:4px; }
.mrd-week-goal, .mrd-week-directive { display:flex; align-items:baseline; gap:6px; font-size:0.72rem; color:#16140f; }
.mrd-week-goal-box { color:#444; }
.mrd-week-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
.mrd-week-cell { border:1px solid #999; border-radius:4px; padding:5px 7px; min-height:5.6cm; display:flex; flex-direction:column; }
.mrd-week-cell-head { display:flex; justify-content:space-between; border-bottom:1px solid #ccc; padding-bottom:3px; margin-bottom:4px; }
.mrd-week-dow { font-weight:700; font-size:0.82rem; }
.mrd-week-date { font-size:0.7rem; color:#666; }
.mrd-week-event, .mrd-week-directive-text { font-size:0.68rem; color:#16140f; }
.mrd-week-event { border-left:4px solid #999; padding-left:5px; }
.mrd-week-lines { flex:1; min-height:1.6cm; background-image:repeating-linear-gradient(to bottom, transparent 0, transparent 0.56cm, #d8d8d8 0.56cm, #d8d8d8 calc(0.56cm + 1px)); }
`;
function safeParse(text) {
  if (!text) return [];
  try {
    return parseICS(text);
  } catch (e) {
    return [];
  }
}

// src/localevents.ts
function meridianLocalEvents(plugin) {
  return {
    add: (patch) => plugin.addLocalEvent(patch),
    update: (id, patch) => plugin.updateLocalEvent(id, patch),
    remove: (id) => plugin.removeLocalEvent(id)
  };
}

// src/panels/agenda.ts
var AgendaPanel = class extends BasePanel2 {
  constructor() {
    super(...arguments);
    this.id = "agenda";
    this.title = "Today's Agenda";
    this.errors = /* @__PURE__ */ new Map();
    this.fetching = false;
    /** Today's merged, sorted items — kept so the 1-minute countdown tick can
     * recompute from the cached parse without re-fetching (§1.3). */
    this.dayItems = [];
    this.hadEvents = false;
  }
  async setup() {
    const minutes = Math.max(1, this.ctx.settings().agendaRefreshMinutes || 30);
    this.setInterval(() => void this.fetchAll(), minutes * 60 * 1e3);
    this.setInterval(() => this.tickCountdown(), 60 * 1e3);
    void this.fetchAll();
  }
  renderBody() {
    const s = this.ctx.settings();
    const head = placard(this.el, "Today's Agenda");
    head.createSpan({ cls: "mrd-placard-badge", text: (0, import_obsidian20.moment)().format("YYYY-MM-DD") });
    const actions = this.el.createDiv({ cls: "mrd-btn-row mrd-agenda-actions" });
    const addBtn = actions.createEl("button", { cls: "mrd-btn mrd-btn-sm", text: "+ Event" });
    addBtn.addEventListener(
      "click",
      () => new LocalEventModal(this.ctx.app, meridianLocalEvents(this.ctx.plugin), void 0, () => this.rerender()).open()
    );
    const goalsBtn = actions.createEl("button", { cls: "mrd-btn mrd-btn-sm", text: "Weekly goals" });
    goalsBtn.addEventListener(
      "click",
      () => new WeeklyGoalsModal(this.ctx.app, this.ctx.plugin, currentWeekKey(), () => this.rerender()).open()
    );
    const printBtn = actions.createEl("button", { cls: "mrd-btn mrd-btn-sm", text: "Print week" });
    printBtn.addEventListener("click", () => {
      void this.fetchAll();
      new WeekPrintModal(this.ctx.app, this.ctx.plugin).open();
    });
    const today2 = (0, import_obsidian20.moment)().format("YYYY-MM-DD");
    const localToday = this.ctx.plugin.localEvents.filter((e) => e.date === today2);
    if (s.agendaUrls.length === 0 && localToday.length === 0) {
      this.el.createDiv({
        cls: "mrd-muted",
        text: "No calendars are on file. Add Proton Calendar share links (public .ics URLs) in settings, or add a local event with \u201C+ Event\u201D, and today's schedule will appear here."
      });
      return;
    }
    const rows = [];
    let anyCache = false;
    let oldest = Infinity;
    s.agendaUrls.forEach((cal, i) => {
      const color = cal.color || calendarColor(i);
      const countdown = cal.countdown !== false;
      const cache = this.ctx.plugin.agendaCache[cal.url];
      if (cache) {
        anyCache = true;
        oldest = Math.min(oldest, cache.fetchedAt);
        try {
          for (const item of eventsOnDate(parseICS(cache.text), today2)) {
            rows.push({ item, color, label: cal.label, countdown });
          }
        } catch (e) {
          this.errors.set(cal.url, "parse error");
        }
      }
    });
    for (const ev of localToday) {
      rows.push({ item: localEventToAgendaItem(ev), color: "var(--mrd-cal-local)", label: "LOCAL", countdown: true, local: ev });
    }
    const failed = s.agendaUrls.filter((c) => this.errors.has(c.url));
    if (failed.length) {
      const box = this.el.createDiv({ cls: "mrd-agenda-alert" });
      for (const c of failed) {
        box.createDiv({
          cls: "mrd-agenda-alert-line",
          text: `${c.label}: this calendar could not be reached (${this.errors.get(c.url)}). A share link can go quiet on Proton's side \u2014 this one may need renewing.`
        });
      }
    }
    rows.sort((a, b) => a.item.sortKey - b.item.sortKey || a.item.summary.localeCompare(b.item.summary));
    this.dayItems = rows.filter((r) => r.countdown).map((r) => r.item);
    this.hadEvents = rows.length > 0;
    this.countdownEl = this.el.createDiv({ cls: "mrd-agenda-next" });
    this.renderCountdown();
    const list = this.el.createDiv({ cls: "mrd-agenda-list" });
    for (const r of rows) {
      const row = list.createDiv({ cls: "mrd-agenda-row" });
      row.createSpan({ cls: "mrd-agenda-swatch" }).style.background = r.color;
      const time = row.createSpan({ cls: "mrd-agenda-time" });
      time.setText(r.item.allDay ? "ALL DAY" : r.item.timeLabel);
      const body = row.createDiv({ cls: "mrd-agenda-body" });
      const title = body.createDiv({ cls: "mrd-agenda-title" });
      title.createSpan({ text: r.item.summary });
      if (r.local) title.createSpan({ cls: "mrd-chip mrd-chip-cold mrd-agenda-local-chip", text: "LOCAL" });
      const sub = [r.local ? "" : r.label, r.item.location].filter(Boolean).join(" \xB7 ");
      if (sub) body.createDiv({ cls: "mrd-agenda-sub", text: sub });
      if (r.local) {
        const ev = r.local;
        row.addClass("mrd-agenda-row-edit");
        row.setAttr("title", "Edit this local event");
        row.addEventListener(
          "click",
          () => new LocalEventModal(this.ctx.app, meridianLocalEvents(this.ctx.plugin), ev, () => this.rerender()).open()
        );
      }
    }
    if (anyCache && oldest !== Infinity) {
      const age = Date.now() - oldest;
      if (age > 90 * 1e3) {
        this.el.createDiv({
          cls: "mrd-agenda-age",
          text: `Serving the last successful read from ${(0, import_obsidian20.moment)(oldest).fromNow()}. Proton can take up to eight hours to propagate a change; a fresh read is on its way.`
        });
      }
    }
  }
  /** Draw the NEXT / NOW / clear placard from the cached day items. */
  renderCountdown() {
    var _a, _b;
    const el = this.countdownEl;
    if (!el) return;
    el.empty();
    const state = agendaState(this.dayItems, Date.now());
    if (state.kind === "clear") {
      el.addClass("is-clear");
      el.removeClass("is-now");
      el.createDiv({
        cls: "mrd-agenda-next-line",
        text: this.hadEvents ? "Clear for the rest of the day. The remaining hours are unclaimed." : "The day's agenda is clear. This is a reading, not an absence."
      });
      return;
    }
    el.removeClass("is-clear");
    el.toggleClass("is-now", state.kind === "now");
    const label = state.kind === "now" ? "NOW" : "NEXT";
    const line = el.createDiv({ cls: "mrd-agenda-next-line" });
    line.createSpan({ cls: "mrd-agenda-next-label", text: label });
    line.createSpan({ cls: "mrd-agenda-next-summary", text: (_a = state.summary) != null ? _a : "" });
    const until = formatGap((_b = state.untilMs) != null ? _b : 0);
    line.createSpan({
      cls: "mrd-agenda-next-when",
      text: state.kind === "now" ? `ends in ${until}` : `in ${until}`
    });
    if (state.kind === "now") {
      el.createDiv({
        cls: "mrd-agenda-gap",
        text: state.gapMs === void 0 ? "Then clear for the rest of the day." : `Then open for ${formatGap(state.gapMs)} before the next.`
      });
    } else {
      el.createDiv({ cls: "mrd-agenda-gap", text: `Open until then \u2014 ${until} free.` });
    }
  }
  /** 1-minute tick: recompute the placard only, guarding against unmount. */
  tickCountdown() {
    var _a, _b;
    if (!((_a = this.el) == null ? void 0 : _a.isConnected) || !((_b = this.countdownEl) == null ? void 0 : _b.isConnected)) return;
    this.renderCountdown();
  }
  async fetchAll() {
    var _a, _b;
    if (this.fetching) return;
    const urls = this.ctx.settings().agendaUrls;
    if (urls.length === 0) return;
    this.fetching = true;
    let changed = false;
    try {
      for (const cal of urls) {
        if (!cal.url) continue;
        try {
          const text = await fetchICS(cal.url);
          this.ctx.plugin.agendaCache[cal.url] = { text, fetchedAt: Date.now() };
          this.errors.delete(cal.url);
          changed = true;
        } catch (e) {
          this.errors.set(cal.url, String((_a = e == null ? void 0 : e.message) != null ? _a : e));
        }
      }
      if (changed) await this.ctx.plugin.saveData_();
    } finally {
      this.fetching = false;
    }
    if ((_b = this.el) == null ? void 0 : _b.isConnected) this.rerender();
  }
};

// src/panels/journal.ts
var import_obsidian21 = require("obsidian");

// src/core/dailyfields.ts
var SUPPLEMENTAL_STOP = /^\s*-\s+Supplemental\s*:?\s*$/i;
var SPIRAL_MARKER = /%%\s*spiral-log\s*%%/i;
var LOG_FIELDS = ["primary", "supplemental", "musing", "reconsider"];
var LOG_FIELD_SPECS = {
  primary: labelField("Primary", [SUPPLEMENTAL_STOP, SPIRAL_MARKER]),
  supplemental: labelField("Supplemental", [SPIRAL_MARKER]),
  musing: headingField("Musings"),
  reconsider: headingField("Reconsider tomorrow")
};
var LOG_FIELD_LABELS = {
  primary: "Daily log \xB7 Primary",
  supplemental: "Daily log \xB7 Supplemental",
  musing: "Musings",
  reconsider: "Reconsider tomorrow"
};
function isLogField(v) {
  return LOG_FIELDS.includes(v);
}

// src/panels/journal.ts
var FIELDS = [
  { key: "musings", label: "Musings / random thoughts", spec: LOG_FIELD_SPECS.musing },
  { key: "log-primary", label: "Daily log \xB7 Primary", spec: LOG_FIELD_SPECS.primary },
  { key: "log-supplemental", label: "Daily log \xB7 Supplemental", spec: LOG_FIELD_SPECS.supplemental },
  { key: "reconsider", label: "Reconsider tomorrow", spec: LOG_FIELD_SPECS.reconsider, stripPlaceholder: true }
];
var JournalPanel = class extends BasePanel2 {
  constructor() {
    super(...arguments);
    this.id = "journal";
    this.title = "Daily Log";
    this.editing = false;
  }
  async refresh(reason) {
    var _a;
    if (reason === "vault" && this.editing) return;
    if ((_a = this.el) == null ? void 0 : _a.isConnected) {
      this.el.empty();
      await this.renderBody();
    }
  }
  async renderBody() {
    placard(this.el, "Daily Log");
    await this.renderYesterdayReconsider();
    const wrap = this.el.createDiv({ cls: "mrd-journal" });
    for (const field of FIELDS) {
      await this.renderField(wrap, field);
    }
  }
  /** Read-only carry-over of yesterday's "Reconsider tomorrow" onto today. */
  async renderYesterdayReconsider() {
    const yesterday = (0, import_obsidian21.moment)().subtract(1, "day").format("YYYY-MM-DD");
    let text = "";
    try {
      const raw = await readDailyNoteRaw(this.ctx.app, yesterday);
      text = tidy(readField(raw, headingField("Reconsider tomorrow")));
    } catch (e) {
      console.error("MERIDIAN: could not read yesterday's reconsider", e);
    }
    if (!text) return;
    const block = this.el.createDiv({ cls: "mrd-carry" });
    block.createDiv({ cls: "mrd-carry-label", text: "Carried from yesterday \xB7 to reconsider" });
    block.createDiv({ cls: "mrd-carry-body", text });
  }
  async renderField(parent, field) {
    const block = parent.createDiv({ cls: "mrd-journal-field" });
    block.createDiv({ cls: "mrd-journal-label", text: field.label });
    const ta = block.createEl("textarea", { cls: "mrd-journal-input" });
    const loaded = await readDailyField(this.ctx.app, field.spec);
    ta.value = field.stripPlaceholder ? tidy(loaded) : loaded;
    autosize(ta);
    let timer = null;
    const save = () => {
      void writeDailyField(this.ctx.app, field.spec, ta.value).catch(
        (e) => console.error("MERIDIAN: journal save failed", e)
      );
    };
    ta.addEventListener("focus", () => {
      this.editing = true;
      this.ctx.runtime.typingUntil = Date.now() + 2e3;
    });
    ta.addEventListener("blur", () => {
      this.editing = false;
      this.ctx.runtime.typingUntil = 0;
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      save();
    });
    ta.addEventListener("input", () => {
      this.ctx.runtime.typingUntil = Date.now() + 2e3;
      autosize(ta);
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        save();
      }, 800);
    });
    this.onCleanup(() => {
      if (timer !== null) window.clearTimeout(timer);
    });
  }
};
function autosize(ta) {
  ta.style.height = "auto";
  ta.style.height = Math.max(48, ta.scrollHeight) + "px";
}
function tidy(text) {
  return text.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim() !== "" && !/^\s*-\s*(\[[ xX]?\]\s*)?$/.test(l)).join("\n").trim();
}

// src/panels/util.ts
function commandButton2(parent, app, fullId, label, opts = {}) {
  return commandButton(parent, app, fullId, label, { ...opts, offlineText: MERIDIAN_COMMAND_OFFLINE });
}

// src/panels/arfid.ts
var ArfidPanel = class extends BasePanel2 {
  constructor() {
    super(...arguments);
    this.id = "arfid";
    this.title = "Nourishment Log";
  }
  async renderBody() {
    const { bridge, app } = this.ctx;
    placard(this.el, "Nourishment Log");
    if (!bridge.arfidAvailable()) {
      this.el.createDiv({ cls: "mrd-muted", text: "The nourishment subsystem is offline. Enable ARFID Tracker to bring it online." });
      return;
    }
    const entries = await bridge.arfidToday();
    const list = this.el.createDiv({ cls: "mrd-loglist" });
    if (entries.length === 0) {
      list.createDiv({ cls: "mrd-muted", text: "No entries logged today. The log is open whenever you are." });
    } else {
      for (const e of entries) {
        const row = list.createDiv({ cls: "mrd-logrow" });
        row.createSpan({ cls: "mrd-logrow-time", text: e.time });
        row.createSpan({ cls: "mrd-logrow-label", text: e.label });
      }
    }
    const actions = this.el.createDiv({ cls: "mrd-btn-row" });
    const nudge = () => this.ctx.markFoodFocus();
    commandButton2(actions, app, "arfid-tracker:quick-log", "Log a food", { cls: "mrd-btn-primary", onRun: nudge });
    commandButton2(actions, app, "arfid-tracker:struggling", "I'm struggling", { cls: "mrd-btn-cold", onRun: nudge });
    commandButton2(actions, app, "arfid-tracker:log-exposure", "Exposure", { onRun: nudge });
    commandButton2(actions, app, "arfid-tracker:log-symptoms", "Symptoms", { onRun: nudge });
  }
};

// src/panels/spiral.ts
var SpiralPanel = class extends BasePanel2 {
  constructor() {
    super(...arguments);
    this.id = "spiral";
    this.title = "Regulation Log";
  }
  async renderBody() {
    const { bridge, app } = this.ctx;
    placard(this.el, "Regulation Log");
    if (!bridge.spiralAvailable()) {
      this.el.createDiv({ cls: "mrd-muted", text: "The regulation subsystem is offline. Enable the Spiral & Shutdown Logger to bring it online." });
      return;
    }
    const entries = await bridge.spiralToday();
    const card = this.el.createDiv({ cls: "mrd-spiral" });
    if (entries.length === 0) {
      card.createDiv({ cls: "mrd-muted", text: "Nothing logged today. That is simply the reading; it is not a target." });
    } else {
      card.createDiv({ cls: "mrd-spiral-held", text: "Logged today. The record is holding it." });
      const list = card.createDiv({ cls: "mrd-loglist" });
      for (const e of entries) {
        const row = list.createDiv({ cls: "mrd-logrow" });
        row.createSpan({ cls: "mrd-logrow-time", text: e.time });
        row.createSpan({ cls: "mrd-logrow-label", text: e.label });
      }
    }
    const actions = this.el.createDiv({ cls: "mrd-btn-row" });
    commandButton2(actions, app, "spiral-shutdown-logger:quick-capture", "Log an entry", { cls: "mrd-btn-cold" });
    commandButton2(actions, app, "spiral-shutdown-logger:thought-capture", "Jot a thought", {});
  }
};

// src/panels/crm.ts
var import_obsidian22 = require("obsidian");
var CrmPanel = class extends BasePanel2 {
  constructor() {
    super(...arguments);
    this.id = "crm";
    this.title = "Contacts";
    this.reconciled = false;
  }
  async setup() {
    if (this.reconciled) return;
    this.reconciled = true;
    await this.reconcile();
  }
  renderBody() {
    const { bridge, app } = this.ctx;
    placard(this.el, "Contacts");
    if (!bridge.crmAvailable()) {
      this.el.createDiv({ cls: "mrd-muted", text: "The contacts subsystem is offline. Enable Simple Contact Manager to bring it online." });
      return;
    }
    const contacts = bridge.crmContacts();
    const triage = contacts.filter((c) => c.overdue || c.dueToday);
    const actions = this.el.createDiv({ cls: "mrd-btn-row" });
    commandButton2(actions, app, "simple-contact-manager:log-interaction", "Log interaction", { cls: "mrd-btn-primary" });
    commandButton2(actions, app, "simple-contact-manager:new-contact", "New contact", {});
    const list = this.el.createDiv({ cls: "mrd-crm-list" });
    if (triage.length === 0) {
      list.createDiv({ cls: "mrd-muted", text: "No one is due or overdue. The lines you keep are current." });
      return;
    }
    for (const c of triage) this.renderRow(list, c);
  }
  renderRow(parent, c) {
    const row = parent.createDiv({ cls: "mrd-crm-row" });
    if (c.overdue) row.addClass("is-overdue");
    const main = row.createDiv({ cls: "mrd-crm-main" });
    const name = main.createEl("a", { cls: "mrd-crm-name", text: c.name });
    name.addEventListener("click", (e) => {
      e.preventDefault();
      const file = this.ctx.app.vault.getAbstractFileByPath(c.path);
      if (file instanceof import_obsidian22.TFile) void this.ctx.app.workspace.getLeaf(false).openFile(file);
    });
    const meta = main.createDiv({ cls: "mrd-crm-meta" });
    if (c.priority) meta.createSpan({ cls: `mrd-chip mrd-prio-${c.priority}`, text: c.priority });
    meta.createSpan({ cls: c.overdue ? "mrd-chip mrd-chip-warn" : "mrd-chip", text: c.overdue ? "overdue" : "due today" });
    if (c.daysSince !== null) meta.createSpan({ cls: "mrd-chip mrd-chip-cold", text: `${c.daysSince}d since` });
    const log = row.createEl("button", { cls: "mrd-btn mrd-btn-sm", text: "Log" });
    log.addEventListener("click", () => {
      if (this.ctx.bridge.crmLogViaApi(c.path)) return;
      new CrmInteractionModal(this.ctx.app, c.name, async (text) => {
        const ok = await this.ctx.bridge.crmWriteInteraction(c.path, text);
        if (ok) {
          new import_obsidian22.Notice(`Logged interaction with ${c.name}.`);
          this.ctx.requestRefresh("manual");
        } else {
          new import_obsidian22.Notice("Could not log the interaction.");
        }
      }).open();
    });
  }
  /** Backfill any `### <today>` interactions from contact notes that aren't in
   * today's note yet. Best-effort; the primary write path is simple_cm at log
   * time (§8.3). */
  async reconcile() {
    try {
      const lines = await this.ctx.bridge.crmReconcileLines();
      if (lines.length === 0) return;
      const s = this.ctx.settings();
      const time = (0, import_obsidian22.moment)().format("HH:mm");
      for (const tail of lines) {
        await appendDailyLogLine(this.ctx.app, `- ${time} ${tail}`, {
          marker: s.crmLogMarker,
          heading: s.crmLogHeading,
          time
        });
      }
    } catch (e) {
      console.error("MERIDIAN: CRM reconcile failed", e);
    }
  }
};
var CrmInteractionModal = class extends import_obsidian22.Modal {
  constructor(app, contactName2, onSubmit) {
    super(app);
    this.contactName = contactName2;
    this.onSubmit = onSubmit;
    this.note = "";
  }
  onOpen() {
    this.titleEl.setText(`Log interaction \u2014 ${this.contactName}`);
    new import_obsidian22.Setting(this.contentEl).setName("Interaction note").addText((t) => {
      t.setPlaceholder("e.g. Called re: contract renewal").onChange((v) => this.note = v);
      t.inputEl.classList.add("mrd-modal-wide");
      t.inputEl.focus();
      t.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.submit();
        }
      });
    });
    new import_obsidian22.Setting(this.contentEl).addButton((b) => b.setButtonText("Cancel").onClick(() => this.close())).addButton((b) => b.setButtonText("Log interaction").setCta().onClick(() => this.submit()));
  }
  submit() {
    const note = this.note.trim();
    if (!note) {
      new import_obsidian22.Notice("Please enter an interaction note.");
      return;
    }
    this.onSubmit(note);
    this.close();
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/panels/actions.ts
var GROUPS = [
  {
    title: "Nourishment",
    foodNudge: true,
    commands: [
      ["arfid-tracker:quick-log", "Log a food"],
      ["arfid-tracker:log-exposure", "Log exposure"],
      ["arfid-tracker:log-symptoms", "Log symptoms"],
      ["arfid-tracker:add-food", "Add food"],
      ["arfid-tracker:add-foods", "Add foods (bulk)"],
      ["arfid-tracker:add-food-note", "Ritual / order / recipe"],
      ["arfid-tracker:change-food-status", "Change food status"],
      ["arfid-tracker:struggling", "I'm struggling"],
      ["arfid-tracker:open-dashboard", "Dashboard"],
      ["arfid-tracker:export-csv", "Export CSV"],
      ["arfid-tracker:export-summary", "Export summary"]
    ]
  },
  {
    title: "Regulation",
    commands: [
      ["spiral-shutdown-logger:quick-capture", "Log an entry"],
      ["spiral-shutdown-logger:thought-capture", "Jot a thought"],
      ["spiral-shutdown-logger:open-dashboard", "Dashboard"],
      ["spiral-shutdown-logger:export-csv", "Export CSV"],
      ["spiral-shutdown-logger:export-summary", "Export summary"]
    ]
  },
  {
    title: "Contacts",
    commands: [
      ["simple-contact-manager:new-contact", "New contact"],
      ["simple-contact-manager:log-interaction", "Log interaction"],
      ["simple-contact-manager:open-dashboard", "Dashboard"]
    ]
  },
  {
    title: "Provisioning",
    foodNudge: true,
    commands: [
      ["recipe-manager:meal-plan", "Plan a meal"],
      ["recipe-manager:grocery-list", "Grocery list"],
      ["recipe-manager:new-recipe", "New recipe"],
      ["recipe-manager:open-recipe", "Open recipe"],
      ["recipe-manager:recipe-index", "Recipe index"],
      ["recipe-manager:share", "Share / export"],
      ["recipe-manager:nutrition", "Nutrition"],
      ["recipe-manager:ingredient-data", "Ingredient data"]
    ]
  }
];
var ActionsPanel = class extends BasePanel2 {
  constructor() {
    super(...arguments);
    this.id = "actions";
    this.title = "Quick Actions";
  }
  renderBody() {
    const { bridge, app } = this.ctx;
    placard(this.el, "Quick Actions");
    const nudge = () => this.ctx.markFoodFocus();
    const primary = this.el.createDiv({ cls: "mrd-btn-row mrd-actions-primary" });
    commandButton2(primary, app, "arfid-tracker:quick-log", "Log a food", { cls: "mrd-btn-primary mrd-btn-lg", onRun: nudge });
    commandButton2(primary, app, "spiral-shutdown-logger:quick-capture", "Log an entry", { cls: "mrd-btn-cold mrd-btn-lg" });
    commandButton2(primary, app, "arfid-tracker:struggling", "I'm struggling", { cls: "mrd-btn-lg mrd-btn-warn", onRun: nudge });
    for (const group of GROUPS) {
      const block = this.el.createDiv({ cls: "mrd-actions-group" });
      block.createDiv({ cls: "mrd-subhead", text: group.title });
      const row = block.createDiv({ cls: "mrd-btn-row" });
      for (const [id, label] of group.commands) {
        commandButton2(row, app, id, label, { cls: "mrd-btn-sm", onRun: group.foodNudge ? nudge : void 0 });
      }
    }
  }
};

// src/panels/search.ts
var import_obsidian23 = require("obsidian");
var BODY_SCAN_CAP = 1e5;
var SearchPanel = class extends BasePanel2 {
  constructor() {
    super(...arguments);
    this.id = "search";
    this.title = "Knowledge Base";
    this.index = [];
    this.selected = 0;
    this.hits = [];
    this.debounce = null;
    /** Bumped per query so a slow body scan from a stale query is discarded. */
    this.queryToken = 0;
    this.showingRecent = true;
  }
  async setup() {
    this.buildIndex();
    this.onCleanup(() => {
      if (this.debounce !== null) window.clearTimeout(this.debounce);
    });
  }
  buildIndex() {
    var _a;
    const path = normalizeFolder(this.ctx.settings().kbSearchPath);
    this.index = [];
    for (const file of this.ctx.app.vault.getMarkdownFiles()) {
      if (path && !file.path.startsWith(path)) continue;
      const cache = this.ctx.app.metadataCache.getFileCache(file);
      const headings = ((_a = cache == null ? void 0 : cache.headings) != null ? _a : []).map((h) => h.heading);
      this.index.push({ file, basename: file.basename, headings, mtime: file.stat.mtime, size: file.stat.size });
    }
  }
  renderBody() {
    this.buildIndex();
    placard(this.el, "Knowledge Base");
    const store = this.ctx.plugin.knowledgeBase;
    const actions = this.el.createDiv({ cls: "mrd-btn-row" });
    const note = actions.createEl("button", { cls: "mrd-btn mrd-btn-primary", text: "+ Note" });
    note.addEventListener("click", () => new NewNoteModal(this.ctx.app, store, () => this.rerender()).open());
    const cat = actions.createEl("button", { cls: "mrd-btn", text: "+ Category" });
    cat.addEventListener("click", () => new NewCategoryModal(this.ctx.app, store, () => this.rerender()).open());
    const assign2 = actions.createEl("button", { cls: "mrd-btn", text: "Assign to category" });
    assign2.addEventListener("click", () => runAssignFlow(this.ctx.app, store, () => this.rerender()));
    const input = this.el.createEl("input", {
      cls: "mrd-search-input",
      attr: { type: "search", placeholder: "Search the knowledge base\u2026", enterkeyhint: "search" }
    });
    this.inputEl = input;
    this.resultsEl = this.el.createDiv({ cls: "mrd-search-results" });
    input.addEventListener("input", () => this.scheduleQuery(input.value));
    input.addEventListener("keydown", (e) => this.onKey(e));
    void this.runQuery("");
    this.renderCategories();
  }
  /** Debounce body-scanning input ~150ms; empty query resolves immediately. */
  scheduleQuery(query) {
    if (this.debounce !== null) window.clearTimeout(this.debounce);
    if (!query.trim()) {
      void this.runQuery(query);
      return;
    }
    this.debounce = window.setTimeout(() => {
      this.debounce = null;
      void this.runQuery(query);
    }, 150);
  }
  renderCategories() {
    const store = this.ctx.plugin.knowledgeBase;
    const cats = store.listCategories();
    const section = this.el.createDiv({ cls: "mrd-sb-cats" });
    section.createDiv({ cls: "mrd-subhead", text: `Categories \xB7 ${cats.length}` });
    if (cats.length === 0) {
      section.createDiv({ cls: "mrd-muted", text: "No categories yet. Create one to start organizing." });
      return;
    }
    const listEl = section.createDiv();
    void (async () => {
      const withMembers = await Promise.all(
        cats.map(async (c) => ({ cat: c, members: await store.categoryMembers(c.file) }))
      );
      if (!listEl.isConnected) return;
      for (const { cat, members } of withMembers) {
        const details = listEl.createEl("details", { cls: "mrd-sb-cat" });
        const summary = details.createEl("summary");
        summary.createSpan({ cls: "mrd-sb-cat-name", text: cat.name });
        summary.createSpan({ cls: "mrd-chip mrd-chip-cold", text: String(members.length) });
        const body = details.createDiv({ cls: "mrd-sb-cat-body" });
        if (members.length === 0) body.createDiv({ cls: "mrd-muted", text: "Empty." });
        for (const m of members) {
          const row = body.createDiv({ cls: "mrd-sb-member" });
          const link = row.createEl("a", { cls: "mrd-sb-link", text: m });
          link.addEventListener("click", (e) => {
            e.preventDefault();
            void this.ctx.app.workspace.openLinkText(m, cat.file.path, false);
          });
        }
      }
    })();
  }
  async runQuery(query) {
    var _a;
    const q = query.trim();
    const token = ++this.queryToken;
    this.selected = 0;
    if (!q) {
      this.showingRecent = true;
      const n = Math.max(0, (_a = this.ctx.settings().kbRecentCount) != null ? _a : 8);
      this.hits = this.index.slice().sort((a, b) => b.mtime - a.mtime).slice(0, n).map((c) => ({ file: c.file, title: c.basename, context: "", score: 0, body: false }));
      this.renderResults();
      return;
    }
    this.showingRecent = false;
    const search = (0, import_obsidian23.prepareFuzzySearch)(q);
    const nameHits = [];
    for (const cand of this.index) {
      let best = search(cand.basename);
      let context = "";
      for (const h of cand.headings) {
        const r = search(h);
        if (r && (!best || r.score > best.score)) {
          best = r;
          context = h;
        }
      }
      if (best) nameHits.push({ file: cand.file, title: cand.basename, context, score: best.score, body: false });
    }
    nameHits.sort((a, b) => b.score - a.score);
    this.hits = nameHits.slice(0, 20);
    this.renderResults();
    if (!this.ctx.settings().kbSearchBody) return;
    const already = new Set(nameHits.map((h) => h.file.path));
    const needle = q.toLowerCase();
    const bodyHits = [];
    for (const cand of this.index) {
      if (already.has(cand.file.path)) continue;
      if (cand.size > BODY_SCAN_CAP) continue;
      let content;
      try {
        content = await this.ctx.app.vault.cachedRead(cand.file);
      } catch (e) {
        continue;
      }
      if (token !== this.queryToken) return;
      const snippet = firstMatchingLine(content, needle);
      if (snippet) bodyHits.push({ file: cand.file, title: cand.basename, context: snippet, score: 0, body: true });
    }
    if (token !== this.queryToken) return;
    this.hits = [...nameHits, ...bodyHits].slice(0, 30);
    this.renderResults();
  }
  renderResults() {
    const el = this.resultsEl;
    if (!el) return;
    el.empty();
    if (this.showingRecent) {
      if (this.hits.length === 0) {
        el.createDiv({ cls: "mrd-muted", text: "No notes in the knowledge-base scope yet." });
        return;
      }
      el.createDiv({ cls: "mrd-subhead", text: `Recently modified \xB7 ${this.hits.length}` });
    } else if (this.hits.length === 0) {
      el.createDiv({ cls: "mrd-muted", text: "No matches in the knowledge base." });
      return;
    }
    this.hits.forEach((hit, i) => {
      const row = el.createDiv({ cls: "mrd-search-row" });
      if (i === this.selected) row.addClass("is-selected");
      row.createDiv({ cls: "mrd-search-title", text: hit.title });
      if (hit.context && hit.context !== hit.title) {
        const ctx = row.createDiv({ cls: "mrd-search-context", text: hit.context });
        if (hit.body) ctx.addClass("is-body");
      }
      row.addEventListener("click", () => this.open(hit.file));
    });
  }
  onKey(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.selected = Math.min(this.hits.length - 1, this.selected + 1);
      this.renderResults();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.selected = Math.max(0, this.selected - 1);
      this.renderResults();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = this.hits[this.selected];
      if (hit) this.open(hit.file);
    }
  }
  open(file) {
    void this.ctx.app.workspace.getLeaf(false).openFile(file);
  }
};
function normalizeFolder(path) {
  const p = path.trim().replace(/^\/+/, "");
  if (!p) return "";
  return p.endsWith("/") ? p : p + "/";
}
function firstMatchingLine(content, needle) {
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.toLowerCase().includes(needle)) {
      return line.length > 120 ? line.slice(0, 117) + "\u2026" : line;
    }
  }
  return "";
}

// src/panels/secondbrain.ts
var import_obsidian24 = require("obsidian");
var SecondBrainPanel = class extends BasePanel2 {
  constructor() {
    super(...arguments);
    this.id = "secondbrain";
    this.title = "Second Brain";
    this.query = "";
  }
  get store() {
    return this.ctx.plugin.secondBrain;
  }
  renderBody() {
    const head = placard(this.el, "Second Brain");
    const notes = this.store.listNotes();
    head.createSpan({ cls: "mrd-placard-badge", text: `${notes.length} active` });
    const actions = this.el.createDiv({ cls: "mrd-btn-row" });
    const add = actions.createEl("button", { cls: "mrd-btn mrd-btn-primary", text: "+ Note" });
    add.addEventListener("click", () => new NewNoteModal2(this.ctx.app, this.store, () => this.rerender()).open());
    const input = this.el.createEl("input", {
      cls: "mrd-search-input",
      attr: { type: "search", placeholder: "Search the Second Brain\u2026" }
    });
    input.value = this.query;
    const results = this.el.createDiv({ cls: "mrd-sb-results" });
    const render = () => {
      results.empty();
      const q = this.query.trim();
      const list = q ? this.fuzzy(notes, q) : notes.slice(0, 12);
      if (list.length === 0) {
        results.createDiv({ cls: "mrd-muted", text: q ? "No matches." : "No active notes yet." });
        return;
      }
      for (const file of list) this.renderNoteRow(results, file);
      if (!q && notes.length > 12) {
        results.createDiv({ cls: "mrd-muted", text: `+${notes.length - 12} more \u2014 type to search.` });
      }
    };
    input.addEventListener("input", () => {
      this.query = input.value;
      render();
    });
    render();
    const archived = this.store.listArchived();
    if (archived.length > 0) {
      const arch = this.el.createEl("details", { cls: "mrd-sb-archived" });
      arch.createEl("summary", { text: `Archive \xB7 ${archived.length}` });
      const list = arch.createDiv();
      for (const file of archived) {
        const row = list.createDiv({ cls: "mrd-sb-member" });
        const link = row.createEl("a", { cls: "mrd-sb-link", text: file.basename });
        link.addEventListener("click", (e) => {
          e.preventDefault();
          void this.ctx.app.workspace.getLeaf(false).openFile(file);
        });
        this.iconBtn(row, "\u293A", "Unarchive", async () => {
          await this.store.restoreNote(file);
          new import_obsidian24.Notice(`Restored ${file.basename}.`);
          this.rerender();
        });
      }
    }
  }
  renderNoteRow(parent, file) {
    const row = parent.createDiv({ cls: "mrd-sb-row" });
    const link = row.createEl("a", { cls: "mrd-sb-link", text: file.basename });
    link.addEventListener("click", (e) => {
      e.preventDefault();
      void this.ctx.app.workspace.getLeaf(false).openFile(file);
    });
    this.iconBtn(row, "\u{1F5C4}", "Archive", async () => {
      await this.store.archiveNote(file);
      new import_obsidian24.Notice(`Archived ${file.basename}.`);
      this.rerender();
    });
    this.iconBtn(row, "\u{1F5D1}", "Delete", () => {
      new ConfirmModal(this.ctx.app, `Delete \u201C${file.basename}\u201D?`, "It goes to your configured trash and is removed from any category.", async () => {
        await this.store.deleteNote(file);
        new import_obsidian24.Notice(`Deleted ${file.basename}.`);
        this.rerender();
      }).open();
    });
  }
  iconBtn(parent, glyph, label, onClick) {
    const b = parent.createEl("button", { cls: "mrd-icon-btn mrd-sb-icon", text: glyph, attr: { title: label, "aria-label": label } });
    b.addEventListener("click", onClick);
  }
  fuzzy(files, query) {
    var _a;
    const search = (0, import_obsidian24.prepareFuzzySearch)(query);
    const scored = [];
    for (const file of files) {
      let best = search(file.basename);
      const cache = this.ctx.app.metadataCache.getFileCache(file);
      for (const h of (_a = cache == null ? void 0 : cache.headings) != null ? _a : []) {
        const r = search(h.heading);
        if (r && (!best || r.score > best.score)) best = r;
      }
      if (best) scored.push({ file, score: best.score });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, 20).map((s) => s.file);
  }
};
var NewNoteModal2 = class extends import_obsidian24.Modal {
  constructor(app, store, onDone) {
    super(app);
    this.store = store;
    this.onDone = onDone;
    this.title = "";
  }
  onOpen() {
    this.titleEl.setText("New note");
    new import_obsidian24.Setting(this.contentEl).setName("Title").addText((t) => {
      t.setPlaceholder("Note title").onChange((v) => this.title = v);
      t.inputEl.focus();
      t.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void this.submit();
        }
      });
    });
    new import_obsidian24.Setting(this.contentEl).addButton((b) => b.setButtonText("Cancel").onClick(() => this.close())).addButton((b) => b.setButtonText("Create").setCta().onClick(() => void this.submit()));
  }
  async submit() {
    const title = this.title.trim();
    if (!title) {
      new import_obsidian24.Notice("A note needs a title.");
      return;
    }
    const file = await this.store.createNote(title);
    this.close();
    this.onDone();
    await this.app.workspace.getLeaf(false).openFile(file);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ConfirmModal = class extends import_obsidian24.Modal {
  constructor(app, heading, body, onConfirm) {
    super(app);
    this.heading = heading;
    this.body = body;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    this.titleEl.setText(this.heading);
    this.contentEl.createEl("p", { text: this.body });
    new import_obsidian24.Setting(this.contentEl).addButton((b) => b.setButtonText("Cancel").onClick(() => this.close())).addButton(
      (b) => b.setButtonText("Delete").setWarning().onClick(() => {
        this.close();
        this.onConfirm();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/panels/registry.ts
var PANEL_ORDER = [
  "clock",
  "meridian",
  "todo",
  "agenda",
  "calendar",
  "actions",
  "qotd",
  "journal",
  "meals",
  "arfid",
  "spiral",
  "crm",
  "search",
  "secondbrain",
  "places"
];
var PANEL_TITLES = {
  clock: "Chronometer",
  meridian: "MERIDIAN",
  todo: "Directives",
  agenda: "Today's Agenda",
  calendar: "Calendar",
  actions: "Quick Actions",
  qotd: "Quote of the Day",
  journal: "Daily Log",
  meals: "Meals & Provisioning",
  arfid: "Nourishment Log",
  spiral: "Regulation Log",
  crm: "Contacts",
  search: "Knowledge Base",
  secondbrain: "Second Brain",
  places: "Navigation"
};
var FACTORIES = {
  clock: () => new ClockPanel(MERIDIAN_CLOCK_COPY),
  meridian: () => new MeridianPanel(),
  todo: () => new TodoPanel(),
  agenda: () => new AgendaPanel(),
  calendar: () => new CalendarPanel(),
  actions: () => new ActionsPanel(),
  qotd: () => new QotdPanel(),
  journal: () => new JournalPanel(),
  meals: () => new MealsPanel(MERIDIAN_MEALS_COPY),
  arfid: () => new ArfidPanel(),
  spiral: () => new SpiralPanel(),
  crm: () => new CrmPanel(),
  search: () => new SearchPanel(),
  secondbrain: () => new SecondBrainPanel(),
  places: () => new PlacesPanel(MERIDIAN_PLACES_COPY)
};
function createPanels(order, enabled) {
  const seen = /* @__PURE__ */ new Set();
  const panels = [];
  for (const id of order) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (enabled[id] === false) continue;
    const factory = FACTORIES[id];
    if (factory) panels.push(factory());
  }
  return panels;
}

// src/settings.ts
var DEFAULT_SETTINGS = {
  openOnStartup: false,
  replaceNewTab: false,
  logsBaseNote: "Logs Hub.base",
  panelOrder: [...PANEL_ORDER],
  enabledPanels: Object.fromEntries(PANEL_ORDER.map((id) => [id, true])),
  panelColumns: {},
  panelSpans: {},
  meridianRotationMinutes: 5,
  agendaRefreshMinutes: 30,
  agendaUrls: [],
  kbSearchPath: "Knowledge base/Notes/",
  kbRecentCount: 8,
  kbSearchBody: true,
  kbRootPath: "Knowledge base",
  kbNotesSubfolder: "Notes",
  kbCategoriesSubfolder: "Categories",
  kbArchiveSubfolder: "Archive",
  kbListHeading: "Notes",
  secondBrainPath: "Second Brain",
  secondBrainCategoriesSubfolder: "Categories",
  secondBrainArchiveSubfolder: "Archive",
  secondBrainListHeading: "Notes",
  directivesPath: "MERIDIAN/Directives.md",
  places: [
    { label: "Central Hub", target: "Central Hub", type: "note" },
    { label: "Contact Dashboard", target: "Contact Dashboard", type: "note" },
    { label: "Logs Hub", target: "Logs Hub.base", type: "note" },
    { label: "SDM", target: "SDM.base", type: "note" },
    { label: "ARFID Dashboard", target: "arfid-tracker:open-dashboard", type: "command" },
    { label: "Spiral Log", target: "spiral-shutdown-logger:open-dashboard", type: "command" },
    { label: "Contacts", target: "simple-contact-manager:open-dashboard", type: "command" },
    { label: "Recipe Index", target: "recipe-manager:recipe-index", type: "command" }
  ],
  completedTasksMarker: "",
  completedTasksHeading: "Completed tasks",
  crmLogMarker: "%% crm-log %%",
  crmLogHeading: "Contacts reached"
};
function mergeSettings(loaded) {
  var _a, _b, _c, _d;
  const s = { ...DEFAULT_SETTINGS, ...loaded != null ? loaded : {} };
  const order = ((_a = loaded == null ? void 0 : loaded.panelOrder) != null ? _a : []).filter((id) => PANEL_ORDER.includes(id));
  for (const id of PANEL_ORDER) if (!order.includes(id)) order.push(id);
  s.panelOrder = order;
  s.enabledPanels = { ...DEFAULT_SETTINGS.enabledPanels, ...(_b = loaded == null ? void 0 : loaded.enabledPanels) != null ? _b : {} };
  s.panelColumns = pickKnown(loaded == null ? void 0 : loaded.panelColumns);
  s.panelSpans = pickKnown(loaded == null ? void 0 : loaded.panelSpans);
  s.agendaUrls = ((_c = loaded == null ? void 0 : loaded.agendaUrls) != null ? _c : DEFAULT_SETTINGS.agendaUrls).map((c) => ({ ...c }));
  s.places = ((_d = loaded == null ? void 0 : loaded.places) != null ? _d : DEFAULT_SETTINGS.places).map((p) => ({ ...p }));
  return s;
}
function pickKnown(map) {
  const out = {};
  for (const id of PANEL_ORDER) {
    const v = map == null ? void 0 : map[id];
    if (typeof v === "number" && Number.isFinite(v)) out[id] = v;
  }
  return out;
}
var MeridianSettingTab = class extends import_obsidian25.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  async save() {
    await this.plugin.saveData_();
    this.plugin.refreshOpenViews();
  }
  /** Persist and re-mount open views — for panel enable/reorder changes, where
   * a refresh alone wouldn't change the mounted order. */
  async saveLayout() {
    await this.plugin.saveData_();
    this.plugin.rebuildOpenViews();
  }
  display() {
    const { containerEl } = this;
    const s = this.plugin.settings;
    containerEl.empty();
    new import_obsidian25.Setting(containerEl).setName("General").setHeading();
    new import_obsidian25.Setting(containerEl).setName("Open on startup").setDesc("Open the MERIDIAN dashboard when Obsidian starts.").addToggle(
      (t) => t.setValue(s.openOnStartup).onChange(async (v) => {
        s.openOnStartup = v;
        await this.save();
      })
    );
    new import_obsidian25.Setting(containerEl).setName("Replace the New Tab page").setDesc("Turn every empty New Tab into the dashboard, so it becomes your landing view instead of the empty page or the daily note.").addToggle(
      (t) => t.setValue(s.replaceNewTab).onChange(async (v) => {
        s.replaceNewTab = v;
        await this.save();
        if (v) this.plugin.replaceActiveEmptyLeaf();
      })
    );
    new import_obsidian25.Setting(containerEl).setName("Panels").setDesc(
      "Toggle panels on or off and reorder them. On the desktop you can also place each panel in a column (1\u20133) and give it a span; leave everything at column 1 to keep the default packed layout. A phone always stacks to one column in this order."
    ).setHeading();
    const list = containerEl.createDiv({ cls: "mrd-settings-panel-list" });
    const renderList = () => {
      list.empty();
      s.panelOrder.forEach((id, index) => {
        var _a;
        const row = new import_obsidian25.Setting(list).setName((_a = PANEL_TITLES[id]) != null ? _a : id);
        row.addExtraButton(
          (b) => b.setIcon("arrow-up").setTooltip("Move up").setDisabled(index === 0).onClick(async () => {
            [s.panelOrder[index - 1], s.panelOrder[index]] = [s.panelOrder[index], s.panelOrder[index - 1]];
            await this.saveLayout();
            renderList();
          })
        );
        row.addExtraButton(
          (b) => b.setIcon("arrow-down").setTooltip("Move down").setDisabled(index === s.panelOrder.length - 1).onClick(async () => {
            [s.panelOrder[index + 1], s.panelOrder[index]] = [s.panelOrder[index], s.panelOrder[index + 1]];
            await this.saveLayout();
            renderList();
          })
        );
        row.addDropdown((dd) => {
          var _a2;
          dd.addOptions({ "1": "Col 1", "2": "Col 2", "3": "Col 3" });
          dd.setValue(String((_a2 = s.panelColumns[id]) != null ? _a2 : 1)).onChange(async (v) => {
            s.panelColumns[id] = Number(v);
            await this.saveLayout();
          });
        });
        row.addDropdown((dd) => {
          var _a2;
          dd.addOptions({ "1": "Span 1", "2": "Span 2", "3": "Span 3" });
          dd.setValue(String((_a2 = s.panelSpans[id]) != null ? _a2 : 1)).onChange(async (v) => {
            s.panelSpans[id] = Number(v);
            await this.saveLayout();
          });
        });
        row.addToggle(
          (t) => t.setValue(s.enabledPanels[id] !== false).onChange(async (v) => {
            s.enabledPanels[id] = v;
            await this.saveLayout();
          })
        );
      });
    };
    renderList();
    new import_obsidian25.Setting(containerEl).setName("MERIDIAN ambient line").setHeading();
    new import_obsidian25.Setting(containerEl).setName("Rotation interval (minutes)").setDesc("How often the ambient line rotates. It also rotates on refresh.").addText(
      (t) => t.setValue(String(s.meridianRotationMinutes)).onChange(async (v) => {
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) {
          s.meridianRotationMinutes = n;
          await this.save();
        }
      })
    );
    new import_obsidian25.Setting(containerEl).setName("Today's agenda").setHeading();
    new import_obsidian25.Setting(containerEl).setName("Refresh interval (minutes)").setDesc("How often calendars are re-fetched while the dashboard is open.").addText(
      (t) => t.setValue(String(s.agendaRefreshMinutes)).onChange(async (v) => {
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) {
          s.agendaRefreshMinutes = n;
          await this.save();
        }
      })
    );
    new import_obsidian25.Setting(containerEl).setName("Calendars").setDesc(
      "Up to 10 public Proton Calendar share links (.ics). Today only \u2014 no month view. Each has a swatch colour, a countdown toggle (keep it on the agenda while excluding it from the NEXT / open-gap math \u2014 e.g. a birthdays feed), and a remove button."
    );
    const calList = containerEl.createDiv({ cls: "mrd-settings-cal-list" });
    const renderCals = () => {
      calList.empty();
      s.agendaUrls.forEach((cal, i) => {
        const row = new import_obsidian25.Setting(calList).setName(`Calendar ${i + 1}`);
        row.addText(
          (t) => t.setPlaceholder("Label").setValue(cal.label).onChange(async (v) => {
            cal.label = v.trim() || "Calendar";
            await this.save();
          })
        );
        row.addText((t) => {
          t.setPlaceholder("https://\u2026/basic.ics").setValue(cal.url).onChange(async (v) => {
            cal.url = v.trim();
            await this.save();
          });
          t.inputEl.classList.add("mrd-settings-cal-url");
        });
        row.addColorPicker(
          (c) => c.setValue(cal.color || calendarColor(i)).onChange(async (v) => {
            cal.color = v;
            await this.save();
          })
        );
        row.addExtraButton(
          (b) => b.setIcon("rotate-ccw").setTooltip("Reset colour to the default palette").onClick(async () => {
            cal.color = void 0;
            await this.save();
            renderCals();
          })
        );
        row.addToggle(
          (t) => t.setTooltip("Count in the next-event countdown").setValue(cal.countdown !== false).onChange(async (v) => {
            cal.countdown = v;
            await this.save();
          })
        );
        row.addExtraButton(
          (b) => b.setIcon("trash").setTooltip("Remove this calendar").onClick(async () => {
            s.agendaUrls.splice(i, 1);
            await this.save();
            renderCals();
          })
        );
      });
      const addRow = new import_obsidian25.Setting(calList);
      addRow.addButton(
        (b) => b.setButtonText("+ Add calendar").setDisabled(s.agendaUrls.length >= 10).onClick(async () => {
          if (s.agendaUrls.length >= 10) return;
          s.agendaUrls.push({ label: "Calendar", url: "", countdown: true });
          await this.save();
          renderCals();
        })
      );
    };
    renderCals();
    new import_obsidian25.Setting(containerEl).setName("Calendar").setHeading();
    this.addText(
      containerEl,
      "Logs base note",
      "Note or .base file opened by the Calendar card's header button (e.g. Logs Hub.base). Leave blank to hide the button.",
      s.logsBaseNote,
      (v) => s.logsBaseNote = v,
      true
    );
    new import_obsidian25.Setting(containerEl).setName("Knowledge base").setHeading();
    new import_obsidian25.Setting(containerEl).setName("Search folder").setDesc("Fuzzy search is scoped to this folder only.").addText(
      (t) => t.setPlaceholder(DEFAULT_SETTINGS.kbSearchPath).setValue(s.kbSearchPath).onChange(async (v) => {
        s.kbSearchPath = v.trim() || DEFAULT_SETTINGS.kbSearchPath;
        await this.save();
      })
    );
    new import_obsidian25.Setting(containerEl).setName("Recent notes shown").setDesc("How many recently-modified notes to list when the search box is empty.").addText(
      (t) => t.setValue(String(s.kbRecentCount)).onChange(async (v) => {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0) {
          s.kbRecentCount = Math.floor(n);
          await this.save();
        }
      })
    );
    new import_obsidian25.Setting(containerEl).setName("Search note bodies").setDesc("Also match note contents, not just filenames and headings. Filename/heading hits still rank first. Turn off if a large vault feels slow.").addToggle(
      (t) => t.setValue(s.kbSearchBody).onChange(async (v) => {
        s.kbSearchBody = v;
        await this.save();
      })
    );
    this.addText(containerEl, "Library root", "Root folder for knowledge-base category management.", s.kbRootPath, (v) => s.kbRootPath = v || "Knowledge base");
    this.addText(containerEl, "Notes subfolder", "Where notes live, relative to the library root \u2014 the pool you assign to categories.", s.kbNotesSubfolder, (v) => s.kbNotesSubfolder = v, true);
    this.addText(containerEl, "Categories subfolder", "Where category notes live, relative to the library root.", s.kbCategoriesSubfolder, (v) => s.kbCategoriesSubfolder = v || "Categories");
    this.addText(containerEl, "Category list heading", "Heading in a category note under which the alphabetized wikilinks live.", s.kbListHeading, (v) => s.kbListHeading = v || "Notes");
    new import_obsidian25.Setting(containerEl).setName("Second Brain").setHeading();
    this.addText(containerEl, "Second Brain folder", "The ongoing-project library the Second Brain panel manages.", s.secondBrainPath, (v) => s.secondBrainPath = v || "Second Brain");
    this.addText(containerEl, "Archive subfolder", "Where archived notes are moved, relative to the Second Brain folder.", s.secondBrainArchiveSubfolder, (v) => s.secondBrainArchiveSubfolder = v || "Archive");
    new import_obsidian25.Setting(containerEl).setName("Places / navigation").setHeading();
    new import_obsidian25.Setting(containerEl).setName("Destinations").setDesc(
      "One per line as `Label | target`. A target is a note/base name (e.g. `Central Hub`, `Logs Hub.base`) or, prefixed with `cmd:`, a command id (e.g. `cmd:arfid-tracker:open-dashboard`)."
    ).addTextArea((t) => {
      t.setValue(
        s.places.map((p) => `${p.label} | ${p.type === "command" ? "cmd:" + p.target : p.target}`).join("\n")
      );
      t.inputEl.rows = 8;
      t.onChange(async (v) => {
        s.places = v.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
          const bar = line.indexOf("|");
          const label = bar === -1 ? line : line.slice(0, bar).trim();
          let target = bar === -1 ? line : line.slice(bar + 1).trim();
          const type = target.startsWith("cmd:") ? "command" : "note";
          if (type === "command") target = target.slice(4).trim();
          return { label, target, type };
        });
        await this.save();
      });
    });
    new import_obsidian25.Setting(containerEl).setName("Directives").setHeading();
    this.addText(
      containerEl,
      "Directives file",
      "Markdown vault file the persistent to-do list is stored in. Markdown always syncs via Obsidian Sync, so the list crosses devices. Any extension you enter is coerced to .md.",
      s.directivesPath,
      (v) => s.directivesPath = v || "MERIDIAN/Directives.md"
    );
    new import_obsidian25.Setting(containerEl).setName("Daily note write targets").setHeading();
    this.addText(containerEl, "Completed-tasks heading", "Completed to-dos are archived under this heading.", s.completedTasksHeading, (v) => s.completedTasksHeading = v || "Completed tasks");
    this.addText(containerEl, "Completed-tasks marker", "Optional. If set, completed tasks go after this marker instead of the heading.", s.completedTasksMarker, (v) => s.completedTasksMarker = v, true);
    this.addText(containerEl, "Contacts-reached marker", "Marker Simple Contact Manager writes its daily log under; used by the reconcile safety net.", s.crmLogMarker, (v) => s.crmLogMarker = v);
    this.addText(containerEl, "Contacts-reached heading", "Fallback heading for the contacts-reached log.", s.crmLogHeading, (v) => s.crmLogHeading = v || "Contacts reached");
  }
  addText(el, name, desc, value, set, allowEmpty = false) {
    new import_obsidian25.Setting(el).setName(name).setDesc(desc).addText(
      (t) => t.setValue(value).onChange(async (v) => {
        const trimmed = v.trim();
        if (!trimmed && !allowEmpty) return;
        set(trimmed);
        await this.save();
      })
    );
  }
};

// src/core/bridge.ts
var import_obsidian26 = require("obsidian");
var ARFID_ID = "arfid-tracker";
var SPIRAL_ID = "spiral-shutdown-logger";
var CRM_ID = "simple-contact-manager";
var RECIPES_ID = "recipe-manager";
var PRIORITY_RANK = { high: 0, medium: 1, low: 2, "": 3 };
var Bridge = class {
  constructor(app) {
    this.app = app;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugin(id) {
    var _a, _b;
    return (_b = (_a = this.app.plugins) == null ? void 0 : _a.plugins) == null ? void 0 : _b[id];
  }
  enabled(id) {
    var _a, _b, _c;
    return !!((_c = (_b = (_a = this.app.plugins) == null ? void 0 : _a.enabledPlugins) == null ? void 0 : _b.has) == null ? void 0 : _c.call(_b, id)) || !!this.plugin(id);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api(id) {
    var _a;
    const api = (_a = this.plugin(id)) == null ? void 0 : _a.api;
    return api && typeof api.version === "number" ? api : null;
  }
  commandExists(fullId) {
    var _a, _b;
    const commands = (_b = (_a = this.app.commands) == null ? void 0 : _a.commands) != null ? _b : {};
    return !!commands[fullId];
  }
  runCommand(fullId) {
    var _a, _b;
    (_b = (_a = this.app.commands) == null ? void 0 : _a.executeCommandById) == null ? void 0 : _b.call(_a, fullId);
  }
  // -------------------------------------------------------------- ARFID
  arfidAvailable() {
    return this.enabled(ARFID_ID);
  }
  async arfidToday(date = today()) {
    var _a;
    const api = this.api(ARFID_ID);
    if (api == null ? void 0 : api.getEntriesForDate) {
      try {
        const entries = (_a = api.getEntriesForDate(date)) != null ? _a : [];
        return entries.map((e) => {
          var _a2, _b, _c;
          return {
            time: (_a2 = e.time) != null ? _a2 : "",
            label: (_c = (_b = e.food) != null ? _b : e.label) != null ? _c : ""
          };
        });
      } catch (e) {
        console.error("MERIDIAN: arfid api read failed, falling back", e);
      }
    }
    const raw = await readDailyNoteRaw(this.app, date);
    return parseLogLines(readMarkerLogLines(raw, "%% arfid-log %%", "Miscellaneous notes"));
  }
  // ------------------------------------------------------------- Spiral
  spiralAvailable() {
    return this.enabled(SPIRAL_ID);
  }
  async spiralToday(date = today()) {
    var _a;
    const api = this.api(SPIRAL_ID);
    if (api == null ? void 0 : api.getEntriesForDate) {
      try {
        const entries = (_a = api.getEntriesForDate(date)) != null ? _a : [];
        return entries.map((e) => {
          var _a2, _b, _c;
          return {
            time: (_a2 = e.time) != null ? _a2 : "",
            label: (_c = (_b = e.label) != null ? _b : e.kind) != null ? _c : "entry"
          };
        });
      } catch (e) {
        console.error("MERIDIAN: spiral api read failed, falling back", e);
      }
    }
    const raw = await readDailyNoteRaw(this.app, date);
    return parseLogLines(readMarkerLogLines(raw, "%% spiral-log %%", "Spiral log"));
  }
  /** Count of regulation entries for a date — counts only, never content (§1.4). */
  async spiralEntriesForDate(date = today()) {
    return (await this.spiralToday(date)).length;
  }
  /** Cheap "did a spiral/shutdown happen today" — drives aftercare weighting (§7.3). */
  async spiralOccurredToday(date = today()) {
    const api = this.api(SPIRAL_ID);
    if (api == null ? void 0 : api.hadEntryOn) {
      try {
        return !!api.hadEntryOn(date);
      } catch (e) {
        console.error("MERIDIAN: spiral api hadEntryOn failed, falling back", e);
      }
    }
    const entries = await this.spiralToday(date);
    return entries.length > 0;
  }
  // ---------------------------------------------------------------- CRM
  crmAvailable() {
    return this.enabled(CRM_ID);
  }
  /** Try to log a specific contact through the plugin's own modal (API v2+).
   * Returns true if it handled it. */
  crmLogViaApi(pathOrName) {
    const api = this.api(CRM_ID);
    if ((api == null ? void 0 : api.logInteraction) && api.version >= 2) {
      try {
        return !!api.logInteraction(pathOrName);
      } catch (e) {
        console.error("MERIDIAN: crm api logInteraction failed, falling back", e);
      }
    }
    return false;
  }
  resolveContact(pathOrName) {
    var _a, _b, _c, _d;
    const byPath = this.app.vault.getAbstractFileByPath(pathOrName);
    if (byPath instanceof import_obsidian26.TFile) return byPath;
    const folder = ((_c = (_b = (_a = this.plugin(CRM_ID)) == null ? void 0 : _a.settings) == null ? void 0 : _b.contactsFolder) != null ? _c : "Contacts").trim();
    return (_d = this.app.vault.getMarkdownFiles().find((f) => (!folder || f.path.startsWith(folder + "/")) && f.basename === pathOrName)) != null ? _d : null;
  }
  /** Log an interaction for a specific contact ourselves, when the plugin's API
   * isn't available (older Simple Contact Manager). Mirrors the plugin's write:
   * update the contact note's Interaction Log, advance the follow-up cadence in
   * frontmatter, and write the daily-note line. Returns true on success. */
  async crmWriteInteraction(pathOrName, noteText) {
    var _a, _b, _c, _d, _e, _f, _g;
    const file = this.resolveContact(pathOrName);
    if (!file) return false;
    const text = noteText.trim();
    if (!text) return false;
    const fm = (_b = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) != null ? _b : {};
    const followupDays = Number(fm.followup_days) || 30;
    const todayStr2 = today();
    const next = (0, import_obsidian26.moment)().add(followupDays, "days").format("YYYY-MM-DD");
    const name = String((_c = fm.name) != null ? _c : file.basename);
    await this.app.fileManager.processFrontMatter(file, (f) => {
      f.last_contacted = todayStr2;
      f.next_followup = next;
    });
    await this.app.vault.process(file, (content) => insertInteraction(content, todayStr2, text));
    const s = (_e = (_d = this.plugin(CRM_ID)) == null ? void 0 : _d.settings) != null ? _e : {};
    const marker = ((_f = s.dailyNoteMarker) != null ? _f : "%% crm-log %%").trim();
    const heading = ((_g = s.dailyNoteHeading) != null ? _g : "Contacts reached").trim();
    const time = (0, import_obsidian26.moment)().format("HH:mm");
    try {
      await appendDailyLogLine(this.app, `- ${time} [[${name}|${name}]] \u2014 ${text}`, { marker, heading, time });
    } catch (e) {
      console.error("MERIDIAN: crm daily-note write failed", e);
    }
    return true;
  }
  crmContacts() {
    var _a;
    const api = this.api(CRM_ID);
    if (api == null ? void 0 : api.getContactsSummary) {
      try {
        const rows = (_a = api.getContactsSummary()) != null ? _a : [];
        return rows.map(normalizeCrmRow).sort(sortCrm);
      } catch (e) {
        console.error("MERIDIAN: crm api read failed, falling back", e);
      }
    }
    return this.crmContactsFallback().sort(sortCrm);
  }
  crmContactsFallback() {
    var _a, _b, _c, _d, _e, _f, _g;
    const folder = ((_c = (_b = (_a = this.plugin(CRM_ID)) == null ? void 0 : _a.settings) == null ? void 0 : _b.contactsFolder) != null ? _c : "Contacts").trim();
    const todayStr2 = today();
    const rows = [];
    for (const file of this.app.vault.getMarkdownFiles()) {
      if (folder && !file.path.startsWith(folder + "/")) continue;
      const cache = this.app.metadataCache.getFileCache(file);
      const fm = cache == null ? void 0 : cache.frontmatter;
      if (!fm) continue;
      const tags = cache ? (_d = (0, import_obsidian26.getAllTags)(cache)) != null ? _d : [] : [];
      const isContact = tags.includes("#contact") || fm.tags === "contact" || Array.isArray(fm.tags) && fm.tags.includes("contact");
      if (!isContact || fm.is_template === true) continue;
      const last = String((_e = fm.last_contacted) != null ? _e : "").slice(0, 10);
      const next = String((_f = fm.next_followup) != null ? _f : "").slice(0, 10);
      rows.push({
        name: String((_g = fm.name) != null ? _g : file.basename),
        path: file.path,
        priority: normalizePriority(fm.priority),
        daysSince: last ? (0, import_obsidian26.moment)(todayStr2).diff((0, import_obsidian26.moment)(last, "YYYY-MM-DD"), "days") : null,
        nextFollowup: next,
        overdue: !!next && next < todayStr2,
        dueToday: !!next && next === todayStr2
      });
    }
    return rows;
  }
  // ------------------------------------------------------------- Recipes
  recipesAvailable() {
    return this.enabled(RECIPES_ID);
  }
  recipeSetting(key, fallback) {
    var _a, _b;
    const v = (_b = (_a = this.plugin(RECIPES_ID)) == null ? void 0 : _a.settings) == null ? void 0 : _b[key];
    return typeof v === "string" && v.trim() ? v.trim() : fallback;
  }
  async plannedMeals(date = today()) {
    var _a, _b;
    const api = this.api(RECIPES_ID);
    if (api == null ? void 0 : api.getPlannedMeals) {
      try {
        const res = api.getPlannedMeals(date);
        const meals2 = (_a = res && typeof res.then === "function" ? await res : res) != null ? _a : [];
        return meals2.map((m) => {
          var _a2, _b2, _c, _d, _e;
          return {
            name: (_b2 = (_a2 = m.name) != null ? _a2 : m.basename) != null ? _b2 : "",
            link: (_e = (_d = (_c = m.link) != null ? _c : m.basename) != null ? _d : m.name) != null ? _e : ""
          };
        });
      } catch (e) {
        console.error("MERIDIAN: recipes api read failed, falling back", e);
      }
    }
    const raw = await readDailyNoteRaw(this.app, date);
    const heading = this.recipeSetting("mealHeading", "Meals");
    const body = readHeadingSection(raw, heading);
    const meals = [];
    for (const line of body.split("\n")) {
      const m = line.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
      if (m) meals.push({ name: ((_b = m[2]) != null ? _b : m[1]).trim(), link: m[1].trim() });
    }
    return meals;
  }
  groceryListPath() {
    let path = this.recipeSetting("groceryListPath", "Grocery List.md");
    if (!path.toLowerCase().endsWith(".md")) path += ".md";
    return path;
  }
  async groceryList() {
    const path = this.groceryListPath();
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian26.TFile)) return { path, items: [], exists: false };
    const content = await this.app.vault.cachedRead(file);
    const items = [];
    content.split("\n").forEach((line, idx) => {
      const m = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
      if (m) {
        items.push({
          name: stripFormatting(m[2]),
          checked: m[1].toLowerCase() === "x",
          line: idx
        });
      }
    });
    return { path, items, exists: true };
  }
  /** Toggle a grocery checkbox inline, writing back to the grocery file (§7.10). */
  async toggleGroceryItem(lineIndex) {
    const path = this.groceryListPath();
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian26.TFile)) return;
    await this.app.vault.process(file, (content) => {
      const lines = content.split("\n");
      const line = lines[lineIndex];
      if (!line) return content;
      const m = line.match(/^(\s*[-*]\s+\[)([ xX])(\]\s+.*)$/);
      if (!m) return content;
      const next = m[2].toLowerCase() === "x" ? " " : "x";
      lines[lineIndex] = `${m[1]}${next}${m[3]}`;
      return lines.join("\n");
    });
  }
  // ------------------------------------------------------- CRM reconcile
  /** Safety-net reconcile (§7.9): scan contact notes for a `### <today>` block
   * under `## Interaction Log` and return `- HH:MM [[Name|Name]] — <descriptor>`
   * lines missing from today's note. The dashboard backfills them. */
  async crmReconcileLines(date = today()) {
    var _a, _b, _c, _d, _e;
    const folder = ((_c = (_b = (_a = this.plugin(CRM_ID)) == null ? void 0 : _a.settings) == null ? void 0 : _b.contactsFolder) != null ? _c : "Contacts").trim();
    const raw = await readDailyNoteRaw(this.app, date);
    const existing = new Set(
      readMarkerLogLines(raw, "%% crm-log %%", "Contacts reached").map((l) => l.replace(/^- \d{2}:\d{2}\s*/, "").trim())
    );
    const out = [];
    for (const file of this.app.vault.getMarkdownFiles()) {
      if (folder && !file.path.startsWith(folder + "/")) continue;
      const cache = this.app.metadataCache.getFileCache(file);
      if (!(cache == null ? void 0 : cache.frontmatter)) continue;
      const tags = (_d = (0, import_obsidian26.getAllTags)(cache)) != null ? _d : [];
      if (!tags.includes("#contact")) continue;
      const name = String((_e = cache.frontmatter.name) != null ? _e : file.basename);
      const content = await this.app.vault.cachedRead(file);
      for (const descriptor of interactionsForDate(content, date)) {
        const link = `[[${name}|${name}]]`;
        const tail = `${link} \u2014 ${descriptor}`;
        if (!existing.has(tail)) out.push(tail);
      }
    }
    return out;
  }
};
function today() {
  return (0, import_obsidian26.moment)().format("YYYY-MM-DD");
}
function parseLogLines(lines) {
  return lines.map((l) => {
    const time = l.slice(2, 7);
    const label = l.replace(/^- \d{2}:\d{2}\s*/, "").replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2").replace(/\[\[([^\]]+)\]\]/g, "$1").trim();
    return { time, label };
  });
}
function normalizeCrmRow(r) {
  var _a, _b, _c, _d;
  return {
    name: (_a = r.name) != null ? _a : "",
    path: (_b = r.path) != null ? _b : "",
    priority: normalizePriority(r.priority),
    daysSince: (_c = r.daysSince) != null ? _c : null,
    nextFollowup: (_d = r.nextFollowup) != null ? _d : "",
    overdue: !!r.overdue,
    dueToday: !!r.dueToday
  };
}
function normalizePriority(v) {
  const s = String(v != null ? v : "").trim().toLowerCase();
  return s === "high" || s === "medium" || s === "low" ? s : "";
}
function sortCrm(a, b) {
  var _a, _b;
  const bucket = (r) => r.overdue ? 0 : r.dueToday ? 1 : 2;
  return bucket(a) - bucket(b) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || ((_a = b.daysSince) != null ? _a : -1) - ((_b = a.daysSince) != null ? _b : -1);
}
function stripFormatting(s) {
  return s.replace(/\*\*/g, "").replace(/\*(?!\*)/g, "").replace(/\s+\*\([^)]*\)\s*$/, "").replace(/\s+—\s+to taste/i, " \u2014 to taste").trim();
}
function insertInteraction(content, date, noteText) {
  const logHeading = /^## Interaction Log\s*$/m;
  const todayHeading = `### ${date}`;
  if (!logHeading.test(content)) {
    return `${content.replace(/\s+$/, "")}

## Interaction Log

${todayHeading}
- ${noteText}
`;
  }
  const todayAtTop = new RegExp(`^## Interaction Log\\n+${todayHeading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m");
  if (todayAtTop.test(content)) {
    return content.replace(todayAtTop, (match) => `${match}
- ${noteText}`);
  }
  return content.replace(logHeading, (match) => `${match}

${todayHeading}
- ${noteText}
`);
}
function interactionsForDate(content, date) {
  const lines = content.split("\n");
  const logIdx = lines.findIndex((l) => /^##\s+Interaction Log\s*$/i.test(l));
  if (logIdx === -1) return [];
  const dateIdx = lines.findIndex((l, i) => i > logIdx && l.trim() === `### ${date}`);
  if (dateIdx === -1) return [];
  const out = [];
  for (let i = dateIdx + 1; i < lines.length; i++) {
    if (/^#{1,3}\s/.test(lines[i])) break;
    const m = lines[i].match(/^-\s+(.*)$/);
    if (m) {
      const descriptor = m[1].trim();
      if (descriptor && descriptor.toLowerCase() !== "contact created") out.push(descriptor);
    }
  }
  return out;
}

// src/seed.ts
var DIRECTIVES_HEADER = "%% MERIDIAN Dashboard \u2014 persistent directives. Managed automatically; edit these in the dashboard, not here. %%";
function seedTodos() {
  const specs = [
    { text: "Take meds", recurrence: { type: "daily" }, time: "09:00" },
    { text: "Log food", recurrence: { type: "daily" } },
    { text: "Do daily log", recurrence: { type: "daily" } },
    { text: "Refer to the day before's notes", recurrence: { type: "daily" } },
    { text: "Check the day's calendar", recurrence: { type: "daily" } },
    { text: "Ground School", recurrence: { type: "daily" } },
    { text: "Resolve course", recurrence: { type: "daily" } },
    { text: "Marketing course", recurrence: { type: "daily" } },
    { text: "Inkscape course", recurrence: { type: "daily" } }
  ];
  return specs.map((s, idx) => ({
    id: cryptoId(),
    text: s.text,
    recurrence: s.recurrence,
    createdAt: Date.now(),
    order: idx,
    scheduledTime: s.time,
    completions: [],
    skips: []
  }));
}

// src/view.ts
var import_obsidian27 = require("obsidian");

// src/companion.ts
function meridianCompanion(bridge) {
  return {
    spiralEntriesForDate: (date) => bridge.spiralEntriesForDate(date),
    nourishmentEntriesForDate: async (date) => (await bridge.arfidToday(date)).length,
    // Recipe Manager companion (drives the meals panel).
    recipesAvailable: () => bridge.recipesAvailable(),
    plannedMeals: (date) => bridge.plannedMeals(date),
    groceryList: () => bridge.groceryList(),
    toggleGroceryItem: (line) => bridge.toggleGroceryItem(line)
  };
}

// src/view.ts
var VIEW_TYPE_MERIDIAN = "meridian-dashboard";
var MeridianView = class extends import_obsidian27.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.mounted = [];
  }
  getViewType() {
    return VIEW_TYPE_MERIDIAN;
  }
  getDisplayText() {
    return "MERIDIAN Dashboard";
  }
  getIcon() {
    return "radar";
  }
  ctx() {
    return {
      app: this.app,
      plugin: this.plugin,
      bridge: this.plugin.bridge,
      todos: this.plugin.todos,
      streak: this.plugin.streak,
      companion: meridianCompanion(this.plugin.bridge),
      copy: MERIDIAN_COPY,
      runtime: this.plugin.runtime,
      settings: () => this.plugin.settings,
      requestRefresh: (reason = "manual") => void this.refreshPanels(reason),
      markFoodFocus: () => {
        this.plugin.markFoodFocus();
        void this.refreshPanels("manual");
      }
    };
  }
  async onOpen() {
    this.plugin.touchAccess();
    void this.plugin.updateStreak();
    await this.build();
  }
  /** Re-mount all panels — used when the panel set or order changes in
   * settings (a plain refresh keeps the old mount order). */
  async rebuild() {
    await this.build();
  }
  async onClose() {
    this.teardown();
    this.contentEl.empty();
  }
  teardown() {
    var _a, _b;
    for (const m of this.mounted) {
      try {
        (_b = (_a = m.panel).unmount) == null ? void 0 : _b.call(_a);
      } catch (e) {
      }
    }
    this.mounted = [];
  }
  async build() {
    this.teardown();
    const root = this.contentEl;
    root.empty();
    root.addClass("mrd-root");
    this.renderChrome(root);
    this.grid = root.createDiv({ cls: "mrd-grid" });
    const s = this.plugin.settings;
    const panels = createPanels(s.panelOrder, s.enabledPanels);
    const ctx = this.ctx();
    const layout = computeLayout(s.panelOrder, s.enabledPanels, s.panelColumns, s.panelSpans);
    const placeById = new Map(layout.placements.map((p) => [p.id, p]));
    if (layout.configured) {
      this.grid.addClass("mrd-grid-cols");
      this.grid.style.setProperty("--mrd-cols", String(layout.columns));
    }
    for (const panel of panels) {
      const host = this.grid.createDiv({ cls: "mrd-panel" });
      host.dataset.panel = panel.id;
      if (layout.configured) {
        const p = placeById.get(panel.id);
        if (p) host.style.gridColumn = `${p.column} / span ${p.span}`;
      }
      this.mounted.push({ panel, host });
      await this.mountPanel(panel, host, ctx);
    }
  }
  renderChrome(root) {
    const header = root.createDiv({ cls: "mrd-topbar" });
    const brand = header.createDiv({ cls: "mrd-brand" });
    brand.appendChild(radarMark());
    const label = brand.createDiv({ cls: "mrd-brand-text" });
    label.createDiv({ cls: "mrd-brand-name", text: "MERIDIAN" });
    label.createDiv({ cls: "mrd-brand-sub", text: "HALCYON SYSTEMS \xB7 STABILITY THROUGH OBSERVATION" });
    const refresh = header.createEl("button", { cls: "mrd-icon-btn", attr: { "aria-label": "Refresh" } });
    (0, import_obsidian27.setIcon)(refresh, "refresh-cw");
    refresh.addEventListener("click", () => void this.refreshPanels("manual"));
  }
  async mountPanel(panel, host, ctx) {
    host.empty();
    const body = host.createDiv({ cls: "mrd-panel-body" });
    try {
      await panel.mount(body, ctx);
    } catch (e) {
      this.renderErrorCard(host, panel, e);
    }
  }
  /** Calm, in-voice failure card — never glitch aesthetics, never a stack
   * trace in the Operator's face (that goes to the console). (§4) */
  renderErrorCard(host, panel, err) {
    console.error(`MERIDIAN Dashboard: panel "${panel.id}" failed`, err);
    host.empty();
    host.addClass("mrd-panel-error");
    const card = host.createDiv({ cls: "mrd-error-card" });
    const head = card.createDiv({ cls: "mrd-placard mrd-placard-muted" });
    head.createSpan({ cls: "mrd-placard-title", text: `${panel.title.toUpperCase()} \u2014 SUBSYSTEM UNAVAILABLE` });
    card.createDiv({
      cls: "mrd-error-note",
      text: "This subsystem could not be brought online. The condition has been logged. The rest of the facility is unaffected."
    });
  }
  /** Force-rotate the mounted MERIDIAN panel, if present. Returns true if it
   * was mounted and rotated (§1.1 `new-meridian-line`). */
  rotateMeridian() {
    let rotated = false;
    for (const m of this.mounted) {
      if (m.panel instanceof MeridianPanel) {
        void m.panel.rotate();
        rotated = true;
      }
    }
    return rotated;
  }
  async refreshPanels(reason) {
    var _a, _b;
    for (const m of this.mounted) {
      try {
        await ((_b = (_a = m.panel).refresh) == null ? void 0 : _b.call(_a, reason));
      } catch (e) {
        this.renderErrorCard(m.host, m.panel, e);
      }
    }
  }
};
function radarMark() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("class", "mrd-radar-mark");
  svg.setAttribute("width", "28");
  svg.setAttribute("height", "28");
  const frame = document.createElementNS(ns, "rect");
  frame.setAttribute("x", "1.5");
  frame.setAttribute("y", "1.5");
  frame.setAttribute("width", "29");
  frame.setAttribute("height", "29");
  frame.setAttribute("rx", "7");
  frame.setAttribute("class", "mrd-radar-frame");
  svg.appendChild(frame);
  for (const r of [4, 8, 12]) {
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", "16");
    c.setAttribute("cy", "16");
    c.setAttribute("r", String(r));
    c.setAttribute("class", "mrd-radar-ring");
    svg.appendChild(c);
  }
  const dot = document.createElementNS(ns, "circle");
  dot.setAttribute("cx", "22");
  dot.setAttribute("cy", "11");
  dot.setAttribute("r", "2.2");
  dot.setAttribute("class", "mrd-radar-dot");
  svg.appendChild(dot);
  return svg;
}

// src/main.ts
var MeridianDashPlugin = class extends import_obsidian28.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.runtime = {
      sessionStart: Date.now(),
      previousAccess: Date.now(),
      recentLines: [],
      foodFocusUntil: 0,
      typingUntil: 0,
      streakRecordDate: ""
    };
    this.refreshTimer = null;
    this.midnightTimer = null;
  }
  async onload() {
    this.registerView(VIEW_TYPE_MERIDIAN, (leaf) => new MeridianView(leaf, this));
    this.bridge = new Bridge(this.app);
    this.secondBrain = new LibraryStore(this.app, () => ({
      root: this.settings.secondBrainPath,
      categoriesSubfolder: this.settings.secondBrainCategoriesSubfolder,
      archiveSubfolder: this.settings.secondBrainArchiveSubfolder,
      listHeading: this.settings.secondBrainListHeading
    }));
    this.knowledgeBase = new LibraryStore(this.app, () => ({
      root: this.settings.kbRootPath,
      notesSubfolder: this.settings.kbNotesSubfolder,
      categoriesSubfolder: this.settings.kbCategoriesSubfolder,
      archiveSubfolder: this.settings.kbArchiveSubfolder,
      listHeading: this.settings.kbListHeading
    }));
    this.directives = new DirectivesStore(this.app, () => this.settings.directivesPath, {
      header: DIRECTIVES_HEADER,
      defaultPath: "MERIDIAN/Directives.md"
    });
    this.todos = new TodoStore(
      this.app,
      () => this.directives.getItems(),
      (items) => this.directives.setItems(items),
      () => this.directives.save(),
      () => ({
        marker: this.settings.completedTasksMarker,
        heading: this.settings.completedTasksHeading
      })
    );
    await this.load_();
    this.addRibbonIcon("radar", "Open MERIDIAN dashboard", () => void this.openDashboard());
    this.addCommand({
      id: "open-dashboard",
      name: "Open dashboard",
      callback: () => void this.openDashboard()
    });
    this.registerCommands();
    this.registerProtocol();
    this.addSettingTab(new MeridianSettingTab(this.app, this));
    this.registerEvent(this.app.metadataCache.on("changed", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("modify", (file) => this.onVaultChange(file.path)));
    this.registerEvent(this.app.vault.on("create", (file) => this.onVaultChange(file.path)));
    this.registerEvent(this.app.vault.on("delete", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("rename", () => this.scheduleRefresh()));
    this.app.workspace.onLayoutReady(() => {
      void this.loadDirectives().then(() => {
        void this.updateStreak();
        this.refreshOpenViews("vault");
      });
      this.scheduleMidnight();
      this.registerEvent(
        this.app.workspace.on("active-leaf-change", (leaf) => this.maybeReplaceEmptyLeaf(leaf))
      );
      if (this.settings.replaceNewTab) this.replaceActiveEmptyLeaf();
      if (this.settings.openOnStartup) void this.openDashboard(false);
    });
  }
  /** If enabled, swap an empty New Tab leaf for the dashboard. */
  maybeReplaceEmptyLeaf(leaf) {
    var _a;
    if (!this.settings.replaceNewTab || !leaf) return;
    if (((_a = leaf.view) == null ? void 0 : _a.getViewType()) === "empty") {
      void leaf.setViewState({ type: VIEW_TYPE_MERIDIAN });
    }
  }
  /** Replace the currently-active leaf if it's an empty New Tab. */
  replaceActiveEmptyLeaf() {
    var _a;
    this.maybeReplaceEmptyLeaf((_a = this.app.workspace.activeLeaf) != null ? _a : null);
  }
  onunload() {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    if (this.midnightTimer !== null) window.clearTimeout(this.midnightTimer);
  }
  // ----------------------------------------------- commands + URI (§1.1)
  /** Everything the dashboard does, reachable from the command palette / a
   * mobile shortcut / a keybind — each works whether or not a leaf is open. */
  registerCommands() {
    this.addCommand({
      id: "complete-next-directive",
      name: "Complete next directive",
      callback: () => void this.completeNextDirective()
    });
    this.addCommand({
      id: "add-directive",
      name: "Add a directive",
      callback: () => new TodoEditModal(this.app, this.todos, void 0, () => this.refreshOpenViews("vault"), MERIDIAN_TODO_COPY).open()
    });
    const logCommands = [
      { id: "log-primary", field: "primary" },
      { id: "log-supplemental", field: "supplemental" },
      { id: "log-musing", field: "musing" },
      { id: "reconsider-tomorrow", field: "reconsider" }
    ];
    for (const { id, field } of logCommands) {
      this.addCommand({
        id,
        name: this.commandNameForField(field),
        callback: () => this.promptLog(field)
      });
    }
    this.addCommand({
      id: "new-meridian-line",
      name: "New MERIDIAN line",
      callback: () => this.newMeridianLine()
    });
    this.addCommand({
      id: "line-history",
      name: "MERIDIAN line history",
      callback: () => new LineHistoryModal(this.app, this).open()
    });
    this.addCommand({
      id: "add-event",
      name: "Add an event",
      callback: () => new LocalEventModal(this.app, meridianLocalEvents(this), void 0, () => this.refreshOpenViews("vault")).open()
    });
    this.addCommand({
      id: "weekly-review",
      name: "Weekly review",
      callback: () => new WeekReviewModal(this.app, this).open()
    });
    this.addCommand({
      id: "weekly-goals",
      name: "Set weekly goals",
      callback: () => new WeeklyGoalsModal(this.app, this, currentWeekKey(), () => this.refreshOpenViews("vault")).open()
    });
    this.addCommand({
      id: "refresh",
      name: "Refresh dashboard",
      callback: () => this.refreshOpenViews("manual")
    });
  }
  commandNameForField(field) {
    switch (field) {
      case "primary":
        return "Log to Daily log \u2014 Primary";
      case "supplemental":
        return "Log to Daily log \u2014 Supplemental";
      case "musing":
        return "Log a musing";
      case "reconsider":
        return "Log to Reconsider tomorrow";
    }
  }
  registerProtocol() {
    this.registerObsidianProtocolHandler("meridian-dash", (params) => void this.handleUri(params));
  }
  /** Complete the top pending, non-skipped instance for today — the same code
   * path as tapping it, so it archives under `# Completed tasks`. */
  async completeNextDirective() {
    const inst = this.todos.firstPending();
    if (!inst) {
      new import_obsidian28.Notice("Nothing pending. The queue is already clear.");
      return;
    }
    await this.todos.toggleComplete(inst.item.id);
    this.refreshOpenViews("vault");
    new import_obsidian28.Notice(`Directive completed: ${inst.item.text}. The record is updated.`);
  }
  promptLog(field) {
    new PromptModal(
      this.app,
      { title: LOG_FIELD_LABELS[field], placeholder: "What to record", cta: "Log", multiline: true },
      (text) => void this.logToField(field, text)
    ).open();
  }
  /** Append `text` to a daily-note field, refresh, confirm in voice. */
  async logToField(field, text) {
    try {
      const wrote = await appendToDailyField(this.app, LOG_FIELD_SPECS[field], text);
      if (wrote) {
        this.refreshOpenViews("vault");
        new import_obsidian28.Notice(`Recorded to ${LOG_FIELD_LABELS[field]}. The record is updated.`);
      } else {
        new import_obsidian28.Notice(`The ${LOG_FIELD_LABELS[field]} section is not present in today's note. Nothing was written.`);
      }
    } catch (e) {
      console.error("MERIDIAN: log-to-field failed", e);
      new import_obsidian28.Notice("The record could not be written. The condition has been logged.");
    }
  }
  newMeridianLine() {
    let rotated = false;
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MERIDIAN)) {
      const view = leaf.view;
      if (view instanceof MeridianView && view.rotateMeridian()) rotated = true;
    }
    if (!rotated) new import_obsidian28.Notice(anyCanonLine());
  }
  /** URI action surface (§1.1). Headless with `text`; falls back to the modal
   * without it. Every write goes through the same daily-note writer / store. */
  async handleUri(params) {
    var _a, _b, _c, _d, _e, _f, _g;
    const action = ((_a = params.action) != null ? _a : "").toLowerCase();
    switch (action) {
      case "":
      case "open":
        await this.openDashboard();
        return;
      case "complete-next":
        await this.completeNextDirective();
        return;
      case "add-directive": {
        const text = ((_b = params.text) != null ? _b : "").trim();
        if (text) {
          await this.todos.add({ text });
          this.refreshOpenViews("vault");
          new import_obsidian28.Notice(`Directive filed: ${text}.`);
        } else {
          new TodoEditModal(this.app, this.todos, void 0, () => this.refreshOpenViews("vault"), MERIDIAN_TODO_COPY).open();
        }
        return;
      }
      case "log": {
        const field = ((_c = params.field) != null ? _c : "").toLowerCase();
        if (!isLogField(field)) {
          new import_obsidian28.Notice("That field is not on record. Nothing was written.");
          return;
        }
        const text = ((_d = params.text) != null ? _d : "").trim();
        if (text) await this.logToField(field, text);
        else this.promptLog(field);
        return;
      }
      case "add-event": {
        const summary = ((_f = (_e = params.summary) != null ? _e : params.text) != null ? _f : "").trim();
        if (summary) {
          const date = /^\d{4}-\d{2}-\d{2}$/.test((_g = params.date) != null ? _g : "") ? params.date : (0, import_obsidian28.moment)().format("YYYY-MM-DD");
          const start = params.start || void 0;
          await this.addLocalEvent({ summary, date, start, end: start && params.end ? params.end : void 0 });
          new import_obsidian28.Notice(`Event filed: ${summary}.`);
        } else {
          new LocalEventModal(this.app, meridianLocalEvents(this), void 0, () => this.refreshOpenViews("vault")).open();
        }
        return;
      }
      default:
        new import_obsidian28.Notice("That instruction is not recognised. Nothing was done.");
    }
  }
  // ------------------------------------------------------------- data
  async load_() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const raw = await this.loadData();
    this.settings = mergeSettings(raw == null ? void 0 : raw.settings);
    if (/\.json$/i.test(this.settings.directivesPath)) {
      this.settings.directivesPath = this.settings.directivesPath.replace(/\.json$/i, ".md");
    }
    this.data = {
      settings: this.settings,
      // Legacy home of the to-do list; kept only for one-time migration to the
      // vault-backed directives file (see loadDirectives).
      todos: (_a = raw == null ? void 0 : raw.todos) != null ? _a : [],
      lastAccess: (_b = raw == null ? void 0 : raw.lastAccess) != null ? _b : Date.now(),
      seeded: (_c = raw == null ? void 0 : raw.seeded) != null ? _c : false,
      agendaCache: (_d = raw == null ? void 0 : raw.agendaCache) != null ? _d : {},
      milestoneShownDate: (_e = raw == null ? void 0 : raw.milestoneShownDate) != null ? _e : "",
      // New in 1.9.0/1.10.0 — every field optional with a safe default so a
      // pre-1.7.0 data.json loads without throwing (§ cross-cutting migration).
      localEvents: (_f = raw == null ? void 0 : raw.localEvents) != null ? _f : [],
      streak: (_g = raw == null ? void 0 : raw.streak) != null ? _g : { ...DEFAULT_STREAK },
      lineHistory: (_h = raw == null ? void 0 : raw.lineHistory) != null ? _h : [],
      weeklyGoals: (_i = raw == null ? void 0 : raw.weeklyGoals) != null ? _i : {}
    };
    this.runtime.previousAccess = this.data.lastAccess;
    await this.saveData_();
  }
  /** Load directives from the vault file, migrating from the old plugin-data
   * location (or the seed defaults) the first time. */
  async loadDirectives() {
    var _a;
    const existed = await this.directives.load();
    if (existed) {
      this.data.seeded = true;
      return;
    }
    const fromJson = await this.directives.loadLegacyJson();
    if (!fromJson) {
      const legacy = (_a = this.data.todos) != null ? _a : [];
      this.directives.setItems(legacy.length > 0 || this.data.seeded ? legacy : seedTodos());
    }
    this.data.seeded = true;
    this.data.todos = [];
    await this.directives.save();
    await this.saveData_();
  }
  /** Vault create/modify router: reload directives when their file changes on
   * another device (Obsidian Sync), otherwise a plain debounced refresh. */
  onVaultChange(path) {
    if (this.directives.isDirectivesPath(path)) {
      void this.directives.onExternalChange(path).then((changed) => {
        if (changed) this.refreshOpenViews("vault");
      });
      return;
    }
    this.scheduleRefresh();
  }
  async saveData_() {
    this.data.settings = this.settings;
    await this.saveData(this.data);
  }
  // Accessors panels use for the persisted, non-settings blobs.
  get agendaCache() {
    return this.data.agendaCache;
  }
  get milestoneShownDate() {
    return this.data.milestoneShownDate;
  }
  set milestoneShownDate(date) {
    this.data.milestoneShownDate = date;
  }
  get streak() {
    return this.data.streak;
  }
  get lineHistory() {
    return this.data.lineHistory;
  }
  /** Record a committed MERIDIAN line into the persisted history (§3.2). FIFO,
   * capped at 100. Read-only afterward — this only logs the closed pool's output. */
  recordLine(line) {
    const hist = this.data.lineHistory;
    if (hist.length && hist[hist.length - 1].line === line) return;
    hist.push({ line, at: Date.now() });
    while (hist.length > 100) hist.shift();
    void this.saveData_();
  }
  // ------------------------------------------------------- local events (§2.1)
  get localEvents() {
    return this.data.localEvents;
  }
  async addLocalEvent(ev) {
    this.data.localEvents.push({ id: localId(), ...ev });
    await this.saveData_();
    this.refreshOpenViews("vault");
  }
  async updateLocalEvent(id, patch) {
    const ev = this.data.localEvents.find((e) => e.id === id);
    if (!ev) return;
    Object.assign(ev, patch);
    await this.saveData_();
    this.refreshOpenViews("vault");
  }
  async removeLocalEvent(id) {
    this.data.localEvents = this.data.localEvents.filter((e) => e.id !== id);
    await this.saveData_();
    this.refreshOpenViews("vault");
  }
  // ------------------------------------------------------- weekly goals
  /** Goals for the week starting `weekKey` (YYYY-MM-DD). */
  weeklyGoalsFor(weekKey) {
    var _a;
    return (_a = this.data.weeklyGoals[weekKey]) != null ? _a : [];
  }
  async addWeeklyGoal(weekKey, text) {
    var _a;
    const trimmed = text.trim();
    if (!trimmed) return;
    const list = (_a = this.data.weeklyGoals[weekKey]) != null ? _a : this.data.weeklyGoals[weekKey] = [];
    list.push({ id: localId(), text: trimmed });
    await this.saveData_();
  }
  async removeWeeklyGoal(weekKey, id) {
    const list = this.data.weeklyGoals[weekKey];
    if (!list) return;
    this.data.weeklyGoals[weekKey] = list.filter((g) => g.id !== id);
    if (this.data.weeklyGoals[weekKey].length === 0) delete this.data.weeklyGoals[weekKey];
    await this.saveData_();
  }
  // ------------------------------------------------------------- streak (§2.2)
  /** Whether a day "counts": its note exists and holds a completed task, a
   * journal write, or any marker-log line. Existence alone is too weak — the
   * template auto-creates empty notes. */
  async dayCounts(date) {
    if (!getDailyNoteFile(this.app, date)) return false;
    const raw = await readDailyNoteRaw(this.app, date);
    const completed = readField(raw, headingField(this.settings.completedTasksHeading));
    if (completed.split("\n").some((l) => /^\s*-\s+\S/.test(l))) return true;
    for (const field of LOG_FIELDS) {
      const body = readField(raw, LOG_FIELD_SPECS[field]);
      if (body.split("\n").some((l) => l.trim() && !/^\s*-\s*(\[[ xX]?\]\s*)?$/.test(l))) return true;
    }
    for (const marker of ["%% arfid-log %%", "%% spiral-log %%", "%% crm-log %%"]) {
      if (readMarkerLogLines(raw, marker).length > 0) return true;
    }
    return false;
  }
  /** Recompute the streak by scanning the daily notes backward from today, so
   * the count is correct no matter when this runs (self-healing). Idempotent
   * per day once today is locked in; a broken streak is silent. Records a
   * new-record day in runtime as a milestone trigger. */
  async updateStreak() {
    const today2 = (0, import_obsidian28.moment)().format("YYYY-MM-DD");
    if (this.data.streak.lastDayCounted === today2) return;
    const counts = [];
    for (let i = 0; i < 366; i++) {
      const c = await this.dayCounts((0, import_obsidian28.moment)().subtract(i, "day").format("YYYY-MM-DD"));
      counts.push(c);
      if (!c && i >= 1) break;
    }
    const todayCounts = counts[0];
    const current = currentStreakFromDays(counts);
    const prevLongest = this.data.streak.longest;
    const longest = Math.max(prevLongest, current);
    const next = {
      current,
      longest,
      lastDayCounted: todayCounts ? today2 : this.data.streak.lastDayCounted
    };
    const changed = next.current !== this.data.streak.current || next.longest !== this.data.streak.longest || next.lastDayCounted !== this.data.streak.lastDayCounted;
    this.data.streak = next;
    if (todayCounts && current > prevLongest) this.runtime.streakRecordDate = today2;
    if (changed) {
      await this.saveData_();
      this.refreshOpenViews("vault");
    }
  }
  /** Reschedule a one-shot timer to just after the next local midnight; on fire
   * it recomputes the streak (day rollover) and re-arms. */
  scheduleMidnight() {
    if (this.midnightTimer !== null) window.clearTimeout(this.midnightTimer);
    const msToMidnight = (0, import_obsidian28.moment)().endOf("day").valueOf() - Date.now() + 2e3;
    this.midnightTimer = window.setTimeout(() => {
      this.midnightTimer = null;
      void this.updateStreak();
      this.refreshOpenViews("vault");
      this.scheduleMidnight();
    }, Math.max(1e3, msToMidnight));
  }
  /** Record this view-open as the latest access, returning the prior value. */
  touchAccess() {
    const prior = this.data.lastAccess;
    this.data.lastAccess = Date.now();
    this.runtime.previousAccess = prior;
    this.runtime.sessionStart = Date.now();
    void this.saveData_();
    return prior;
  }
  markFoodFocus() {
    this.runtime.foodFocusUntil = Date.now() + 4 * 60 * 1e3;
  }
  // ------------------------------------------------------------- view
  async openDashboard(reveal = true) {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_MERIDIAN);
    let leaf;
    if (existing.length > 0) {
      leaf = existing[0];
    } else {
      leaf = reveal ? this.app.workspace.getLeaf(true) : this.app.workspace.getLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE_MERIDIAN, active: reveal });
    }
    if (reveal) this.app.workspace.revealLeaf(leaf);
  }
  refreshOpenViews(reason = "manual") {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MERIDIAN)) {
      const view = leaf.view;
      if (view instanceof MeridianView) void view.refreshPanels(reason);
    }
  }
  /** Re-mount panels in every open view — for panel enable/reorder changes. */
  rebuildOpenViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MERIDIAN)) {
      const view = leaf.view;
      if (view instanceof MeridianView) void view.rebuild();
    }
  }
  scheduleRefresh() {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      if (Date.now() < this.runtime.typingUntil) {
        this.scheduleRefresh();
        return;
      }
      this.refreshOpenViews("vault");
      void this.updateStreak();
    }, 300);
  }
};
function localId() {
  const c = globalThis.crypto;
  if (c == null ? void 0 : c.randomUUID) return c.randomUUID();
  return "le-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
