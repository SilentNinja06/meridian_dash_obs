// Test entry: importing each suite registers its cases, then report() runs them.
// The pure-logic suites (subitems, directives, agenda, streak, layout) live in
// dash_core_obs with their modules; this host currently has no host-specific
// suites of its own. Host-only tests, when added, are imported here.
import "./appskin";
import { report } from "./_harness";

report();
