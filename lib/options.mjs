/**
 * Argument parsing and package-manager choice.
 *
 * Split out of `bin/cli.mjs` for one reason: it is the part with rules worth testing, and a test
 * should not have to spawn a process and scaffold a project to find out what `--reactjs -y` means.
 *
 * Parsed by hand rather than with a library, matching `@viliha/vui-react`'s CLI, which has no
 * runtime dependencies either. A scaffolder people run through `npx` should be a fast download.
 */
import { editionFlags, findEdition } from "./editions.mjs";

/** Install and run commands, keyed the way each tool actually spells them. */
export const MANAGERS = {
  pnpm: { install: ["pnpm", "install"], run: (s) => `pnpm ${s}` },
  npm: { install: ["npm", "install"], run: (s) => `npm run ${s}` },
  // `yarn add` is for adding packages; bare `yarn` installs the manifest.
  yarn: { install: ["yarn"], run: (s) => `yarn ${s}` },
  bun: { install: ["bun", "install"], run: (s) => `bun run ${s}` },
};

export const DEFAULT_PM = "pnpm";

/**
 * Which package manager launched us.
 *
 * npm, pnpm, yarn and bun all set `npm_config_user_agent`, so `npm create ...` can install with npm
 * and `bunx` with bun without anyone passing a flag. Order matters: pnpm's user agent mentions npm
 * as well, so a naive `includes("npm")` reports npm for every pnpm run.
 */
export function detectPM(userAgent = process.env.npm_config_user_agent) {
  if (!userAgent) return null;
  for (const pm of ["bun", "pnpm", "yarn", "npm"]) {
    if (userAgent.startsWith(`${pm}/`)) return pm;
  }
  return null;
}

/**
 * @param {string[]} argv  process.argv.slice(2)
 * @param {string} [userAgent]  overridable so the tests are not at the mercy of their own runner.
 */
export function parseArgs(argv, userAgent = process.env.npm_config_user_agent) {
  const opts = {
    folder: null,
    edition: null,
    pm: null,
    yes: false,
    force: false,
    install: true,
    dry: false,
    help: false,
    version: false,
    errors: [],
  };

  for (const arg of argv) {
    if (!arg.startsWith("-")) {
      if (opts.folder === null) opts.folder = arg;
      else opts.errors.push(`unexpected argument: ${arg}`);
      continue;
    }

    const flag = arg.replace(/^--?/, "");
    const edition = findEdition(flag);

    if (edition) {
      if (opts.edition && opts.edition.slug !== edition.slug) {
        opts.errors.push(`two editions requested: --${opts.edition.slug} and ${arg}`);
      }
      opts.edition = edition;
    } else if (flag in MANAGERS) {
      opts.pm = flag;
    } else if (flag === "yes" || flag === "y") {
      opts.yes = true;
    } else if (flag === "force") {
      opts.force = true;
    } else if (flag === "no-install") {
      opts.install = false;
    } else if (flag === "dry-run") {
      opts.dry = true;
    } else if (flag === "help" || flag === "h") {
      opts.help = true;
    } else if (flag === "version" || flag === "v") {
      opts.version = true;
    } else {
      opts.errors.push(`unknown option: ${arg}`);
    }
  }

  // An explicit flag wins, then whatever launched us, then pnpm.
  opts.pm = opts.pm ?? detectPM(userAgent) ?? DEFAULT_PM;
  return opts;
}

export function usage() {
  const editions = editionFlags()
    .map((f) => `--${f}`)
    .join(" ");
  return `
  Scaffold a free VuiAdmin admin dashboard.

    npx @viliha/free-admin-dashboard [folder] [edition] [options]

  Editions (React is the default):
    ${editions}

  Package managers (pnpm is the default):
    --pnpm  --npm  --yarn  --bun

  Options:
    -y, --yes       take every default, ask nothing
        --force     scaffold into a directory that is not empty
        --no-install  skip installing dependencies
        --dry-run   say what would happen, touch nothing
    -h, --help      this text
    -v, --version   print the version

  Examples:
    npx @viliha/free-admin-dashboard
    npx @viliha/free-admin-dashboard my-app --reactjs
    npx @viliha/free-admin-dashboard my-app --vuejs --npm
`;
}
