# Free Admin Dashboard Template: React, Next.js, Vue, Angular, HTML and Laravel

**One command. A finished admin dashboard. No account, no key, no trial.**

[![npm](https://img.shields.io/npm/v/@viliha/free-admin-dashboard?color=266df0&label=npm)](https://www.npmjs.com/package/@viliha/free-admin-dashboard)
[![downloads](https://img.shields.io/npm/dm/@viliha/free-admin-dashboard?color=266df0)](https://www.npmjs.com/package/@viliha/free-admin-dashboard)
[![docs](https://img.shields.io/badge/docs-docs.viliha.com-266df0)](https://docs.viliha.com)
[![license](https://img.shields.io/badge/license-MIT-266df0)](./LICENSE)
[![Sponsor @myviliha](https://img.shields.io/badge/Sponsor-%40myviliha-db61a2?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/myviliha)

```bash
npx @viliha/free-admin-dashboard my-app --reactjs
```

That gives you VuiAdmin: nineteen finished screens on one design system, MIT licensed, in the
framework you already use. It is the professional, enterprise grade SaaS theme people normally pay
for, and it costs nothing.

Clone it and you have skipped the two or three weeks a dashboard shell, a data table, a chart set
and an auth flow usually cost.

---

## Sponsoring is what keeps this free

VuiAdmin is the kind of theme that usually gets sold. Keeping six editions of nineteen screens in
step, in good shape, and current with each framework's releases is ongoing work, and it is paid for
by people who decide it was worth something.

If this saved you a fortnight, a sponsorship is the best thank you there is. **Even $1 a month
helps.**

### [Sponsor on GitHub](https://github.com/sponsors/myviliha) &nbsp;·&nbsp; thank you

---

## What it looks like

![Free React admin dashboard template showing the ecommerce dashboard: customer and order metrics, a monthly sales bar chart, a monthly target gauge and a statistics area chart](https://raw.githubusercontent.com/myviliha/free-reactjs-admin-dashboard/main/docs/screenshots/dashboard.png)

![Admin dashboard data table with sortable rows, avatars, status badges and row actions](https://raw.githubusercontent.com/myviliha/free-reactjs-admin-dashboard/main/docs/screenshots/tables.png)

| Form elements | Calendar |
| --- | --- |
| [![Every input type in the free admin template: text, select, multi-select, date, time, radio, checkbox, switch, file upload and password](https://raw.githubusercontent.com/myviliha/free-reactjs-admin-dashboard/main/docs/screenshots/forms.png)](https://docs.viliha.com) | [![Calendar screen with add, edit and delete events](https://raw.githubusercontent.com/myviliha/free-reactjs-admin-dashboard/main/docs/screenshots/calendar.png)](https://docs.viliha.com) |

| Six layouts | Authentication |
| --- | --- |
| [![Six sidebar and shell arrangements you can switch between at runtime](https://raw.githubusercontent.com/myviliha/free-reactjs-admin-dashboard/main/docs/screenshots/layouts.png)](https://docs.viliha.com) | [![Split screen sign in page with a brand panel](https://raw.githubusercontent.com/myviliha/free-reactjs-admin-dashboard/main/docs/screenshots/signin.png)](https://docs.viliha.com) |

Every screen ships in light and dark, and the theme switch is a class on `<html>` rather than a
reload.

---

## Pick your stack

React is the default, so `npx @viliha/free-admin-dashboard` on its own gives you the React app.

```bash
npx @viliha/free-admin-dashboard my-app --reactjs
npx @viliha/free-admin-dashboard my-app --nextjs
npx @viliha/free-admin-dashboard my-app --vuejs
npx @viliha/free-admin-dashboard my-app --angularjs
npx @viliha/free-admin-dashboard my-app --html
npx @viliha/free-admin-dashboard my-app --laravel
```

| Edition | Flag | Stack | Live demo |
| --- | --- | --- | --- |
| React | `--reactjs` | React 19, Vite 8, TypeScript | [react.viliha.com](https://react.viliha.com) |
| Next.js | `--nextjs` | Next.js 16 App Router, React 19 | [nextjs.viliha.com](https://nextjs.viliha.com) |
| Vue | `--vuejs` | Vue 3.5 script setup, Vite 8 | [vuejs.viliha.com](https://vuejs.viliha.com) |
| Angular | `--angularjs` | Angular 20 standalone, Vite 8 | [angularjs.viliha.com](https://angularjs.viliha.com) |
| HTML | `--html` | HTML5, one stylesheet, no build | [html.viliha.com](https://html.viliha.com) |
| Laravel | `--laravel` | Laravel 12, PHP 8.2+, Blade | [laravel.viliha.com](https://laravel.viliha.com) |

Same nineteen screens, same design tokens, same fixtures. Click through any demo before you install
a thing.

---

## Run it with your package manager

pnpm is the default. Pass a flag for anything else, or use the `create` form and the CLI follows
whichever tool you launched it with.

```bash
npx @viliha/free-admin-dashboard my-app --vuejs --pnpm    # default
npx @viliha/free-admin-dashboard my-app --vuejs --npm
npx @viliha/free-admin-dashboard my-app --vuejs --yarn
npx @viliha/free-admin-dashboard my-app --vuejs --bun
```

```bash
npm  create @viliha/free-admin-dashboard my-app -- --nextjs
yarn create @viliha/free-admin-dashboard my-app --nextjs
pnpm create @viliha/free-admin-dashboard my-app --nextjs
bunx  @viliha/free-admin-dashboard my-app --nextjs
```

Then:

```bash
cd my-app
pnpm dev
```

Open http://localhost:3000.

---

## Options

| Option | What it does |
| --- | --- |
| `-y`, `--yes` | Take every default and ask nothing. Good for scripts and CI. |
| `--force` | Scaffold into a directory that already has files in it. |
| `--no-install` | Fetch the project, skip installing dependencies. |
| `--dry-run` | Print what would happen and touch nothing. |
| `-h`, `--help` | The usage text. |
| `-v`, `--version` | The version. |

With no arguments at all it asks for a folder name and an edition, with React preselected. In a
pipe or in CI, where nobody can answer, it takes the defaults instead of hanging.

---

## What you get

Nineteen screens, not a component gallery:

Dashboard, calendar, user profile, form elements, basic tables, blank page, line chart, bar chart,
alerts, avatars, badges, buttons, images, videos, modals, layouts, sign in, sign up and a 404.

- **64 component families** on one set of design tokens
- **Light and dark**, switched by a class rather than a rebuild
- **Six shell layouts** you can change at runtime
- **Charts, tables, a calendar and an auth flow** already wired to fixtures
- **TypeScript** in the four framework editions
- **MIT licensed**, permanently, with no attribution requirement

### What the CLI does to the template

The project you get is yours, not a copy of our repository. It arrives without our git history, our
GitHub Pages workflow, our `FUNDING.yml` and our `CNAME`, with `package.json` renamed after your
folder and a README about your project rather than ours.

Each edition is pinned to an exact commit, so two people running the same version of this CLI get
the same project, and a change to a template repository can never break scaffolding.

---

## Questions people ask

**Is it really free for commercial work?**
Yes. MIT licensed, so you can use it in commercial and client projects, modify it, and ship it
closed source. No attribution required.

**Do I need an account or a licence key?**
No. There is nothing to sign up for and nothing to activate.

**What is the difference between the free and Pro versions?**
This free edition has nineteen screens and 64 component families, and it is complete and
production ready as it stands. [VILIHA](https://viliha.com) sells larger templates with more
screens, more component families and commercial support.

**Which edition should I pick?**
The one matching the framework you already use. They are the same screens and the same design
system, so nothing is missing from any of them.

**Can I use it with npm instead of pnpm?**
Yes. Pass `--npm`, or run it through `npm create`, and the CLI installs with npm and keeps the npm
lockfile.

**Does it work offline?**
No. It downloads the edition you asked for from GitHub, which is what keeps this package small
rather than shipping all six.

**How do I deploy it?**
The four framework editions build to static files, so any static host works, GitHub Pages and
Netlify included. The Laravel edition can be exported to static pages or served by PHP.

---

## Documentation

Full documentation, installation guides for all six editions, theming, and the component reference:

### [docs.viliha.com](https://docs.viliha.com)

---

## Source

| Edition | Repository |
| --- | --- |
| React | [free-reactjs-admin-dashboard](https://github.com/myviliha/free-reactjs-admin-dashboard) |
| Next.js | [free-nextjs-admin-dashboard](https://github.com/myviliha/free-nextjs-admin-dashboard) |
| Vue | [free-vuejs-admin-dashboard](https://github.com/myviliha/free-vuejs-admin-dashboard) |
| Angular | [free-angularjs-admin-dashboard](https://github.com/myviliha/free-angularjs-admin-dashboard) |
| HTML | [free-html-admin-dashboard](https://github.com/myviliha/free-html-admin-dashboard) |
| Laravel | [free-laravel-admin-dashboard](https://github.com/myviliha/free-laravel-admin-dashboard) |
| This CLI | [free-admin-dashboard-cli](https://github.com/myviliha/free-admin-dashboard-cli) |

Found a bug or want an edition that is not here?
[Open an issue](https://github.com/myviliha/free-admin-dashboard-cli/issues).

---

## Licence

MIT, for the CLI and for every edition it installs. Copyright VILIHA PTE. LTD.

Looking for more screens, more components and commercial support?
**[Upgrade to Pro at viliha.com](https://viliha.com)**
