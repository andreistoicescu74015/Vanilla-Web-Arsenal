/*
  DOM helpers: the useful 5% of jQuery, plus a safe way to build HTML.

    const { $, $$, on, h, html, render } = VWA;

  These are classic scripts (not ES modules) so they also work when you open the
  HTML file straight from disk (file://). Load them with <script defer src="...">.
*/
(function () {
  "use strict";

  const VWA = (window.VWA = window.VWA || {});

  /** First element matching the selector, or null. $(".card"), $("button", form) */
  VWA.$ = (selector, root = document) => root.querySelector(selector);

  /** All matching elements as a real array (so .map, .filter and .forEach work). */
  VWA.$$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /**
   * Adds an event listener and returns a function that removes it.
   *
   *   on(button, "click", (event) => ...)
   *   on("#list", "click", ".delete", (event, deleteButton) => ...)
   *
   * With a selector this is event delegation: one listener on the parent handles
   * clicks on every matching child, including children added later.
   */
  VWA.on = (target, type, selector, handler, options) => {
    if (typeof target === "string") target = document.querySelector(target);
    if (typeof selector === "function") {
      options = handler;
      handler = selector;
      selector = null;
    }

    const listener = selector
      ? (event) => {
          const match = event.target instanceof Element && event.target.closest(selector);
          if (match && target.contains(match)) handler.call(match, event, match);
        }
      : (event) => handler.call(target, event, target);

    target.addEventListener(type, listener, options);
    return () => target.removeEventListener(type, listener, options);
  };

  /**
   * Creates an element without innerHTML, so text is never parsed as HTML.
   *
   *   h("button", { class: "btn btn-primary", onclick: save }, "Save")
   *   h("ul", {}, items.map((item) => h("li", {}, item.name)))
   *
   * Props starting with "on" become event listeners. true sets an empty attribute,
   * false or null skips it. style and dataset accept objects.
   */
  VWA.h = (tag, props, ...children) => {
    const el = document.createElement(tag);

    for (const [key, value] of Object.entries(props || {})) {
      if (value == null || value === false) continue;
      if (key.startsWith("on") && typeof value === "function") {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === "class" || key === "className") {
        el.className = value;
      } else if (key === "style" && typeof value === "object") {
        // Custom properties ("--gap") only work through setProperty, not el.style["--gap"]
        for (const [property, styleValue] of Object.entries(value)) {
          if (property.startsWith("--")) el.style.setProperty(property, styleValue);
          else el.style[property] = styleValue;
        }
      } else if (key === "dataset") {
        Object.assign(el.dataset, value);
      } else {
        el.setAttribute(key, value === true ? "" : value);
      }
    }

    el.append(...children.flat(Infinity).filter((child) => child != null && child !== false));
    return el;
  };

  /**
   * Form fields as a plain object, keyed by each field's name attribute.
   * Checkbox groups and multi-selects (several values under one name) become arrays.
   *   on(form, "submit", (event) => { event.preventDefault(); save(formToObject(form)); });
   */
  VWA.formToObject = (form) => {
    const data = {};
    for (const [key, value] of new FormData(form)) {
      if (key in data) data[key] = [].concat(data[key], value);
      else data[key] = value;
    }
    return data;
  };

  /* ---------- Safe HTML templates ---------- */

  class SafeHTML {
    constructor(value) {
      this.value = value;
    }
    toString() {
      return this.value;
    }
  }

  const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  /** Turns <, >, &, " and ' into entities so user text cannot inject HTML. */
  VWA.escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);

  const toHTML = (value) => {
    if (value == null || value === false) return "";
    if (value instanceof SafeHTML) return value.value;
    if (Array.isArray(value)) return value.map(toHTML).join("");
    return VWA.escapeHTML(value);
  };

  /**
   * Tagged template for HTML strings. Every ${value} is escaped, unless it is
   * itself an html`` result or an array of them, which lets you nest templates.
   *
   *   const card = (user) => html`<li class="card">${user.name}</li>`;
   *   render(list, html`<ul>${users.map(card)}</ul>`);
   */
  VWA.html = (strings, ...values) =>
    new SafeHTML(strings.reduce((out, str, i) => out + str + (i < values.length ? toHTML(values[i]) : ""), ""));

  /** Marks a string as trusted HTML. Only use it for HTML you wrote yourself. */
  VWA.raw = (value) => new SafeHTML(String(value));

  /** Replaces the content of target. Plain strings are escaped, html`` results are not. */
  VWA.render = (target, content) => {
    if (typeof target === "string") target = document.querySelector(target);
    target.innerHTML = toHTML(content);
  };
})();
