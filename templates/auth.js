/* Sign-in page: show/hide password, password strength meter, fake submit. */
(function () {
  "use strict";

  const { $, on, icon, sleep, toast } = VWA;

  // auth.html#signup opens the "Create account" tab (the landing page links here)
  const openTabFromHash = () => {
    if (location.hash === "#signup") $("#tab-signup").click();
    if (location.hash === "#signin") $("#tab-signin").click();
  };
  openTabFromHash();
  on(window, "hashchange", openTabFromHash);

  // Show or hide the password. aria-pressed tells screen readers the button's state.
  on(document, "click", "[data-toggle-password]", (event, button) => {
    const input = button.parentElement.querySelector("input");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.setAttribute("aria-pressed", String(show));
    button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    button.innerHTML = String(icon(show ? "lock" : "eye"));
  });

  // A rough strength score: length plus variety of character types.
  // The word next to the bar carries the meaning, so it does not depend on color,
  // and the password field points to it with aria-describedby.
  const LEVELS = [
    { upTo: 49, word: "Weak", color: "var(--danger)", textClass: "text-danger" },
    { upTo: 79, word: "Okay", color: "var(--warning)", textClass: "text-warning" },
    { upTo: 100, word: "Strong", color: "var(--success)", textClass: "text-success" },
  ];

  on("#signup-password", "input", (event) => {
    const value = event.target.value;
    const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter((pattern) => pattern.test(value)).length;
    const score = value ? Math.min(100, value.length * 6 + variety * 10) : 0;
    const level = LEVELS.find((item) => score <= item.upTo);

    const meter = $("#strength");
    meter.style.setProperty("--value", `${score}%`);
    meter.querySelector("span").style.backgroundColor = level.color;

    const word = $("#strength-text");
    word.textContent = value ? `Strength: ${level.word}` : "";
    word.className = `text-sm font-semibold nowrap ${value ? level.textClass : ""}`;
  });

  // ui.js only lets valid forms through, and ignores a second submit while the button
  // is busy. A real app would call VWA.http.post here.
  async function fakeSubmit(event, message) {
    event.preventDefault();
    const button = event.target.querySelector('[type="submit"]');
    button.setAttribute("aria-busy", "true");
    await sleep(900);
    toast(message, { type: "success" });
    await sleep(700);
    location.href = "dashboard.html";
  }

  on("#signin-form", "submit", (event) => fakeSubmit(event, "Signed in. Opening your dashboard."));
  on("#signup-form", "submit", (event) => fakeSubmit(event, "Account created. Welcome to Nimbus!"));
})();
