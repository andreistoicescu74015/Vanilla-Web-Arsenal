# Vanilla Web Arsenal

A frontend toolkit in plain HTML, CSS and JavaScript, prepared ahead of a hackathon where frameworks and AI tools are not allowed. It covers layout, components, visual effects, page templates, small JavaScript helpers that replace common libraries, design tools, and a wiki written so the team can work without searching the internet.

Nothing needs installing or building. Open `index.html` in a browser and everything runs, including from disk with no internet connection.

## Before the event

Clone the code and the wiki, so both are available offline:

```sh
git clone https://github.com/andreistoicescu74015/Vanilla-Web-Arsenal.git
git clone https://github.com/andreistoicescu74015/Vanilla-Web-Arsenal.wiki.git
```

The wiki is a folder of Markdown files. Open it in VS Code and press `Ctrl+Shift+V` on a page to read it formatted, or `Ctrl+Shift+F` to search all pages at once. Start with `Home.md`, then `Hackathon-Playbook.md`.

## Starting a project

1. Copy `starter/` to a new folder next to `arsenal/`, for example `project/`.
2. Open `project/index.html` in a browser. With the VS Code Live Server extension, the page reloads on every save.
3. Pick a look in one attribute: `<html lang="en" data-preset="forest">` (or `indigo`, `editorial`, `candy`; leave it out for the default teal). For your own colors, set `--brand` and `--accent` in `project/css/style.css`, or generate the block with `tools/theme.html`.
4. Build the page from sections in `tools/page-builder.html` and components in `catalog/index.html`.

The starter links the arsenal with `../arsenal/`. When you publish, keep `arsenal/` next to your project folder, or copy it inside and change the paths to `arsenal/`.

## What is inside

```
index.html            start page with links to everything below
arsenal/
  css/arsenal.css     the one stylesheet to link; imports the files below in cascade layers
  css/tokens.css      colors, fonts, type scale, spacing, radii, shadows (light and dark), presets
  css/fonts.css       Space Grotesk, the heading font, embedded so it works offline (OFL license)
  css/reset.css       consistent defaults across browsers
  css/base.css        plain HTML elements styled without classes
  css/layout.css      stack, cluster, split, with-sidebar, auto-grid, cols-*, reel, cover, page shells
  css/components.css  buttons, cards, navbar, forms, modal, tabs, segmented control, stepper,
                      pagination, accordion, toast, table, prose ...
  css/charts.css      colors and layout of the SVG charts
  css/effects.css     gradients, glass, glowing borders, backgrounds, entrance and scroll animations
  css/utilities.css   one-property classes, named after the CSS-Tricks flexbox guide
  js/dom.js           $, $$, on (with delegation), h, html (escaped templates), render, formToObject
  js/utils.js         debounce, throttle, Intl formatting, localStorage helpers
  js/store.js         a small state store with subscribe and persistence
  js/router.js        a hash router with :params and query strings
  js/http.js          fetch with JSON, timeouts and errors for 4xx/5xx
  js/mock-api.js      a fake backend in localStorage for demos without a server
  js/sample-data.js   realistic demo data and offline placeholder images
  js/charts.js        bar, line and donut charts in SVG, with the numbers in a table for screen readers
  js/icons.js         79 inline SVG icons: <i data-icon="check"></i>
  js/ui.js            behavior for theme toggle, navbar, dialogs, tabs, dropdowns, forms, toasts, reveal
catalog/              every component and layout, live, with copyable code
templates/            landing, dashboard, single-page app, sign in, article, collection and shop,
                      multi-step form, pitch slides
starter/              the empty project to copy
tools/                page builder, flexbox and grid playgrounds, contrast, clamp() and theme tools
assets/               styles and scripts for this repo's own pages (not needed in projects)
```

## How the CSS fits together

`arsenal.css` puts each file in a cascade layer, in this order: reset, tokens, base, layout, components, effects, utilities. A later layer wins over an earlier one, so a utility class beats a component style. CSS written outside any layer, such as `css/style.css` in the starter, wins over all of them. You never need `!important` to override the arsenal.

Design values live in custom properties. Change `--brand` and `--accent` and every button, link, badge and chart follows; a preset changes the colors, the corner radii and the heading font at once. Dark mode comes from `light-dark()` in `tokens.css` and follows the operating system until someone presses the theme toggle.

Use the brand gradient once per page, on the hero headline or the main button. Everything else uses solid colors, which is what keeps the gradient noticeable.

## How the JavaScript fits together

Every file is a classic script that adds functions to one global object, `VWA`. ES modules would fail when a page opens from disk (`file://`), which is why the arsenal does not use them. Load the files with `defer`, `dom.js` first and `ui.js` last:

```html
<script defer src="arsenal/js/dom.js"></script>
<script defer src="arsenal/js/utils.js"></script>
<script defer src="arsenal/js/icons.js"></script>
<script defer src="arsenal/js/ui.js"></script>
<script defer src="js/main.js"></script>
```

One rule: classes are looks, `data-*` attributes are behavior. `class="tabs"` styles tabs and `data-tabs` makes them work; the same goes for `data-nav-toggle`, `data-dropdown`, `data-dialog-open`, `data-validate`, `data-reveal`, `data-marquee` and `data-theme-toggle`. Most components need no JavaScript of your own, and markup you render later gets the same behavior automatically. `templates/app.js` shows a complete app built from the store, the router and the mock API.

## Browser support

The arsenal targets current Chrome, Edge, Firefox and Safari. Every feature it depends on is Baseline (supported in all four) as of October 2026, checked against web-features 3.44.0. Two features are progressive enhancements that only some browsers show, with nothing breaking in the others: the smooth accordion animation (`interpolate-size`) and `text-wrap: pretty`.

## Wiki

The [wiki](https://github.com/andreistoicescu74015/Vanilla-Web-Arsenal/wiki) explains the concepts behind the code, for beginners and for people who already know some JavaScript: HTML semantics, CSS fundamentals, flexbox, grid, responsive design, UI and UX principles, accessibility, JavaScript, a troubleshooting guide, cheat sheets, and a reference for every class and helper in the arsenal.

## Credits

Icon shapes come from [Feather Icons](https://feathericons.com) (MIT License, Copyright (c) 2013-2017 Cole Bemis). The heading font is [Space Grotesk](https://github.com/floriankarsten/space-grotesk) (SIL Open Font License 1.1, Copyright 2020 The Space Grotesk Project Authors); the license is in `arsenal/css/SpaceGrotesk-OFL.txt`. The layout primitives follow ideas from [Every Layout](https://every-layout.dev). The flexbox and grid material follows the CSS-Tricks guides to [flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) and [grid](https://css-tricks.com/snippets/css/complete-guide-grid/).
