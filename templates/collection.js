/*
  Trailhead: a product collection with search, filters, sorting, pages, a product page
  and a cart. The pattern fits any "browse a catalog" idea: a directory, a marketplace,
  rooms to book, events to join.

    #/                                  the list
    #/?q=boot&category=Shoes&sort=price-asc&page=2
                                        the list, filtered: the URL holds the filters, so the
                                        back button, a reload and a shared link all keep them
    #/items/14                          one product

  The cart lives in a store that is saved in localStorage.
*/
(function () {
  "use strict";

  const { $, on, html, render, createStore, createRouter, debounce, formatMoney, toast } = VWA;
  const view = $("#main");
  const products = VWA.sample.products;
  const byId = (id) => products.find((product) => String(product.id) === String(id));

  const PAGE_SIZE = 6;
  const CATEGORIES = ["All", "Shoes", "Bags", "Clothing", "Accessories"];
  const SORTS = {
    popular: { label: "Most reviewed", compare: (a, b) => b.reviews - a.reviews },
    "price-asc": { label: "Price, low to high", compare: (a, b) => a.price - b.price },
    "price-desc": { label: "Price, high to low", compare: (a, b) => b.price - a.price },
    rating: { label: "Best rated", compare: (a, b) => b.rating - a.rating },
  };

  /* ---------- List state in the URL ---------- */

  function readFilters() {
    const query = new URLSearchParams(location.hash.split("?")[1] || "");
    return {
      q: query.get("q") || "",
      category: CATEGORIES.includes(query.get("category")) ? query.get("category") : "All",
      sort: SORTS[query.get("sort")] ? query.get("sort") : "popular",
      page: Math.max(1, Number(query.get("page")) || 1),
    };
  }

  // A list URL with some filters changed. Default values stay out of the URL.
  function listHref(changes) {
    const next = { ...readFilters(), ...changes };
    const query = new URLSearchParams();
    if (next.q) query.set("q", next.q);
    if (next.category !== "All") query.set("category", next.category);
    if (next.sort !== "popular") query.set("sort", next.sort);
    if (next.page > 1) query.set("page", next.page);
    const text = query.toString();
    return text ? `#/?${text}` : "#/";
  }

  function findProducts({ q, category, sort }) {
    const words = q.toLowerCase().trim();
    return products
      .filter((product) => category === "All" || product.category === category)
      .filter((product) => !words || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(words))
      .toSorted(SORTS[sort].compare);
  }

  /* ---------- Pieces of markup ---------- */

  const stars = (rating) => html`
    <span class="rating" role="img" aria-label="Rated ${rating} out of 5">
      ${[1, 2, 3, 4, 5].map((n) => html`<i data-icon="star" class="${n <= Math.round(rating) ? "is-filled" : ""}"></i>`)}
    </span>`;

  const stockBadge = (product) => {
    if (product.stock === 0) return html`<span class="badge badge-danger">Out of stock</span>`;
    if (product.badge) return html`<span class="badge badge-primary">${product.badge}</span>`;
    return "";
  };

  // level: the heading level of the card title (2 in the list, 3 under "You may also like")
  const productCard = (product, level = 2) => {
    const title = html`<a class="card-link" href="#/items/${product.id}">${product.name}</a>`;
    return html`
    <article class="card card-interactive product-card ${product.stock === 0 ? "is-sold-out" : ""}">
      <img class="card-media" data-placeholder="" data-hue="${product.hue}" width="800" height="600" alt="">
      <div class="card-body" style="--gap: var(--space-xs)">
        <!-- min height: cards with and without a badge keep their titles on one line -->
        <div class="cluster" style="--gap: var(--space-xs); min-block-size: 1.375rem">${stockBadge(product)}<span class="text-xs text-muted">${product.category}</span></div>
        ${level === 3 ? html`<h3 class="text-lg">${title}</h3>` : html`<h2 class="text-lg">${title}</h2>`}
        <div class="flex items-center gap-xs">${stars(product.rating)}<span class="text-sm text-muted">${product.rating} (${product.reviews})</span></div>
        <p class="price push-down">${formatMoney(product.price)}</p>
      </div>
    </article>`;
  };

  function pagination(page, pages) {
    if (pages < 2) return "";
    const numbers = Array.from({ length: pages }, (_, i) => i + 1);
    return html`
      <nav class="pagination" aria-label="Pages">
        <a href="${listHref({ page: page - 1 })}" aria-label="Previous page" ${page === 1 ? html`aria-disabled="true" tabindex="-1"` : ""}><i data-icon="chevron-left"></i></a>
        ${numbers.map((n) => html`<a href="${listHref({ page: n })}" ${n === page ? html`aria-current="page"` : ""} aria-label="Page ${n}">${n}</a>`)}
        <a href="${listHref({ page: page + 1 })}" aria-label="Next page" ${page === pages ? html`aria-disabled="true" tabindex="-1"` : ""}><i data-icon="chevron-right"></i></a>
      </nav>`;
  }

  /* ---------- List page ---------- */

  const listShell = () => html`
    <div class="stack" style="--gap: var(--space-xl)" id="list-view">
      <header class="stack" style="--gap: var(--space-xs)">
        <h1 class="text-3xl" tabindex="-1">Gear for long days outside</h1>
        <p class="text-muted max-w-prose">Tested on Carpathian ridges. Free returns within 30 days, and a person answers every email.</p>
      </header>

      <div class="stack" style="--gap: var(--space-m)">
        <div class="toolbar">
          <div class="field search">
            <label class="label" for="search">Search</label>
            <input class="input" id="search" type="search" placeholder="Boots, rain jacket, headlamp..." autocomplete="off">
          </div>
          <div class="field sort">
            <label class="label" for="sort">Sort by</label>
            <select class="input" id="sort">
              ${Object.entries(SORTS).map(([value, sort]) => html`<option value="${value}">${sort.label}</option>`)}
            </select>
          </div>
        </div>
        <fieldset class="segmented" id="categories">
          <legend class="visually-hidden">Category</legend>
          ${CATEGORIES.map((category) => html`<label><input type="radio" name="category" value="${category}"> ${category}</label>`)}
        </fieldset>
      </div>

      <p class="text-sm text-muted" id="results-summary" tabindex="-1"></p>
      <div id="results"></div>
    </div>`;

  // Puts the filters from the URL into the controls (after back/forward or a shared link)
  function syncControls(filters) {
    const search = $("#search");
    if (document.activeElement !== search) search.value = filters.q;
    $("#sort").value = filters.sort;
    const radio = view.querySelector(`input[name="category"][value="${filters.category}"]`);
    if (radio) radio.checked = true;
  }

  function renderResults(filters) {
    const found = findProducts(filters);
    const pages = Math.max(1, Math.ceil(found.length / PAGE_SIZE));
    const page = Math.min(filters.page, pages);
    const shown = found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    $("#status").textContent = found.length ? `${found.length} ${found.length === 1 ? "product" : "products"} found` : "No products match";

    if (!found.length) {
      $("#results-summary").textContent = "";
      render("#results", html`
        <div class="empty-state">
          <i data-icon="search"></i>
          <h2>No gear matches</h2>
          <p>Try another word, or show every category.</p>
          <button class="btn btn-primary" type="button" data-action="clear-filters">Clear filters</button>
        </div>`);
      return;
    }

    const first = (page - 1) * PAGE_SIZE + 1;
    $("#results-summary").textContent = `Showing ${first} to ${first + shown.length - 1} of ${found.length} products`;
    render("#results", html`
      <div class="stack" style="--gap: var(--space-xl)">
        <div class="auto-grid" style="--min: 18rem">${shown.map((product) => productCard(product))}</div>
        ${pagination(page, pages)}
      </div>`);
  }

  let lastPage = null;

  function showList() {
    const filters = readFilters();
    if (!$("#list-view")) render(view, listShell());
    document.title = filters.category === "All" ? "Shop | Trailhead" : `${filters.category} | Trailhead`;
    syncControls(filters);
    renderResults(filters);

    // A new page of results: start reading at the summary line, not at the bottom
    if (lastPage !== null && lastPage !== filters.page) {
      $("#results-summary").focus();
      $("#results-summary").scrollIntoView({ block: "start" });
    }
    lastPage = filters.page;
  }

  /* ---------- Product page ---------- */

  function showProduct(id) {
    lastPage = null;
    const product = byId(id);
    if (!product) return showNotFound();
    document.title = `${product.name} | Trailhead`;

    const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
    const stockLine =
      product.stock === 0
        ? html`<p class="text-danger font-semibold">Out of stock. Back in a few weeks.</p>`
        : product.stock < 10
          ? html`<p class="text-warning font-semibold">Only ${product.stock} left</p>`
          : html`<p class="text-success font-semibold">In stock, ships in 1 to 2 days</p>`;

    render(view, html`
      <div class="stack" style="--gap: var(--space-2xl)">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><a href="#/">Shop</a></li>
            <li><a href="${"#/?category=" + encodeURIComponent(product.category)}">${product.category}</a></li>
            <li><span aria-current="page">${product.name}</span></li>
          </ol>
        </nav>

        <div class="cols-2 items-start" style="--gap: var(--space-2xl)">
          <img class="rounded-l w-full" data-placeholder="" data-hue="${product.hue}" width="1000" height="800" alt="">
          <div class="stack" style="--gap: var(--space-m)">
            <div class="cluster" style="--gap: var(--space-xs)">${stockBadge(product)}<span class="text-sm text-muted">${product.category}</span></div>
            <h1 class="text-3xl" tabindex="-1">${product.name}</h1>
            <div class="flex items-center gap-xs">${stars(product.rating)}<span class="text-sm text-muted">${product.rating} from ${product.reviews} reviews</span></div>
            <p class="price text-2xl">${formatMoney(product.price)}</p>
            <p class="text-muted">${product.description}</p>
            ${stockLine}
            <form class="flex items-end gap-s" id="add-form" data-id="${product.id}">
              <div class="field" style="max-inline-size: 7rem">
                <label class="label" for="quantity">Quantity</label>
                <input class="input" id="quantity" name="quantity" type="number" min="1" max="${Math.max(1, product.stock)}" value="1" ${product.stock === 0 ? "disabled" : ""}>
              </div>
              <button class="btn btn-primary btn-lg grow" type="submit" ${product.stock === 0 ? "disabled" : ""}><i data-icon="shopping-cart"></i> Add to cart</button>
            </form>
            <ul role="list" class="stack text-sm text-muted" style="--gap: var(--space-xs)">
              <li class="flex items-center gap-xs"><i data-icon="refresh"></i> Free returns within 30 days</li>
              <li class="flex items-center gap-xs"><i data-icon="shield"></i> Two-year warranty</li>
            </ul>
          </div>
        </div>

        ${related.length
          ? html`<section class="stack" style="--gap: var(--space-l)" aria-labelledby="related-title">
              <h2 class="text-2xl" id="related-title">You may also like</h2>
              <div class="auto-grid" style="--min: 18rem">${related.map((product) => productCard(product, 3))}</div>
            </section>`
          : ""}
      </div>`);
  }

  function showNotFound() {
    lastPage = null;
    document.title = "Not found | Trailhead";
    render(view, html`
      <div class="empty-state">
        <i data-icon="alert-triangle"></i>
        <h1 class="text-2xl" tabindex="-1">We could not find that page</h1>
        <p>The product may have been removed, or the link is old.</p>
        <a class="btn btn-primary" href="#/">Back to the shop</a>
      </div>`);
  }

  /* ---------- Cart ---------- */

  const cart = createStore({ items: [] }, { persist: "trailhead-cart" });
  const cartLines = (state) => state.items.map((item) => ({ ...item, product: byId(item.id) })).filter((line) => line.product);

  function addToCart(id, quantity) {
    const product = byId(id);
    cart.set((state) => {
      const existing = state.items.find((item) => item.id === product.id);
      const qty = Math.min(product.stock, (existing?.qty || 0) + quantity);
      const items = existing
        ? state.items.map((item) => (item.id === product.id ? { ...item, qty } : item))
        : [...state.items, { id: product.id, qty }];
      return { items };
    });
  }

  function setQuantity(id, qty) {
    cart.set((state) => ({
      items: qty > 0 ? state.items.map((item) => (item.id === id ? { ...item, qty } : item)) : state.items.filter((item) => item.id !== id),
    }));
  }

  function renderCart(state) {
    const lines = cartLines(state);
    const count = lines.reduce((sum, line) => sum + line.qty, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.qty * line.product.price, 0);

    // The badge on the cart button, and a name that says what is inside
    $("#cart-count").textContent = count;
    $("#cart-count").hidden = count === 0;
    $("#cart-button").setAttribute("aria-label", count ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart, empty");

    // Redrawing replaces the buttons, so remember which one had focus and restore it
    const focused = document.activeElement?.closest?.("#cart [data-qty], #cart [data-remove]");
    const focusKey = focused ? `[data-qty="${focused.dataset.qty}"], [data-remove="${focused.dataset.remove}"]` : null;

    if (!lines.length) {
      render("#cart-lines", html`
        <div class="empty-state">
          <i data-icon="shopping-cart"></i>
          <h3>Your cart is empty</h3>
          <p>Add something from the shop and it shows up here.</p>
          <a class="btn btn-primary" href="#/" data-dialog-close>Browse gear</a>
        </div>`);
      render("#cart-footer", "");
      return;
    }

    render("#cart-lines", html`
      <ul role="list">
        ${lines.map((line) => html`
          <li class="cart-line">
            <img data-placeholder="" data-hue="${line.product.hue}" width="128" height="128" alt="">
            <div class="stack min-w-0" style="--gap: var(--space-2xs)">
              <a class="font-semibold truncate" href="#/items/${line.id}" data-dialog-close>${line.product.name}</a>
              <span class="text-sm text-muted">${formatMoney(line.product.price)} each</span>
              <div class="quantity">
                <button class="btn btn-outline btn-icon btn-sm" type="button" data-qty="${line.id}:-1" aria-label="One less ${line.product.name}"><i data-icon="minus"></i></button>
                <output aria-label="Quantity of ${line.product.name}">${line.qty}</output>
                <button class="btn btn-outline btn-icon btn-sm" type="button" data-qty="${line.id}:1" aria-label="One more ${line.product.name}" ${line.qty >= line.product.stock ? "disabled" : ""}><i data-icon="plus"></i></button>
              </div>
            </div>
            <div class="stack items-end" style="--gap: var(--space-2xs)">
              <strong>${formatMoney(line.qty * line.product.price)}</strong>
              <button class="btn btn-ghost btn-sm" type="button" data-remove="${line.id}">Remove</button>
            </div>
          </li>`)}
      </ul>`);

    render("#cart-footer", html`
      <div class="stack w-full" style="--gap: var(--space-s)">
        <div class="split"><span class="text-muted">Subtotal</span><strong class="text-xl">${formatMoney(subtotal)}</strong></div>
        <p class="text-sm text-muted">Shipping is free over ${formatMoney(75)}. Taxes included.</p>
        <button class="btn btn-primary btn-lg btn-block" type="button" data-action="checkout">Checkout</button>
      </div>`);

    if (focusKey) $(focusKey)?.focus();
  }

  cart.subscribe(renderCart);

  /* ---------- Routing ---------- */

  let previousPath = null;
  createRouter(
    {
      "/": () => showList(),
      "/items/:id": ({ params }) => showProduct(params.id),
      "*": () => showNotFound(),
    },
    {
      onChange: ({ path }) => {
        // Moving to another page (not a filter change on the same page): start at its heading
        if (previousPath !== null && previousPath !== path) {
          window.scrollTo(0, 0);
          $("#main h1")?.focus();
        }
        previousPath = path;
        $("[data-nav-toggle]").setAttribute("aria-expanded", "false");
      },
    }
  );

  /* ---------- Events (delegated, so they survive redraws) ---------- */

  // Typing updates the results without adding a history entry per keystroke
  on(view, "input", "#search", debounce((event) => {
    history.replaceState(null, "", listHref({ q: event.target.value.trim(), page: 1 }));
    lastPage = 1;
    renderResults(readFilters());
  }, 250));

  // Filters and sorting add a history entry, so the back button undoes them
  on(view, "change", 'input[name="category"]', (event, radio) => {
    location.hash = listHref({ category: radio.value, page: 1 });
  });

  on(view, "change", "#sort", (event, select) => {
    location.hash = listHref({ sort: select.value, page: 1 });
  });

  on(view, "click", '[data-action="clear-filters"]', () => {
    $("#search").value = "";
    location.hash = "#/";
  });

  on(view, "submit", "#add-form", (event, form) => {
    event.preventDefault();
    const quantity = Math.max(1, Number(form.elements.quantity.value) || 1);
    const product = byId(form.dataset.id);
    addToCart(product.id, quantity);
    toast(`Added ${quantity} x ${product.name} to your cart`, {
      type: "success",
      action: { label: "View cart", onClick: () => VWA.dialog.open("cart") },
    });
  });

  on("#cart", "click", "[data-qty]", (event, button) => {
    const [id, step] = button.dataset.qty.split(":").map(Number);
    const line = cart.get().items.find((item) => item.id === id);
    setQuantity(id, Math.min(byId(id).stock, line.qty + step));
  });

  on("#cart", "click", "[data-remove]", (event, button) => {
    const id = Number(button.dataset.remove);
    const removed = cart.get().items.find((item) => item.id === id);
    setQuantity(id, 0);
    toast(`Removed ${byId(id).name}`, { action: { label: "Undo", onClick: () => addToCart(id, removed.qty) } });
  });

  on("#cart", "click", '[data-action="checkout"]', () => {
    cart.set({ items: [] });
    VWA.dialog.close("cart");
    toast("Order placed. This is a demo, so nothing was charged.", { type: "success" });
  });
})();
