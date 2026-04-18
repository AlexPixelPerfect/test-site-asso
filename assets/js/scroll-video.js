(() => {
  "use strict";

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  document.querySelectorAll(".scroll-video").forEach((section) => {
    const canvas = section.querySelector(".scroll-video__canvas");
    const ctx = canvas.getContext("2d");
    const loadingEl = section.querySelector(".scroll-video__loading");
    const barEl = section.querySelector(".scroll-video__loading-bar");

    const frameDir = section.dataset.frameDir;
    const frameCount = parseInt(section.dataset.frameCount, 10);
    const padLength = parseInt(section.dataset.framePad || "4", 10);
    const frameExt = section.dataset.frameExt || "webp";

    if (!frameDir || !frameCount) return;

    // Build source paths
    const srcs = Array.from({ length: frameCount }, (_, i) => {
      const num = String(i + 1).padStart(padLength, "0");
      return `${frameDir}/frame-${num}.${frameExt}`;
    });

    // --- Reduced motion: bail early, CSS shows <video> fallback ---
    if (reducedMotion.matches) return;

    const images = new Array(frameCount);
    let loaded = 0;
    let ready = false;
    let currentFrame = -1;
    let isVisible = false;
    let rafId = null;

    const chapters = Array.from(
      section.querySelectorAll(".scroll-video__chapter")
    ).map((el) => ({
      el,
      start: parseFloat(el.dataset.start),
      end: parseFloat(el.dataset.end),
      active: false,
    }));

    function updateChapters(progress) {
      for (const c of chapters) {
        const shouldBeActive = progress >= c.start && progress < c.end;
        if (shouldBeActive !== c.active) {
          c.el.classList.toggle("is-active", shouldBeActive);
          c.active = shouldBeActive;
        }
      }
    }

    // --- Image preloader (batched) ---
    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    }

    async function preloadAll() {
      const batchSize = 15;

      // Load first frame immediately for instant visual feedback
      try {
        images[0] = await loadImage(srcs[0]);
        loaded = 1;
        sizeCanvas(images[0]);
        drawFrame(0);
      } catch (_) { /* first frame failed */ }

      // Load remaining frames in batches
      for (let i = 1; i < srcs.length; i += batchSize) {
        const batch = srcs.slice(i, i + batchSize).map((src, j) =>
          loadImage(src).then((img) => {
            images[i + j] = img;
            loaded++;
            const pct = Math.round((loaded / frameCount) * 100);
            if (barEl) barEl.style.setProperty("--sv-progress", pct + "%");
          }).catch(() => { loaded++; })
        );
        await Promise.all(batch);
      }

      ready = true;
      if (loadingEl) loadingEl.dataset.loaded = "true";
    }

    // --- Canvas sizing ---
    function sizeCanvas(img) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }

    // --- Draw a specific frame ---
    function drawFrame(index) {
      const img = images[index];
      if (!img) return;
      if (canvas.width !== img.naturalWidth) sizeCanvas(img);
      ctx.drawImage(img, 0, 0);
      currentFrame = index;
    }

    // --- Scroll to frame mapping ---
    function onScroll() {
      if (!isVisible || !ready) return;

      const rect = section.getBoundingClientRect();
      const sectionH = section.offsetHeight;
      const viewH = window.innerHeight;
      const scrolled = -rect.top;
      const scrollable = sectionH - viewH;

      if (scrollable <= 0) return;

      const progress = Math.max(0, Math.min(1, scrolled / scrollable));
      const frameIndex = Math.min(
        frameCount - 1,
        Math.floor(progress * frameCount)
      );

      if (frameIndex !== currentFrame) {
        drawFrame(frameIndex);
      }

      updateChapters(progress);
      section.style.setProperty("--sv-progress", progress.toFixed(3));
    }

    // --- rAF scroll loop (only active when section is visible) ---
    function loop() {
      onScroll();
      if (isVisible) rafId = requestAnimationFrame(loop);
    }

    // --- IntersectionObserver to activate/deactivate the loop ---
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && rafId === null) {
            rafId = requestAnimationFrame(loop);
          } else if (!isVisible && rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        });
      },
      { threshold: 0 }
    );
    io.observe(section);

    // --- Handle resize ---
    window.addEventListener("resize", () => {
      if (images[currentFrame]) {
        sizeCanvas(images[currentFrame]);
        drawFrame(currentFrame);
      }
    });

    // --- Handle reduced-motion toggle at runtime ---
    reducedMotion.addEventListener("change", (e) => {
      if (e.matches) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        io.unobserve(section);
      }
    });

    // Start preloading
    preloadAll();
  });
})();
