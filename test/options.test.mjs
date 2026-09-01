/**
 * What the flags mean.
 *
 * Table-driven, because the interesting failures here are the combinations: an alias that stops
 * agreeing with its slug, a package-manager precedence that quietly inverts, a typo that scaffolds
 * React instead of failing. None of those need a network or a filesystem to catch.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_EDITION } from "../lib/editions.mjs";
import { DEFAULT_PM, defaultPM, detectPM, parseArgs } from "../lib/options.mjs";

describe("editions", () => {
  it("takes the js-suffixed alias and the plain slug as the same thing", () => {
    for (const [alias, slug] of [
      ["--reactjs", "react"],
      ["--nextjs", "next"],
      ["--vuejs", "vue"],
      ["--angularjs", "angular"],
    ]) {
      assert.equal(parseArgs([alias]).edition.slug, slug, alias);
      assert.equal(parseArgs([`--${slug}`]).edition.slug, slug, slug);
    }
  });

  it("leaves the edition unset when none is named, so the caller can prompt", () => {
    assert.equal(parseArgs([]).edition, null);
    assert.equal(DEFAULT_EDITION, "react");
  });

  it("rejects an unknown flag rather than falling back to the default", () => {
    // The failure this prevents: `--reactj` silently scaffolding React, or worse, `--svelte`
    // scaffolding React and the user believing Svelte is what they got.
    const { errors } = parseArgs(["--svelte"]);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /unknown option: --svelte/);
  });

  it("refuses two different editions at once", () => {
    assert.match(parseArgs(["--react", "--vue"]).errors[0], /two editions/);
  });

  it("accepts the same edition twice", () => {
    assert.deepEqual(parseArgs(["--react", "--reactjs"]).errors, []);
  });
});

describe("package manager", () => {
  it("defaults to pnpm when nothing says otherwise", () => {
    // `null`, not `undefined`: a default parameter only fires for `undefined`, so passing that
    // would read the real `npm_config_user_agent` and this test would report whichever manager
    // happened to run it. Under `npm test` that is npm, and the assertion would pass for pnpm
    // only by accident of how the suite was invoked.
    assert.equal(parseArgs([], null).pm, "pnpm");
    assert.equal(DEFAULT_PM, "pnpm");
  });

  it("reads an unambiguous launcher, so `bunx` installs with bun", () => {
    assert.equal(detectPM("yarn/1.22.19 npm/? node/v20.11.0 darwin arm64"), "yarn");
    assert.equal(detectPM("bun/1.1.0 npm/? node/v22.0.0 darwin arm64"), "bun");
    assert.equal(detectPM("pnpm/9.1.0 npm/? node/v20.11.0 darwin arm64"), "pnpm");
  });

  it("ignores npm's user agent, because npx sets it too", () => {
    // This is the whole point of the default. `npx @viliha/free-admin-dashboard` and
    // `npm create @viliha/free-admin-dashboard` are indistinguishable here, both reporting
    // `npm/...`, and npx is how nearly everyone runs this. Honouring it made pnpm the documented
    // default and npm the real one, which was caught only by running the published package.
    assert.equal(detectPM("npm/10.2.4 node/v20.11.0 darwin arm64"), null);
    assert.equal(parseArgs([], "npm/10.2.4 node/v20.11.0 darwin arm64").pm, "pnpm");
  });

  it("still takes --npm from someone who wants npm", () => {
    assert.equal(parseArgs(["--npm"], "npm/10.2.4 node/v20.11.0").pm, "npm");
  });

  it("falls back to npm when pnpm is not installed", () => {
    // Defaulting to a tool the user does not have would turn a working scaffold into a failed
    // install at the very last step, after everything had already been downloaded.
    assert.equal(defaultPM(() => false), "npm");
    assert.equal(defaultPM(() => true), "pnpm");
  });

  it("does not mistake pnpm for npm", () => {
    // pnpm's user agent names npm too. A substring test reports npm for every pnpm run, and the
    // scaffold then keeps a package-lock.json that pnpm will never read.
    assert.equal(detectPM("pnpm/9.1.0 npm/? node/v20.11.0 darwin arm64"), "pnpm");
  });

  it("prefers an explicit flag over the user agent", () => {
    assert.equal(parseArgs(["--bun"], "npm/10.2.4 node/v20.11.0").pm, "bun");
  });

  it("falls back to pnpm for a user agent it does not recognise", () => {
    assert.equal(parseArgs([], "deno/1.40.0").pm, "pnpm");
  });
});

describe("options", () => {
  it("takes the first bare argument as the folder", () => {
    const opts = parseArgs(["my-app", "--vuejs"]);
    assert.equal(opts.folder, "my-app");
    assert.equal(opts.edition.slug, "vue");
  });

  it("complains about a second bare argument instead of ignoring it", () => {
    assert.match(parseArgs(["a", "b"]).errors[0], /unexpected argument: b/);
  });

  it("carries the switches", () => {
    const opts = parseArgs(["-y", "--force", "--no-install", "--dry-run"]);
    assert.equal(opts.yes, true);
    assert.equal(opts.force, true);
    assert.equal(opts.install, false);
    assert.equal(opts.dry, true);
  });

  it("installs by default", () => {
    assert.equal(parseArgs([]).install, true);
  });
});
