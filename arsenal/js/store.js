/*
  A tiny state store, the idea behind Redux, Zustand and React's useState:
  keep data in one place, change it only through set(), and re-render whatever
  subscribed when it changes.

    const store = VWA.createStore({ todos: [], filter: "all" }, { persist: "todos-app" });

    store.subscribe((state) => render(state));           // runs now and after every change
    store.set({ filter: "done" });                       // merge an object
    store.set((state) => ({ todos: [...state.todos, todo] })); // or compute from the old state
    store.get().todos;                                   // read the current state

  With { persist: "key" } the state is saved to localStorage and restored on reload.
  Treat the state as read-only: build new arrays and objects instead of pushing into them.
*/
(function () {
  "use strict";

  const VWA = (window.VWA = window.VWA || {});

  VWA.createStore = (initialState, { persist } = {}) => {
    let state = { ...initialState };
    const listeners = new Set();

    if (persist) {
      try {
        const saved = JSON.parse(localStorage.getItem(persist));
        if (saved && typeof saved === "object") state = { ...state, ...saved };
      } catch {
        /* nothing saved yet, or the saved value is broken: start from initialState */
      }
    }

    const store = {
      get: () => state,

      set(update) {
        const changes = typeof update === "function" ? update(state) : update;
        state = { ...state, ...changes };
        if (persist) {
          try {
            localStorage.setItem(persist, JSON.stringify(state));
          } catch {
            /* storage full or blocked */
          }
        }
        listeners.forEach((listener) => listener(state));
      },

      /** Returns a function that stops listening. */
      subscribe(listener, { immediate = true } = {}) {
        listeners.add(listener);
        if (immediate) listener(state);
        return () => listeners.delete(listener);
      },

      /** Back to the starting state, and forgets what was saved until the next set(). */
      reset() {
        state = { ...initialState };
        if (persist) {
          try {
            localStorage.removeItem(persist);
          } catch {
            /* storage blocked */
          }
        }
        listeners.forEach((listener) => listener(state));
      },
    };

    return store;
  };
})();
