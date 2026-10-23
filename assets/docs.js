/*
  Helpers for this repo's own documentation pages. You do not need this file in your project.

  Every .demo-preview gets a "Show code" block built from its own HTML, so the code
  shown always matches the live example. This script must load BEFORE icons.js and
  ui.js, which change the live HTML (icons become <svg>, tabs get tabindex, ...).
*/
(function () {
  "use strict";

  const escape = (text) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /** Removes the common leading indentation and blank edge lines. */
  const dedent = (text) => {
    const lines = text.replace(/^\s*\n|\n\s*$/g, "").split("\n");
    const indent = Math.min(...lines.filter((line) => line.trim()).map((line) => line.match(/^ */)[0].length));
    return lines.map((line) => line.slice(indent)).join("\n");
  };

  const highlightHTML = (code) =>
    escape(code)
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-comment">$1</span>')
      .replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, '$1<span class="tok-tag">$2</span>')
      .replace(/([\w:@.-]+)=(&quot;[\s\S]*?&quot;)/g, '<span class="tok-attr">$1</span>=<span class="tok-string">$2</span>');

  const highlightCSS = (code) =>
    escape(code)
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-comment">$1</span>')
      .replace(/^(\s+)([\w-]+)(:)/gm, '$1<span class="tok-attr">$2</span>$3')
      .replace(/^([^\s<][^{\n]*)(\{)/gm, '<span class="tok-tag">$1</span>$2');

  window.DOCS = { escape, dedent, highlightHTML, highlightCSS };

  let counter = 0;
  document.querySelectorAll(".demo-preview").forEach((preview) => {
    const id = `code-${++counter}`;
    const source = dedent(preview.innerHTML);
    const details = document.createElement("details");
    details.className = "demo-code";
    details.innerHTML = `
      <summary>Show code</summary>
      <button class="btn btn-ghost btn-sm copy-code" type="button" data-copy="#${id}">Copy</button>
      <pre><code id="${id}">${highlightHTML(source)}</code></pre>`;
    preview.after(details);
  });
})();
