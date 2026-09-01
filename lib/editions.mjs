/**
 * The six editions, pinned.
 *
 * `ref` is a commit SHA rather than a branch. Scaffolding therefore cannot break because someone
 * pushed to a template repo, and two people running the same CLI version get byte-identical output.
 * The cost is that shipping a template fix to new projects means bumping a pin and cutting a patch
 * release, which `scripts/check-refs.mjs` exists to remind us about.
 *
 * Mirrors `free-docs/lib/editions.ts`. The slugs are deliberately the same strings, and a test
 * holds the two files to each other so a seventh edition cannot land in one and not the other.
 */

/**
 * @typedef {object} Edition
 * @property {string} slug        Canonical name, matching the docs site.
 * @property {string[]} aliases   Other flags that select it. `--reactjs` as well as `--react`.
 * @property {string} name        How it is written in prose.
 * @property {string} repo        Repository under github.com/myviliha.
 * @property {string} ref         Pinned commit SHA.
 * @property {string} stack       One line, for the picker.
 * @property {boolean} install    Whether it has dependencies worth installing.
 * @property {string} demo        Live demo host.
 */

/** @type {Edition[]} */
export const EDITIONS = [
  {
    slug: "react",
    aliases: ["reactjs"],
    name: "React",
    repo: "free-reactjs-admin-dashboard",
    ref: "851d150a05974c12f235d3b34b69b9541737ff2e",
    stack: "React 19, Vite 8, TypeScript",
    install: true,
    demo: "react.viliha.com",
  },
  {
    slug: "next",
    aliases: ["nextjs"],
    name: "Next.js",
    repo: "free-nextjs-admin-dashboard",
    ref: "162477d682f04a165eecfa81451236e15e76ccfe",
    stack: "Next.js 16, React 19, TypeScript",
    install: true,
    demo: "nextjs.viliha.com",
  },
  {
    slug: "vue",
    aliases: ["vuejs"],
    name: "Vue",
    repo: "free-vuejs-admin-dashboard",
    ref: "9807f14c4d8705eb1a7fe1947519ff2472b1a89e",
    stack: "Vue 3.5, Vite 8, TypeScript",
    install: true,
    demo: "vuejs.viliha.com",
  },
  {
    slug: "angular",
    aliases: ["angularjs"],
    name: "Angular",
    repo: "free-angularjs-admin-dashboard",
    ref: "d3358d034d2fc8933b508deb1042111e90e36728",
    stack: "Angular 20, Vite 8, TypeScript",
    install: true,
    demo: "angularjs.viliha.com",
  },
  {
    slug: "html",
    aliases: [],
    name: "HTML",
    repo: "free-html-admin-dashboard",
    ref: "7865913c8fa39e80b248d6c7fe74162554fb5345",
    stack: "HTML5, one stylesheet, no build step",
    // Nineteen files and a stylesheet. `npm install` would resolve an empty tree.
    install: false,
    demo: "html.viliha.com",
  },
  {
    slug: "laravel",
    aliases: [],
    name: "Laravel",
    repo: "free-laravel-admin-dashboard",
    ref: "3726576dd929f83ffeadcc6b0375288002a1edd3",
    stack: "Laravel 12, PHP 8.2+, Blade",
    // Its dependencies are Composer's, not npm's.
    install: false,
    demo: "laravel.viliha.com",
  },
];

/** The one you get when you name none: `npx @viliha/free-admin-dashboard`. */
export const DEFAULT_EDITION = "react";

/** Look up by slug or alias. Returns undefined for anything else. */
export function findEdition(name) {
  const wanted = String(name).toLowerCase();
  return EDITIONS.find((e) => e.slug === wanted || e.aliases.includes(wanted));
}

/** Every flag that selects an edition, for the usage text and for rejecting typos. */
export function editionFlags() {
  return EDITIONS.flatMap((e) => [e.slug, ...e.aliases]);
}

export const tarballUrl = (e) => `https://codeload.github.com/myviliha/${e.repo}/tar.gz/${e.ref}`;
export const repoUrl = (e) => `https://github.com/myviliha/${e.repo}`;
export const demoUrl = (e) => `https://${e.demo}`;
