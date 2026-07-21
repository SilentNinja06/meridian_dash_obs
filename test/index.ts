// Test entry: importing each suite registers its cases, then report() runs them.
// The pure-logic suites (subitems, directives, agenda, streak) moved to
// dash_core_obs with their modules; this host runs only its host-specific tests.
import "./layout.test";
import { report } from "./_harness";

report();
