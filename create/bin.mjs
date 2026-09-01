#!/usr/bin/env node
/**
 * `npm create @viliha/free-admin-dashboard`.
 *
 * That form only resolves a package whose name carries the `create-` prefix, so this exists purely
 * to own the name. The CLI itself is next door and is imported rather than reimplemented, which is
 * why this file is three lines: two packages with one behaviour, not two behaviours that have to be
 * kept in step.
 *
 * `bin/cli.mjs` runs its work at import time, so importing it *is* running it. Nothing to call.
 */
import "@viliha/free-admin-dashboard/bin/cli.mjs";
