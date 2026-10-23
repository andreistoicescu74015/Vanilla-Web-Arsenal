/*
  A hash router: the core idea of React Router and Vue Router, small enough to read in one go.
  URLs look like page.html#/notes/42. The part after # changes without reloading
  the page, so this works on file://, GitHub Pages and any static host with no
  server configuration.

    const router = VWA.createRouter({
      "/": () => showHome(),
      "/notes/:id": ({ params }) => showNote(params.id),
      "*": () => showNotFound(),          // anything else; keep it last
    });

    <a href="#/notes/42">Open</a>          // links just point at the hash
    router.navigate("/notes/42");          // or navigate from code

  Each handler receives { path, params, query }. For #/search?q=css, query is { q: "css" }.
*/
(function () {
  "use strict";

  const VWA = (window.VWA = window.VWA || {});

  const escapeRegExp = (text) => text.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

  const compile = (pattern) => {
    if (pattern === "*") return { regex: /.*/, keys: [] };
    const keys = [];
    const source = pattern
      .split("/")
      .map((part) => {
        if (!part.startsWith(":")) return escapeRegExp(part);
        keys.push(part.slice(1));
        return "([^/]+)";
      })
      .join("/");
    return { regex: new RegExp(`^${source}/?$`), keys };
  };

  VWA.createRouter = (routes, { onChange } = {}) => {
    const table = Object.entries(routes).map(([pattern, handler]) => ({ pattern, handler, ...compile(pattern) }));

    const resolve = () => {
      const [path, queryString = ""] = (location.hash.slice(1) || "/").split("?");
      for (const route of table) {
        const match = path.match(route.regex);
        if (!match) continue;
        const params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]));
        const context = { path, params, query: Object.fromEntries(new URLSearchParams(queryString)) };
        route.handler(context);
        if (onChange) onChange(context);
        return;
      }
    };

    window.addEventListener("hashchange", resolve);
    resolve();

    return {
      navigate: (path) => {
        location.hash = path;
      },
      resolve,
    };
  };
})();
