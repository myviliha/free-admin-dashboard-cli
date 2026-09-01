/**
 * Fetch an edition and turn it into somebody else's project.
 *
 * The download is a GitHub tarball rather than a clone, for three reasons: it needs no git and no
 * SSH key, it carries only tracked files (so `node_modules/`, `dist/`, `out/` and `vendor/`, which
 * are 200-600MB of the working trees, cannot come along), and it leaves the user without our git
 * history, which is ours and not theirs.
 *
 * What arrives is still *our repository*, though, and the difference between a repository and a
 * project is the point of `postProcess`.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { demoUrl, repoUrl, tarballUrl } from "./editions.mjs";

/**
 * Ours, not theirs. Removed from every scaffold.
 *
 * `.github` holds `workflows/deploy.yml`, which publishes to *our* GitHub Pages environment, and
 * `FUNDING.yml`, which puts a Sponsor button for *our* org on *their* repository. `CNAME` claims one
 * of our subdomains; the HTML edition keeps it at the repo root rather than under `public/`, next to
 * real content, which is exactly where a copy-everything scaffolder ships someone our domain.
 *
 * Listed as a union of all six editions and deleted if present, rather than per-edition: one list
 * cannot drift out of step with itself.
 */
export const STRIP = [".github", "CNAME", "public/CNAME", "public/.nojekyll"];

/** Turn a folder name into something npm will accept as a package name. */
export function packageName(folder) {
  const cleaned = folder
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+|[-._]+$/g, "");
  return cleaned || "admin-dashboard";
}

/** Download the pinned tarball and unpack it into `dir`, which must already exist. */
export async function download(edition, dir) {
  const url = tarballUrl(edition);
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`could not download ${edition.name} (${res.status} from ${url})`);
  }

  // `--strip-components=1` drops the `<repo>-<sha>/` wrapper GitHub puts around every tarball.
  const tar = spawn("tar", ["-xz", "--strip-components=1", "-C", dir], {
    stdio: ["pipe", "inherit", "pipe"],
  });

  let stderr = "";
  tar.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  const finished = new Promise((resolve, reject) => {
    tar.on("error", (err) =>
      reject(
        err.code === "ENOENT"
          ? new Error("`tar` was not found on PATH. Install it, or clone the repository instead.")
          : err,
      ),
    );
    tar.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`tar exited ${code}\n${stderr.trim()}`)),
    );
  });

  await pipeline(Readable.fromWeb(res.body), tar.stdin);
  await finished;
}

/**
 * A short README for the new project.
 *
 * The upstream one is a landing page for the template: badges pointing at our CI, our sponsor
 * section, our screenshots. Left in place it describes a project the reader does not have.
 */
function readme(edition, name) {
  return `# ${name}

Built on [VuiAdmin](https://viliha.com) ${edition.name} free, a free MIT licensed admin dashboard
template: nineteen finished screens on one design system.

- Documentation: https://docs.viliha.com
- This edition's source: ${repoUrl(edition)}
- Live demo: ${demoUrl(edition)}

## Licence

The template is MIT licensed, so this project is yours to do as you like with. If it saved you a
fortnight, [sponsoring](https://github.com/sponsors/myviliha) is the best thank-you.
`;
}

/**
 * Everything between "the tarball landed" and "this is your project".
 *
 * Pure filesystem work on a directory, so the tests drive it against a fixture tree rather than
 * hitting the network.
 *
 * @returns {string[]} what it removed or rewrote, for the caller to report.
 */
export function postProcess(dir, edition, { name, pm }) {
  const done = [];

  for (const rel of STRIP) {
    const path = join(dir, rel);
    if (!existsSync(path)) continue;
    rmSync(path, { recursive: true, force: true });
    done.push(`removed ${rel}`);
  }

  // A `package-lock.json` is npm's. Under pnpm, yarn or bun it is never read, never updated, and
  // still looks authoritative to the next person who opens the repository.
  if (pm !== "npm") {
    const lock = join(dir, "package-lock.json");
    if (existsSync(lock)) {
      rmSync(lock);
      done.push(`removed package-lock.json (not needed by ${pm})`);
    }
  }

  const manifest = join(dir, "package.json");
  if (existsSync(manifest)) {
    const pkg = JSON.parse(readFileSync(manifest, "utf8"));
    pkg.name = packageName(name);
    pkg.version = "0.1.0";
    // `private` stays true: this is an application, and an accidental `npm publish` of somebody's
    // admin dashboard is not a mistake worth leaving available.
    delete pkg.description;
    writeFileSync(manifest, `${JSON.stringify(pkg, null, 2)}\n`);
    done.push(`set package.json name to ${pkg.name}`);
  }

  writeFileSync(join(dir, "README.md"), readme(edition, name));
  done.push("wrote README.md");

  // Laravel reads `.env` at boot and there is no `.env` in a git tree. Composer's
  // `post-create-project-cmd` would normally make one, but that hook only fires for
  // `composer create-project`, which is not how this arrived.
  const envExample = join(dir, ".env.example");
  const env = join(dir, ".env");
  if (edition.slug === "laravel" && existsSync(envExample) && !existsSync(env)) {
    copyFileSync(envExample, env);
    done.push("created .env from .env.example");
  }

  return done;
}

