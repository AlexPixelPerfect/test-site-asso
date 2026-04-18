(() => {
  "use strict";

  // -------- Mobile navigation --------
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("[data-nav]");
  if (toggle && nav) {
    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.setAttribute("data-open", "false");
      document.body.style.overflow = "";
    };
    const open = () => {
      toggle.setAttribute("aria-expanded", "true");
      nav.setAttribute("data-open", "true");
      document.body.style.overflow = "hidden";
    };
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      expanded ? close() : open();
    });
    nav.addEventListener("click", (e) => {
      if (e.target.matches("a")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        close();
        toggle.focus();
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 960) close();
    });
  }

  // -------- Highlight current nav link --------
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav__link").forEach((link) => {
    const target = link.getAttribute("href");
    if (target === here) link.setAttribute("aria-current", "page");
  });

  // -------- Animated counters --------
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const prefix = el.dataset.prefix || "";
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      if (reduce) {
        el.textContent = `${prefix}${target.toLocaleString("fr-FR")}${suffix}`;
        return;
      }
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = target * eased;
        el.textContent = `${prefix}${val.toLocaleString("fr-FR", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}${suffix}`;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((el) => io.observe(el));
  }

  // -------- Impact visualizer (faire-un-don) --------
  const impactAmounts = document.querySelectorAll("[data-amount]");
  const impactResult = document.querySelector("[data-impact-result]");
  const impactMap = {
    10: "finance 1 kit de sensibilisation distribué dans un établissement scolaire.",
    20: "finance la documentation pédagogique d'une journée de sensibilisation.",
    50: "contribue à l'organisation d'une journée d'information sur le don de moelle.",
    100: "soutient une famille de patient sur une semaine (transport, hébergement lors des soins).",
    250: "permet d'équiper un stand complet lors d'une Color Run solidaire.",
    500: "co-finance une campagne de sensibilisation au don de moelle dans une ville moyenne.",
  };
  if (impactAmounts.length && impactResult) {
    const select = (btn) => {
      impactAmounts.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      const amount = btn.dataset.amount;
      const msg = impactMap[amount] || "soutient nos missions au quotidien.";
      impactResult.innerHTML = `Votre don de <strong>${amount}\u00A0€</strong> ${msg}<br><small>Après déduction fiscale de 66\u00A0%, votre don ne vous coûte réellement que <strong>${(amount * 0.34).toFixed(2).replace(".", ",")}\u00A0€</strong>.</small>`;
    };
    impactAmounts.forEach((btn) => btn.addEventListener("click", () => select(btn)));
    const defaultBtn = document.querySelector('[data-amount="50"]');
    if (defaultBtn) select(defaultBtn);
  }

  // -------- Contact form (mailto fallback) --------
  const contactForm = document.querySelector("[data-contact-form]");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(contactForm);
      const name = (data.get("name") || "").toString().trim();
      const email = (data.get("email") || "").toString().trim();
      const subject = (data.get("subject") || "Message depuis le site").toString().trim();
      const message = (data.get("message") || "").toString().trim();
      if (!name || !email || !message) {
        alert("Merci de renseigner votre nom, votre email et votre message.");
        return;
      }
      const body = `Bonjour,\n\n${message}\n\n—\n${name}\n${email}`;
      const href = `mailto:contact@pourflavie.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      location.href = href;
    });
  }

  // -------- Next-event countdown --------
  const countdownEl = document.querySelector("[data-countdown]");
  if (countdownEl) {
    const target = new Date(countdownEl.dataset.countdown);
    if (!isNaN(target)) {
      const render = () => {
        const now = new Date();
        const diff = target - now;
        if (diff <= 0) {
          countdownEl.textContent = "L'événement a lieu aujourd'hui !";
          return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        countdownEl.innerHTML = `<strong>${d}</strong> j <strong>${h}</strong> h <strong>${m}</strong> min`;
      };
      render();
      setInterval(render, 60000);
    }
  }

  // -------- Year in footer --------
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
