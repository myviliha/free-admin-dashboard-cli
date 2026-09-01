/**
 * The manifest is the only thing in this package that can be wrong without any code being wrong.
 *
 * A pin that is not a full SHA, two editions claiming the same flag, or a slug that exists here and
 * not on the docs site: each one ships a CLI that runs perfectly and scaffolds the wrong thing.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { DEFAULT_EDITION, EDITIONS, editionFlags, findEdition, tarballUrl } from "../lib/editions.mjs";

describe("the pinned manifest", () => {
  it("has the six editions", () => {
    assert.equal(EDITIONS.length, 6);
    assert.deepEqual(
      EDITIONS.map((e) => e.slug),
      ["react", "next", "vue", "angular", "html", "laravel"],
    );
  });

  it("pins every edition to a full commit SHA", () => {
    // A branch name would work here and would be wrong: scaffolding would then change under people
    // without the CLI version changing, and a bad commit on any template repo would break it.
    for (const e of EDITIONS) {
      assert.match(e.ref, /^[0-9a-f]{40}$/, `${e.slug} is not pinned to a full SHA`);
    }
  });

  it("gives every edition its own repository", () => {
    const repos = new Set(EDITIONS.map((e) => e.repo));
    assert.equal(repos.size, EDITIONS.length);
  });

  it("has no flag that selects two editions", () => {
    const flags = editionFlags();
    assert.equal(new Set(flags).size, flags.length, `duplicate flag in ${flags.join(" ")}`);
  });

  it("has a default that exists", () => {
    assert.ok(findEdition(DEFAULT_EDITION));
    assert.equal(DEFAULT_EDITION, "react");
  });

  it("builds a codeload URL carrying the pin", () => {
    const react = findEdition("react");
    assert.equal(
      tarballUrl(react),
      `https://codeload.github.com/myviliha/free-reactjs-admin-dashboard/tar.gz/${react.ref}`,
    );
  });

  it("says which editions have dependencies to install", () => {
    // HTML has no build step and Laravel's dependencies are Composer's. Running an installer in
    // either is a slow no-op that ends in a lockfile for an empty tree.
    assert.deepEqual(
      EDITIONS.filter((e) => e.install).map((e) => e.slug),
      ["react", "next", "vue", "angular"],
    );
  });

  it("matches the docs site's edition list", () => {
    // Both files name the same six repositories, and a seventh edition has to land in both or the
    // docs will document something the CLI cannot scaffold. Skipped when the docs repo is not a
    // sibling, so a standalone clone of this package still has a green suite.
    const docs = fileURLToPath(new URL("../../free-docs/lib/editions.ts", import.meta.url));
    if (!existsSync(docs)) return;
    const source = readFileSync(docs, "utf8");
    for (const e of EDITIONS) {
      assert.ok(source.includes(`"${e.repo}"`), `${e.repo} is missing from free-docs/lib/editions.ts`);
    }
  });
});

describe("the create- shim", () => {
  const read = (rel) =>
    JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8"));

  it("depends on the exact version of the CLI it ships beside", () => {
    // The shim is a name, not an implementation: it imports the real CLI. A range here, or a
    // version left behind during a release, publishes a `create-` package that scaffolds from
    // whatever older CLI npm decides to resolve.
    const cli = read("../package.json");
    const shim = read("../create/package.json");
    assert.equal(shim.dependencies["@viliha/free-admin-dashboard"], cli.version);
    assert.equal(shim.version, cli.version);
  });

  it("imports a subpath the CLI actually exports", () => {
    const cli = read("../package.json");
    const shim = readFileSync(fileURLToPath(new URL("../create/bin.mjs", import.meta.url)), "utf8");
    const subpath = shim.match(/@viliha\/free-admin-dashboard(\/[^"']+)/)?.[1];
    assert.ok(subpath, "the shim does not import the CLI");
    assert.ok(cli.exports?.[`.${subpath}`], `${subpath} is not in the CLI's exports map`);
  });
});
