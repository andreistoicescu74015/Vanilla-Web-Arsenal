/* Article page: table of contents, scroll spy and reading progress. */
(function () {
  "use strict";

  const { $, $$, h, on, toast } = VWA;
  const headings = $$("#article h2[id]");

  // Table of contents built from the h2 headings, so it never goes out of date
  $("#toc").append(...headings.map((heading) => h("a", { href: `#${heading.id}` }, heading.textContent)));

  // Scroll spy: mark the link of the section currently at the top of the screen
  const links = new Map($$("#toc a").map((link) => [link.hash.slice(1), link]));
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((link) => link.removeAttribute("aria-current"));
        links.get(entry.target.id)?.setAttribute("aria-current", "true");
      }
    },
    { rootMargin: "0px 0px -70% 0px" } // a heading counts once it reaches the top 30% of the screen
  );
  headings.forEach((heading) => spy.observe(heading));

  // Reading progress: how far the end of the article has scrolled past the screen
  const article = $("#article");
  const bar = $(".reading-progress");
  let ticking = false;
  const updateProgress = () => {
    const box = article.getBoundingClientRect();
    const progress = Math.min(Math.max(-box.top / (box.height - innerHeight), 0), 1);
    bar.style.setProperty("--progress", progress);
    ticking = false;
  };
  // requestAnimationFrame runs the update at most once per frame, however fast scroll events arrive
  on(window, "scroll", () => {
    if (!ticking) requestAnimationFrame(updateProgress);
    ticking = true;
  }, { passive: true });
  updateProgress();

  on("[data-copy-url]", "click", async () => {
    await navigator.clipboard.writeText(location.href);
    toast("Link copied", { type: "success", duration: 2000 });
  });
})();