/**
 * The dependency names out of pnpm's "Ignored build scripts" complaint.
 *
 * pnpm 10 stopped running dependencies' install scripts unless they are named, which is a good
 * default and a hard stop for a scaffolder: `pnpm install` exits non-zero on four of these six
 * editions, having actually installed everything, because `sharp`, `esbuild`, `lmdb` and friends
 * want to build. Reading the names back out of the error is what makes the fix self-correcting.
 * A hardcoded list here would go stale the next time a template gains a native dependency.
 *
 *   Ignored build scripts: @parcel/watcher@2.6.0, esbuild@0.28.1
 *     -> ["@parcel/watcher", "esbuild"]
 */
export function ignoredBuilds(stderr = "") {
  const line = stderr.match(/Ignored build scripts:\s*(.+)/);
  if (!line) return [];
  return line[1]
    .split(",")
    .map((entry) => entry.trim().replace(/@[^@/]*$/, ""))
    .filter(Boolean);
}

/**
 * Approve those builds, in the file pnpm reads.
 *
 * Both keys are written on purpose: pnpm 10 calls this `onlyBuiltDependencies` and pnpm 11 calls it
 * `allowBuilds`, and a scaffolded project should install under whichever the user has. Verified
 * against pnpm 11.24, where only the second key takes effect. The first is inert there rather than
 * an error, which is what makes writing both safe.
 */
export function allowBuilds(dir, names) {
  const yaml = [
    "# Approved dependency build scripts. pnpm does not run these unless they are named, and these",
    "# are the ones this project's dependencies need. `onlyBuiltDependencies` is pnpm 10's spelling",
    "# and `allowBuilds` is pnpm 11's; both are here so the project installs under either.",
    "onlyBuiltDependencies:",
    // Quoted, always. `@` opens a reserved indicator in YAML, so a scoped name like
    // `@parcel/watcher` is a parse error unquoted, and pnpm then rejects the file it was just
    // handed. Quoting every name rather than only the scoped ones keeps one code path.
    ...names.map((n) => `  - "${n}"`),
    "allowBuilds:",
    ...names.map((n) => `  "${n}": true`),
    "",
  ].join("\n");
  writeFileSync(join(dir, "pnpm-workspace.yaml"), yaml);
}

/**
 * Install, and deal with pnpm's build approval if it comes up.
 *
 * Both streams are teed rather than inherited: the output still appears live, because an install
 * that prints nothing for thirty seconds looks hung, and it is also kept so the caller can read it.
 * pnpm writes the ignored-builds notice to **stdout**, not stderr, so capturing only stderr sees an
 * empty string and never retries. That cost an hour, and it is why this reads both.
 *
 * @returns {Promise<{ok: boolean, approved: string[], output: string}>}
 */
export function installDeps(dir, pm, command) {
  const run = () =>
    new Promise((resolve) => {
      const child = spawn(command[0], command.slice(1), {
        cwd: dir,
        stdio: ["inherit", "pipe", "pipe"],
      });
      let output = "";
      for (const [stream, sink] of [
        [child.stdout, process.stdout],
        [child.stderr, process.stderr],
      ]) {
        stream.on("data", (chunk) => {
          output += chunk;
          sink.write(chunk);
        });
      }
      child.on("error", (err) => resolve({ status: 1, output: err.message }));
      child.on("close", (status) => resolve({ status, output }));
    });

  return (async () => {
    let result = await run();
    if (result.status === 0) return { ok: true, approved: [], output: "" };

    const pending = pm === "pnpm" ? ignoredBuilds(result.output) : [];
    if (!pending.length) return { ok: false, approved: [], output: result.output };

    allowBuilds(dir, pending);
    result = await run();
    return { ok: result.status === 0, approved: pending, output: result.output };
  })();
}
