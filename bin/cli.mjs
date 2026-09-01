#!/usr/bin/env node
/**
 * VuiAdmin's scaffolder.
 *
 *   npx @viliha/free-admin-dashboard my-app --reactjs
 *
 * Six framework editions of the same nineteen screens. Pick one, get a clean project, run it.
 *
 * Interactive when it can be and silent when it cannot: with no arguments on a terminal it asks for
 * a folder and an edition, and everywhere else (`--yes`, a pipe, CI) it takes the defaults instead
 * of hanging on a prompt nobody can answer. That rule is `@viliha/vui-react`'s and it is a good one.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { basename, resolve } from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { DEFAULT_EDITION, EDITIONS, findEdition, repoUrl } from "../lib/editions.mjs";
import { MANAGERS, parseArgs, usage } from "../lib/options.mjs";
import { download, installDeps, packageName, postProcess, STRIP } from "../lib/scaffold.mjs";

const opts = parseArgs(process.argv.slice(2));

if (opts.errors.length) {
  for (const e of opts.errors) console.error(`  ${e}`);
  console.error(usage());
  process.exit(1);
}
if (opts.help) {
  console.log(usage());
  process.exit(0);
}
if (opts.version) {
  const pkg = new URL("../package.json", import.meta.url);
  console.log(JSON.parse(readFileSync(fileURLToPath(pkg), "utf8")).version);
  process.exit(0);
}

/** Ask, unless nobody is there to answer. */
const interactive = stdin.isTTY && !opts.yes;
async function ask(question, fallback) {
  if (!interactive) return fallback;
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = (await rl.question(question)).trim();
  rl.close();
  return answer || fallback;
}

const DEFAULT_FOLDER = "my-admin-dashboard";

let folder = opts.folder;
if (!folder) folder = await ask(`  Project folder  (${DEFAULT_FOLDER}) `, DEFAULT_FOLDER);

let edition = opts.edition;
if (!edition) {
  if (interactive) {
    console.log("");
    EDITIONS.forEach((e, i) => {
      const mark = e.slug === DEFAULT_EDITION ? "*" : " ";
      console.log(`   ${mark} ${String(i + 1).padStart(2)}. ${e.name.padEnd(9)} ${e.stack}`);
    });
    const answer = await ask(`\n  Edition  (1) `, "1");
    // Accept the number or the name, because people type what they see.
    edition = /^\d+$/.test(answer) ? EDITIONS[Number(answer) - 1] : findEdition(answer);
    if (!edition) {
      console.error(`\n  Not an edition: ${answer}`);
      process.exit(1);
    }
  } else {
    edition = findEdition(DEFAULT_EDITION);
  }
}

const dir = resolve(process.cwd(), folder);
const name = basename(dir);

// Scaffolding over someone's work is not recoverable, so it needs saying yes to.
if (existsSync(dir) && readdirSync(dir).length && !opts.force) {
  console.error(`\n  ${folder} exists and is not empty. Use --force to scaffold into it anyway.`);
  process.exit(1);
}

const pm = MANAGERS[opts.pm];
const willInstall = edition.install && opts.install;

if (opts.dry) {
  console.log(`\n  Would scaffold ${edition.name} into ${dir}`);
  console.log(`    from       ${repoUrl(edition)} at ${edition.ref.slice(0, 7)}`);
  console.log(`    remove     ${STRIP.join(", ")}`);
  console.log(`    name       ${packageName(name)}`);
  console.log(`    install    ${willInstall ? pm.install.join(" ") : "no"}`);
  process.exit(0);
}

console.log(`\n  Scaffolding ${edition.name} into ${folder}`);

let created = false;
try {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    created = true;
  }

  await download(edition, dir);
  for (const line of postProcess(dir, edition, { name, pm: opts.pm })) {
    console.log(`    ${line}`);
  }
} catch (err) {
  // A half-unpacked directory is worse than no directory: it looks like a project and is not one.
  // Only clean up what we made, never a directory the user pointed us at with --force.
  if (created) rmSync(dir, { recursive: true, force: true });
  console.error(`\n  ${err.message}`);
  process.exit(1);
}

if (willInstall) {
  console.log(`\n  ${pm.install.join(" ")}\n`);
  const { ok, approved } = await installDeps(dir, opts.pm, pm.install);

  if (approved.length) {
    console.log(`\n    approved build scripts: ${approved.join(", ")}`);
    console.log("    (pnpm-workspace.yaml)");
  }

  if (!ok) {
    // The project is on disk and correct; only the install failed. Say so and let them retry,
    // rather than deleting the download and making them fetch it again.
    console.error(`\n  ${opts.pm} install failed. The project is ready at ${folder}, run it there.`);
    process.exit(1);
  }
}

console.log(`\n  Done. ${edition.name}, ${edition.stack}.\n`);
console.log(`    cd ${folder}`);
if (edition.slug === "laravel") {
  console.log("    composer install");
  console.log("    php artisan key:generate");
  console.log("    php artisan serve --port=3000");
} else {
  if (!willInstall) console.log(`    ${pm.install.join(" ")}`);
  console.log(`    ${pm.run("dev")}`);
}
console.log(`\n  Docs: https://docs.viliha.com\n`);
