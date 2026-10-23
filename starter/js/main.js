/*
  YOUR SCRIPT
  Runs after the HTML is parsed and after the arsenal scripts (it is the last
  <script defer> in index.html), so every element and every VWA helper is ready.

  The pattern below is the one to reuse for any feature:
    1. keep the data in a store
    2. write a function that turns the data into HTML
    3. re-render whenever the data changes
    4. handle events with delegation, so they keep working after a re-render
*/
(function () {
  "use strict";

  const { $, on, html, render, createStore, toast } = VWA;

  // 1. Data. { persist } saves it in localStorage, so a reload keeps it.
  const store = createStore({ items: ["Read the wiki", "Pick a brand color"] }, { persist: "starter-items" });

  // 2. Data to HTML. html`` escapes every ${value}, so user input cannot inject HTML.
  const view = (state) => html`
    <div class="card max-w-l">
      <form class="input-group p-m" id="add-item">
        <label class="visually-hidden" for="item-text">New item</label>
        <input class="input" id="item-text" name="text" placeholder="Add an item" required>
        <button class="btn btn-primary" type="submit"><i data-icon="plus"></i> Add</button>
      </form>
      <ul role="list" class="border-t">
        ${state.items.map((item, index) => html`
          <li class="task-item">
            <span>${item}</span>
            <button class="btn btn-ghost btn-icon btn-sm" type="button" data-remove="${index}" aria-label="Remove ${item}"><i data-icon="x"></i></button>
          </li>`)}
      </ul>
    </div>`;

  // 3. Re-render on every change (subscribe also renders once right away)
  store.subscribe((state) => render("#app", view(state)));

  // 4. Events, delegated to #app because its content is replaced on every render
  on("#app", "submit", "#add-item", (event, form) => {
    event.preventDefault();
    const text = form.elements.text.value.trim();
    store.set((state) => ({ items: [...state.items, text] }));
    toast("Added", { type: "success", duration: 1500 });
    $("#item-text").focus();
  });

  on("#app", "click", "[data-remove]", (event, button) => {
    const index = Number(button.dataset.remove);
    store.set((state) => ({ items: state.items.filter((_, i) => i !== index) }));
    // The button that had focus is gone after the re-render; give focus a sensible new home
    $("#item-text").focus();
  });
})();
