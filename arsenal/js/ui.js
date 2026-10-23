/*
  Behavior for the components in components.css and effects.css, switched on by
  HTML attributes, the way Bootstrap's data-bs-* attributes and Alpine.js work.
  Load it after dom.js (and icons.js if you use icons).

  One rule: classes are looks, data-* attributes are behavior.

  Attributes (no JavaScript to write):
    data-theme-toggle               button that switches light/dark and remembers it
    data-nav-toggle                 opens and closes the mobile menu of a .navbar
    data-dialog-open="id"           opens <dialog id="id">
    data-dialog-close               closes the dialog it is inside
    data-tabs                       tabs with keyboard support (arrow keys, Home, End);
                                    fires a bubbling "tabchange" event on the new tab
    data-dropdown                   on <details>: closes on outside click and Escape
    data-validate                   on <form>: inline error messages instead of browser bubbles
    data-error="message"            custom error message for one field
    data-match="#password"          field must equal another field (confirm password)
    data-copy="text" / "#id"        copies text, or the text of an element, to the clipboard
    data-reveal                     fades in when scrolled into view
    data-count-to="1200"            counts up to the number when scrolled into view
    data-spotlight                  light that follows the mouse (with class .spotlight)
    data-marquee                    on .marquee: endless scrolling strip with a pause button

  Markup added later (render(), innerHTML, append) is set up automatically, like the
  markup that was in the page from the start.

  Functions:
    VWA.toast("Saved", { type: "success" })
    VWA.toast("Task deleted", { action: { label: "Undo", onClick: restore } })
    await VWA.confirm("Delete this note?", { danger: true })
    VWA.validate(element)           checks the fields inside element (one step of a form)
    VWA.theme.toggle()
*/
(function () {
  "use strict";

  const VWA = (window.VWA = window.VWA || {});
  const root = document.documentElement;
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const icon = (name) => (VWA.icon ? String(VWA.icon(name)) : "");

  root.classList.add("js");

  /* ---------- Theme (light / dark) ---------- */
  /* To avoid a flash of the wrong theme, also put this line in <head>:
     <script>document.documentElement.dataset.theme = localStorage.getItem("vwa-theme") || "";</script> */

  const THEME_KEY = "vwa-theme";

  VWA.theme = {
    get() {
      const forced = root.dataset.theme;
      if (forced === "light" || forced === "dark") return forced;
      return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    },
    set(theme) {
      const apply = () => {
        root.dataset.theme = theme;
        try {
          localStorage.setItem(THEME_KEY, theme);
        } catch {
          /* storage blocked: the theme still changes for this page */
        }
        updateThemeButtons();
      };
      if (document.startViewTransition && !reducedMotion()) document.startViewTransition(apply);
      else apply();
    },
    toggle() {
      VWA.theme.set(VWA.theme.get() === "dark" ? "light" : "dark");
    },
  };

  function updateThemeButtons() {
    const next = VWA.theme.get() === "dark" ? "light" : "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-label", `Switch to ${next} theme`);
      button.innerHTML = icon(next === "dark" ? "moon" : "sun") || (next === "dark" ? "Dark" : "Light");
    });
  }

  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) root.dataset.theme = saved;
  } catch {
    /* storage blocked */
  }

  /* ---------- Toasts ---------- */

  const TOAST_ICONS = { info: "info", success: "check-circle", warning: "alert-triangle", danger: "alert-circle" };

  function toastRegion() {
    let region = document.querySelector(".toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "toast-region";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.append(region);
    }
    return region;
  }

  /**
   * Shows a short message in the corner. Returns a function that dismisses it.
   * Errors (type "danger") stay until dismissed; others leave after `duration` ms,
   * and the countdown pauses while the pointer or keyboard focus is on the toast.
   * action: { label, onClick } adds a button such as "Undo".
   */
  VWA.toast = (message, { type = "info", duration = type === "danger" ? 0 : 4000, action } = {}) => {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `${icon(TOAST_ICONS[type] || "info")}<div class="toast-message"></div><button class="toast-close" type="button" aria-label="Dismiss">&times;</button>`;
    toast.querySelector(".toast-message").textContent = message;

    const dismiss = () => {
      if (toast.classList.contains("is-leaving")) return;
      clearTimeout(timer);
      toast.classList.add("is-leaving");
      toast.addEventListener("animationend", () => toast.remove(), { once: true });
    };

    if (action) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "toast-action";
      button.textContent = action.label;
      button.addEventListener("click", () => {
        action.onClick?.();
        dismiss();
      });
      toast.querySelector(".toast-message").after(button);
    }
    toast.querySelector(".toast-close").addEventListener("click", dismiss);

    // Countdown that pauses while someone is reading or using the toast
    let timer;
    let remaining = duration;
    let startedAt = 0;
    const resume = () => {
      if (!remaining || startedAt) return;
      startedAt = Date.now();
      timer = setTimeout(dismiss, remaining);
    };
    const pause = () => {
      if (!startedAt) return;
      clearTimeout(timer);
      remaining = Math.max(1000, remaining - (Date.now() - startedAt));
      startedAt = 0;
    };
    toast.addEventListener("pointerenter", pause);
    toast.addEventListener("pointerleave", resume);
    toast.addEventListener("focusin", pause);
    toast.addEventListener("focusout", resume);
    resume();

    toastRegion().append(toast);
    return dismiss;
  };

  /* ---------- Dialogs ---------- */

  VWA.dialog = {
    open: (id) => document.getElementById(id)?.showModal(),
    close: (id) => document.getElementById(id)?.close(),
  };

  /**
   * A styled replacement for window.confirm(). Resolves to true or false.
   *   if (await VWA.confirm("Delete this note?", { danger: true })) deleteNote();
   */
  VWA.confirm = (message, { title = "Are you sure?", confirmText = "Confirm", cancelText = "Cancel", danger = false } = {}) =>
    new Promise((resolve) => {
      const dialog = document.createElement("dialog");
      dialog.className = "modal";
      dialog.innerHTML = `
        <form method="dialog">
          <div class="modal-body stack" style="--gap: var(--space-xs)">
            <h2 class="text-xl"></h2>
            <p class="text-muted"></p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" value="cancel"></button>
            <button class="btn ${danger ? "btn-danger" : "btn-primary"}" value="confirm"></button>
          </div>
        </form>`;
      dialog.querySelector("h2").textContent = title;
      dialog.querySelector("p").textContent = message;
      dialog.querySelector('[value="cancel"]').textContent = cancelText;
      dialog.querySelector('[value="confirm"]').textContent = confirmText;
      dialog.addEventListener("close", () => {
        resolve(dialog.returnValue === "confirm");
        dialog.remove();
      });
      document.body.append(dialog);
      dialog.showModal();
    });

  /* ---------- Tabs ---------- */

  /* User-driven changes fire a "tabchange" event that bubbles from the selected tab:
     VWA.on(document, "tabchange", "#views [role=tab]", (event, tab) => show(tab.id)); */
  function selectTab(tab, { focus = false, notify = false } = {}) {
    const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
    for (const other of tabs) {
      const selected = other === tab;
      other.setAttribute("aria-selected", String(selected));
      other.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(other.getAttribute("aria-controls"));
      if (panel) panel.hidden = !selected;
    }
    if (focus) tab.focus();
    if (notify) tab.dispatchEvent(new CustomEvent("tabchange", { bubbles: true }));
  }

  function setupTabs(container) {
    const tabs = [...container.querySelectorAll('[role="tab"]')];
    if (!tabs.length) return;
    selectTab(tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0]);
  }

  /* ---------- Forms ---------- */

  // The field's name as the user sees it: its label, or the legend of its group
  function fieldName(field) {
    const source =
      field.type === "radio" ? field.closest("fieldset")?.querySelector("legend") : field.labels?.[0];
    const text = source ? source.textContent : field.getAttribute("aria-label") || field.name || "This field";
    return text.replace(/\(optional\)/i, "").replace(/\s+/g, " ").trim();
  }

  // Specific messages in plain words, instead of the browser's generic ones
  function errorMessage(field) {
    const v = field.validity;
    if (v.customError) return field.validationMessage; // set by data-match or by your own setCustomValidity()
    if (field.dataset.error) return field.dataset.error;
    const name = fieldName(field);
    if (v.valueMissing) {
      if (field.type === "checkbox") return "Check this box to continue.";
      if (field.type === "radio") return "Choose one of the options.";
      return `${name} is required.`;
    }
    if (v.typeMismatch && field.type === "email") return "Enter an email address, like name@example.com.";
    if (v.typeMismatch && field.type === "url") return "Enter a web address, like https://example.com.";
    if (v.tooShort) return `${name} needs at least ${field.minLength} characters (now ${field.value.length}).`;
    if (v.tooLong) return `${name} can have at most ${field.maxLength} characters.`;
    if (v.rangeUnderflow) return `${name} must be ${field.min} or more.`;
    if (v.rangeOverflow) return `${name} must be ${field.max} or less.`;
    if (v.stepMismatch) return `${name} must be a multiple of ${field.step}.`;
    if (v.patternMismatch) return field.title || `${name} is not in the expected format.`;
    if (v.badInput) return `${name} has a value that is not valid.`;
    return field.validationMessage;
  }

  // Where a field's error message goes: inside its .field wrapper, or right after its
  // label (checkboxes and radios that sit in a plain <label class="check">)
  function fieldErrorElement(field) {
    const wrapper = field.closest(".field") || (field.type === "radio" ? field.closest("fieldset") : null);
    let error;
    if (wrapper) {
      error = wrapper.querySelector(":scope > .field-error");
      if (!error) {
        error = document.createElement("p");
        error.className = "field-error";
        wrapper.append(error);
      }
    } else {
      const anchor = field.closest("label") || field;
      error = anchor.nextElementSibling?.matches(".field-error") ? anchor.nextElementSibling : null;
      if (!error) {
        error = document.createElement("p");
        error.className = "field-error";
        anchor.after(error);
      }
    }
    if (!error.id) error.id = `${field.name || field.id || "field"}-error-${Math.random().toString(36).slice(2, 7)}`;
    const describedBy = (field.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
    if (!describedBy.includes(error.id)) field.setAttribute("aria-describedby", [...describedBy, error.id].join(" "));
    return error;
  }

  function validateField(field) {
    // Two checks the browser does not make on its own: data-match, and minlength on a value
    // set by code (browsers only check minlength after the user typed, so a restored draft
    // would pass). Only fields that use one of them get a custom error, so a
    // setCustomValidity() of your own on other fields is left alone.
    const minLength = field.minLength > 0 && field.value && field.value.length < field.minLength;
    if (field.dataset.match || field.hasAttribute("minlength")) {
      const other = field.dataset.match && document.querySelector(field.dataset.match);
      let message = "";
      if (other && other.value !== field.value) message = field.dataset.matchError || "The values do not match.";
      else if (minLength) message = `${fieldName(field)} needs at least ${field.minLength} characters (now ${field.value.length}).`;
      field.setCustomValidity(message);
    }
    const valid = field.checkValidity();
    // A radio group is one question: every radio in it gets the same state
    const group = field.type === "radio" && field.form ? [...field.form.elements].filter((el) => el.name === field.name) : [field];
    group.forEach((el) => el.setAttribute("aria-invalid", String(!valid)));
    fieldErrorElement(field).textContent = valid ? "" : errorMessage(field);
    return valid;
  }

  // Fields that take part in validation; one entry per radio group
  function fieldsIn(container) {
    const seen = new Set();
    return [...container.querySelectorAll("input, select, textarea")].filter((el) => {
      if (!el.willValidate || ["submit", "button", "reset"].includes(el.type)) return false;
      if (el.type !== "radio") return true;
      if (seen.has(el.name)) return false;
      seen.add(el.name);
      return true;
    });
  }

  /**
   * Checks every field inside element, shows the messages, focuses the first invalid
   * field, and returns true when all are valid. Use it for one step of a multi-step form:
   *   if (VWA.validate(currentStep)) goToNextStep();
   */
  VWA.validate = (element) => {
    const invalid = fieldsIn(element).filter((field) => !validateField(field));
    invalid[0]?.focus();
    return invalid.length === 0;
  };

  /* ---------- Clipboard ---------- */

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.cssText = "position:fixed;opacity:0";
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
  }

  /* ---------- Count up ---------- */
  /* The HTML holds the real number (so it is right without JavaScript and in screenshots);
     JavaScript resets it to 0 and counts up when it scrolls into view. */

  function countFormat(el) {
    const decimals = (el.dataset.countTo.split(".")[1] || "").length;
    const number = new Intl.NumberFormat(VWA.locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return (value) => (el.dataset.prefix || "") + number.format(value) + (el.dataset.suffix || "");
  }

  function countUp(el) {
    const target = Number(el.dataset.countTo);
    const format = countFormat(el);
    if (reducedMotion()) {
      el.textContent = format(target);
      return;
    }
    const duration = Number(el.dataset.duration) || 1600;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Marquee ---------- */

  function setupMarquee(marquee) {
    const track = marquee.querySelector(".marquee-track");
    if (!track || marquee.dataset.ready) return;
    marquee.dataset.ready = "true";

    // One copy of the items makes the loop seamless; screen readers skip the copy
    [...track.children].forEach((child) => {
      const clone = child.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.append(clone);
    });

    // WCAG 2.2.2: anything that moves for more than 5 seconds needs a way to stop it
    if (reducedMotion()) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-ghost btn-sm marquee-toggle";
    const update = () => {
      const paused = marquee.classList.contains("is-paused");
      button.setAttribute("aria-pressed", String(paused));
      button.innerHTML = `${icon(paused ? "play" : "pause")} ${paused ? "Play" : "Pause"} animation`;
    };
    button.addEventListener("click", () => {
      marquee.classList.toggle("is-paused");
      update();
    });
    update();
    marquee.after(button);
  }

  /* ---------- Avatars ---------- */

  // Same initials, same color, on every page: a hue from 0 to 359 derived from the text
  function colorAvatar(avatar) {
    if (avatar.tagName === "IMG" || avatar.style.getPropertyValue("--hue")) return;
    const text = avatar.textContent.trim();
    if (!text) return;
    let hash = 0;
    for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    // Multiplying by the golden angle spreads similar initials (AP, AS) far apart on the color wheel
    avatar.style.setProperty("--hue", Math.round((hash * 137.508) % 360));
  }

  /* ---------- Wire everything up ---------- */

  let revealObserver = null;

  const reveal = (el) => {
    if (el.hasAttribute("data-reveal")) el.classList.add("is-visible");
    if (el.hasAttribute("data-count-to")) countUp(el);
  };

  /* Sets up every component inside root. Runs once for the page, then again for any
     element added later (render(), innerHTML, append), so markup rendered by your own
     code gets tabs, validation, reveal and the rest without extra calls. */
  function enhance(root) {
    const all = (selector) => [...(root.matches(selector) ? [root] : []), ...root.querySelectorAll(selector)];

    if (all("[data-theme-toggle]").length) updateThemeButtons();
    all("[data-tabs]").forEach(setupTabs);
    all("form[data-validate]").forEach((form) => form.setAttribute("novalidate", ""));
    all("[data-marquee]").forEach(setupMarquee);
    all(".avatar").forEach(colorAvatar);
    VWA.fillPlaceholders?.(root);

    // Reveal on scroll and count up
    all("[data-reveal-group]").forEach((group) => {
      group.querySelectorAll("[data-reveal]").forEach((el, i) => el.style.setProperty("--delay", `${i * 90}ms`));
    });
    all("[data-reveal], [data-count-to]").forEach((el) => {
      if (!revealObserver) return reveal(el);
      if (el.hasAttribute("data-count-to") && !reducedMotion()) el.textContent = countFormat(el)(0);
      revealObserver.observe(el);
    });
  }

  function init() {
    // The live region exists before the first toast, so screen readers announce that toast too
    toastRegion();

    if ("IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            reveal(entry.target);
            revealObserver.unobserve(entry.target);
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
      );
    }

    updateThemeButtons();
    enhance(document.body);

    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && !node.closest(".toast-region")) enhance(node);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* One listener per event type on the document handles every component,
     including components added to the page later (event delegation). */

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest("[data-theme-toggle]")) VWA.theme.toggle();

    const navToggle = target.closest("[data-nav-toggle]");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", String(navToggle.getAttribute("aria-expanded") !== "true"));
    } else if (target.closest(".navbar-links a")) {
      target.closest(".navbar")?.querySelector("[data-nav-toggle]")?.setAttribute("aria-expanded", "false");
    }

    const opener = target.closest("[data-dialog-open]");
    if (opener) VWA.dialog.open(opener.dataset.dialogOpen);

    const closer = target.closest("[data-dialog-close]");
    if (closer) closer.closest("dialog")?.close();

    // A click on the dialog element itself but outside its box is a click on the backdrop
    if (target instanceof HTMLDialogElement && target.open) {
      const box = target.getBoundingClientRect();
      const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      if (!inside && !target.hasAttribute("data-static")) target.close();
    }

    const tab = target.closest('[data-tabs] [role="tab"]');
    if (tab) selectTab(tab, { notify: true });

    // Close open dropdowns when clicking outside them or on one of their items
    document.querySelectorAll("details[data-dropdown][open]").forEach((dropdown) => {
      const clickedInside = dropdown.contains(target);
      const clickedItem = target.closest(".dropdown-menu a, .dropdown-menu button");
      if (!clickedInside || (clickedItem && dropdown.contains(clickedItem))) dropdown.open = false;
    });

    const copier = target.closest("[data-copy]");
    if (copier) {
      const value = copier.dataset.copy;
      const text = value.startsWith("#") ? document.querySelector(value)?.textContent ?? "" : value;
      copyText(text).then(() => VWA.toast("Copied to clipboard", { type: "success", duration: 2000 }));
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll("details[data-dropdown][open]").forEach((dropdown) => {
        dropdown.open = false;
        dropdown.querySelector("summary")?.focus();
      });
      document.querySelectorAll('[data-nav-toggle][aria-expanded="true"]').forEach((toggle) => {
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      });
      // WCAG 1.4.13: a tooltip can be dismissed without moving the pointer or focus
      document.querySelectorAll("[data-tooltip]:hover, [data-tooltip]:focus-visible").forEach((el) => {
        el.classList.add("is-tooltip-dismissed");
        const restore = () => el.classList.remove("is-tooltip-dismissed");
        el.addEventListener("pointerleave", restore, { once: true });
        el.addEventListener("blur", restore, { once: true });
      });
    }

    const tab = event.target instanceof Element && event.target.closest('[data-tabs] [role="tab"]');
    if (tab) {
      const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
      const index = tabs.indexOf(tab);
      const next = {
        ArrowRight: tabs[(index + 1) % tabs.length],
        ArrowLeft: tabs[(index - 1 + tabs.length) % tabs.length],
        Home: tabs[0],
        End: tabs[tabs.length - 1],
      }[event.key];
      if (next) {
        event.preventDefault();
        selectTab(next, { focus: true, notify: true });
      }
    }
  });

  // Opening one dropdown closes the others
  document.addEventListener(
    "toggle",
    (event) => {
      const opened = event.target;
      if (!(opened instanceof HTMLDetailsElement) || !opened.matches("[data-dropdown]") || !opened.open) return;
      document.querySelectorAll("details[data-dropdown][open]").forEach((other) => {
        if (other !== opened) other.open = false;
      });
    },
    true
  );

  // Submit guard. This listener runs in the capture phase, before your own submit
  // listener. It stops a second submit while the first one is still busy (Enter pressed
  // twice), and it stops invalid data-validate forms from reaching your listener.
  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      const stop = () => {
        event.preventDefault();
        event.stopImmediatePropagation();
      };
      if (form.querySelector('[type="submit"][aria-busy="true"], button:not([type])[aria-busy="true"]')) return stop();
      if (!form.matches("form[data-validate]")) return;
      if (!VWA.validate(form)) stop();
    },
    true
  );

  // After the first error, re-check a field as the user fixes it
  const recheck = (event) => {
    const field = event.target;
    if (!(field instanceof Element) || !field.closest("form[data-validate]") || !field.willValidate) return;
    if (event.type === "focusout" && field.value === "") return; // do not shout at someone who just tabbed past
    if (event.type === "input" && field.getAttribute("aria-invalid") !== "true") return;
    validateField(field);
  };
  document.addEventListener("input", recheck);
  document.addEventListener("focusout", recheck);

  // Spotlight: --x and --y follow the pointer
  document.addEventListener("pointermove", (event) => {
    const el = event.target instanceof Element && event.target.closest("[data-spotlight]");
    if (!el) return;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--x", `${event.clientX - box.left}px`);
    el.style.setProperty("--y", `${event.clientY - box.top}px`);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
