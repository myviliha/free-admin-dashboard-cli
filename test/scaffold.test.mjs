/**
 * Turning our repository into their project.
 *
 * Driven against a fixture tree rather than a real download, so the assertions are about the rules
 * and not about GitHub being up. The end-to-end test next door does the real thing.
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import { findEdition } from "../lib/editions.mjs";
import { allowBuilds, ignoredBuilds, packageName, postProcess, STRIP } from "../lib/scaffold.mjs";

const temps = [];
after(() => temps.forEach((d) => rmSync(d, { recursive: true, force: true })));

/** A tree shaped like a freshly unpacked edition, carrying everything that has to be stripped. */
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "vui-scaffold-"));
  temps.push(dir);
  mkdirSync(join(dir, ".github", "workflows"), { recursive: true });
  mkdirSync(join(dir, "public"), { recursive: true });
  writeFileSync(join(dir, ".github", "workflows", "deploy.yml"), "on: push\n");
  writeFileSync(join(dir, ".github", "FUNDING.yml"), "github: [myviliha]\n");
  writeFileSync(join(dir, "public", "CNAME"), "react.viliha.com\n");
  writeFileSync(join(dir, "public", ".nojekyll"), "");
  writeFileSync(join(dir, "CNAME"), "html.viliha.com\n");
  writeFileSync(join(dir, "package-lock.json"), "{}\n");
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: "free-react", version: "0.0.0", private: true, description: "ours" }),
  );
  return dir;
}

const react = findEdition("react");

describe("postProcess", () => {
  it("removes everything that is ours and not theirs", () => {
    const dir = fixture();
    postProcess(dir, react, { name: "my-app", pm: "pnpm" });

    for (const rel of STRIP) {
      assert.equal(existsSync(join(dir, rel)), false, `${rel} survived`);
    }
  });

  it("removes the CNAME the HTML edition keeps at the repository root", () => {
    // This one sits next to real content rather than under public/, which is exactly where a
    // copy-everything scaffolder ships someone our domain without noticing.
    const dir = fixture();
    postProcess(dir, findEdition("html"), { name: "my-app", pm: "pnpm" });
    assert.equal(existsSync(join(dir, "CNAME")), false);
  });

  it("renames the package after the folder", () => {
    const dir = fixture();
    postProcess(dir, react, { name: "my-app", pm: "pnpm" });
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    assert.equal(pkg.name, "my-app");
    assert.equal(pkg.version, "0.1.0");
  });

  it("leaves the package private", () => {
    // An accidental `npm publish` of somebody's internal dashboard is not a mistake worth leaving
    // available to them.
    const dir = fixture();
    postProcess(dir, react, { name: "my-app", pm: "pnpm" });
    assert.equal(JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).private, true);
  });

  it("keeps package-lock.json for npm and drops it for everyone else", () => {
    for (const [pm, kept] of [
      ["npm", true],
      ["pnpm", false],
      ["yarn", false],
      ["bun", false],
    ]) {
      const dir = fixture();
      postProcess(dir, react, { name: "my-app", pm });
      assert.equal(existsSync(join(dir, "package-lock.json")), kept, `package-lock.json under ${pm}`);
    }
  });

  it("writes a README about their project rather than ours", () => {
    const dir = fixture();
    postProcess(dir, react, { name: "my-app", pm: "pnpm" });
    const text = readFileSync(join(dir, "README.md"), "utf8");
    assert.match(text, /^# my-app/);
    assert.match(text, /docs\.viliha\.com/);
  });

  it("creates Laravel's .env, which no git tree can carry", () => {
    const dir = fixture();
    writeFileSync(join(dir, ".env.example"), "APP_KEY=\n");
    postProcess(dir, findEdition("laravel"), { name: "my-app", pm: "pnpm" });
    assert.equal(readFileSync(join(dir, ".env"), "utf8"), "APP_KEY=\n");
  });

  it("does not invent a .env for the other editions", () => {
    const dir = fixture();
    writeFileSync(join(dir, ".env.example"), "VITE_SITE_URL=\n");
    postProcess(dir, react, { name: "my-app", pm: "pnpm" });
    assert.equal(existsSync(join(dir, ".env")), false);
  });

  it("copes with an edition that has none of the strip-list files", () => {
    const dir = mkdtempSync(join(tmpdir(), "vui-bare-"));
    temps.push(dir);
    assert.doesNotThrow(() => postProcess(dir, react, { name: "bare", pm: "pnpm" }));
  });
});

describe("packageName", () => {
  it("makes a folder name into one npm will take", () => {
    assert.equal(packageName("My App"), "my-app");
    assert.equal(packageName("my_app"), "my_app");
    assert.equal(packageName("Admin Dashboard 2026"), "admin-dashboard-2026");
    assert.equal(packageName(".hidden"), "hidden");
    assert.equal(packageName("-lead-and-trail-"), "lead-and-trail");
  });

  it("falls back rather than producing an empty name", () => {
    assert.equal(packageName("---"), "admin-dashboard");
    assert.equal(packageName(""), "admin-dashboard");
  });
});

describe("pnpm build approval", () => {
  it("reads the package names out of pnpm's complaint", () => {
    const stderr = "[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: sharp@0.34.5\n";
    assert.deepEqual(ignoredBuilds(stderr), ["sharp"]);
  });

  it("keeps the scope on a scoped package", () => {
    // `@parcel/watcher@2.6.0` has two @ signs and only the last one starts the version. Stripping
    // from the first would approve a package called `` and leave the real one blocked.
    const stderr =
      "Ignored build scripts: @parcel/watcher@2.6.0, esbuild@0.28.1, lmdb@3.4.2, msgpackr-extract@3.0.4";
    assert.deepEqual(ignoredBuilds(stderr), [
      "@parcel/watcher",
      "esbuild",
      "lmdb",
      "msgpackr-extract",
    ]);
  });

  it("finds nothing in an unrelated failure", () => {
    // The retry must not fire for a network error or a version conflict: re-running an install that
    // failed for a different reason just fails again, more slowly.
    assert.deepEqual(ignoredBuilds("ERR_PNPM_NO_MATCHING_VERSION  No matching version found"), []);
    assert.deepEqual(ignoredBuilds(""), []);
  });

  it("writes both spellings, so pnpm 10 and 11 both read it", () => {
    const dir = fixture();
    allowBuilds(dir, ["sharp", "@parcel/watcher"]);
    const yaml = readFileSync(join(dir, "pnpm-workspace.yaml"), "utf8");
    assert.match(yaml, /onlyBuiltDependencies:\n {2}- "sharp"\n {2}- "@parcel\/watcher"/);
    assert.match(yaml, /allowBuilds:\n {2}"sharp": true\n {2}"@parcel\/watcher": true/);
  });

  it("quotes scoped names, which YAML will not take bare", () => {
    // The first version of this wrote `- @parcel/watcher`. `@` opens a reserved indicator in YAML,
    // so pnpm rejected the file with "bad indentation of a sequence entry" and the retry failed
    // having looked like it worked. The test above passed throughout, because it asserted the
    // format this function produced rather than the format YAML accepts.
    const dir = fixture();
    allowBuilds(dir, ["@parcel/watcher"]);
    for (const line of readFileSync(join(dir, "pnpm-workspace.yaml"), "utf8").split("\n")) {
      if (line.includes("@")) assert.match(line, /"@parcel\/watcher"/, `unquoted: ${line}`);
    }
  });
});
