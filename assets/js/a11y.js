(() => {
  "use strict";

  // Focus trap inside mobile nav when opened
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector(".nav-toggle");
  if (!nav || !toggle) return;

  const focusables = () =>
    nav.querySelectorAll('a[href], button:not([disabled])');

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    const nodes = Array.from(focusables());
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  });
})();
