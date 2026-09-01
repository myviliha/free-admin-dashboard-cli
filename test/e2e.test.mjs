/**
 * The real thing: download all six editions and check what lands on disk.
 *
 * Off unless `VUI_E2E=1`, because a suite that needs GitHub to be up is a suite that goes red for
 * reasons that are nobody's fault. The unit tests cover the rules; this covers the assumption
 * underneath them: that a codeload tarball, stripped of one path component, is the project.
 *
 *   VUI_E2E=1 npm test
 */
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import { EDITIONS } from "../lib/editions.mjs";
import { download, postProcess, STRIP } from "../lib/scaffold.mjs";

const temps = [];
after(() => temps.forEach((d) => rmSync(d, { recursive: true, force: true })));

describe("scaffolding for real", { skip: process.env.VUI_E2E !== "1" }, () => {
  for (const edition of EDITIONS) {
    it(`${edition.slug} arrives as a project`, async () => {
      const dir = mkdtempSync(join(tmpdir(), `vui-e2e-${edition.slug}-`));
      temps.push(dir);

      await download(edition, dir);

      // `--strip-components=1` should have removed the `<repo>-<sha>/` wrapper. If it did not,
      // everything below still passes vacuously while the user gets a project one level too deep.
      assert.ok(existsSync(join(dir, "README.md")), "no README at the top level");
      assert.ok(readdirSync(dir).length > 5, "suspiciously few files");

      // Only tracked files are in a git tarball, so none of this should ever arrive.
      for (const junk of ["node_modules", "dist", "out", ".next", "vendor", ".git"]) {
        assert.equal(existsSync(join(dir, junk)), false, `${junk} came along`);
      }

      postProcess(dir, edition, { name: "e2e-app", pm: "pnpm" });

      for (const rel of STRIP) {
        assert.equal(existsSync(join(dir, rel)), false, `${rel} survived`);
      }

      if (existsSync(join(dir, "package.json"))) {
        assert.equal(JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).name, "e2e-app");
      }

      // The vendored design-system packages are `file:` dependencies. Without them the install
      // resolves nothing and the app cannot build.
      if (edition.install) {
        assert.ok(existsSync(join(dir, "packages")), "vendored packages/ missing");
      }

      if (edition.slug === "laravel") assert.ok(existsSync(join(dir, ".env")));
      if (edition.slug === "angular") {
        // npm refuses the tree without this. It is a tracked file, so it should have come along.
        assert.ok(existsSync(join(dir, ".npmrc")), ".npmrc missing, npm install will fail");
      }
    });
  }
});
