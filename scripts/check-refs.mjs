#!/usr/bin/env node
/**
 * Are the pins still current?
 *
 * Pinning to a commit is what stops a bad push to a template repo from breaking scaffolding for
 * everyone. The cost is that the pins go stale silently: fixes land in the six repositories and new
 * projects keep getting the old code, and nothing anywhere says so.
 *
 * So this asks. It does not fail the build, because a pin being behind `main` is normal for most of a
 * release cycle, and a red CI that means "this is fine" teaches people to ignore red CI. It exits 0
 * with a report, and the scheduled workflow surfaces it.
 *
 *   node scripts/check-refs.mjs
 */
import { EDITIONS } from "../lib/editions.mjs";

const token = process.env.GITHUB_TOKEN;
const headers = {
  accept: "application/vnd.github+json",
  ...(token ? { authorization: `Bearer ${token}` } : {}),
};

let behind = 0;
let failed = 0;

for (const edition of EDITIONS) {
  const url = `https://api.github.com/repos/myviliha/${edition.repo}/commits/main`;
  let head;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    head = (await res.json()).sha;
  } catch (err) {
    // Rate limits and outages are not stale pins, and reporting them as such would be a lie.
    console.log(`  ${edition.slug.padEnd(8)} could not check (${err.message})`);
    failed += 1;
    continue;
  }

  if (head === edition.ref) {
    console.log(`  ${edition.slug.padEnd(8)} current  ${edition.ref.slice(0, 7)}`);
  } else {
    behind += 1;
    console.log(
      `  ${edition.slug.padEnd(8)} BEHIND   pinned ${edition.ref.slice(0, 7)}, main ${head.slice(0, 7)}`,
    );
    console.log(`           https://github.com/myviliha/${edition.repo}/compare/${edition.ref}...${head}`);
  }
}

console.log(
  behind
    ? `\n  ${behind} pin(s) behind main. Bump lib/editions.mjs and cut a patch release.`
    : `\n  All ${EDITIONS.length - failed} checked pin(s) are current.`,
);
