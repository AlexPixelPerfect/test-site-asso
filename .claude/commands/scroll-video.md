# Scroll Video Animation

Transforme une vidéo courte en animation scroll-driven (style Apple AirPods) et l'intègre dans une page HTML du projet.

## Arguments

`$ARGUMENTS` doit être fourni sous la forme : `<video-path> <target-page> [options]`

Exemples :
- `/scroll-video assets/video/intro.mp4 index.html`
- `/scroll-video assets/video/demo.mp4 association.html --after=#missions --fps=15 --width=1280 --id=demo-scroll`

## Instructions

### Étape 1 : Parser les arguments

Parse `$ARGUMENTS` pour extraire :
- `<video-path>` (requis) : chemin vers la vidéo source (.mp4, .webm, .mov)
- `<target-page>` (requis) : fichier HTML cible dans lequel intégrer l'animation
- `--after=<selector>` (optionnel, défaut : insérer avant `</main>`) : sélecteur CSS de l'élément après lequel insérer la section
- `--fps=<number>` (optionnel, défaut : 12) : nombre d'images par seconde à extraire
- `--width=<pixels>` (optionnel, défaut : 1280) : largeur des frames en pixels
- `--quality=<1-100>` (optionnel, défaut : 80) : qualité WebP
- `--id=<string>` (optionnel, défaut : "scroll-video") : identifiant HTML de la section
- `--height-multiplier=<number>` (optionnel, défaut : 5) : hauteur du conteneur scroll en multiple de la hauteur du viewport

### Étape 2 : Valider les prérequis

1. Vérifie que `ffmpeg` est installé (`which ffmpeg` ou `where ffmpeg`). Si absent, indique à l'utilisateur comment l'installer :
   - Windows : `winget install ffmpeg` ou `choco install ffmpeg`
   - macOS : `brew install ffmpeg`
   - Linux : `sudo apt install ffmpeg`
2. Vérifie que le fichier vidéo existe
3. Vérifie que la page HTML cible existe

### Étape 3 : Extraire les frames avec ffmpeg

Exécute cette commande bash :

```bash
mkdir -p assets/frames/<id>
ffmpeg -i <video-path> -vf "fps=<fps>,scale=<width>:-2:flags=lanczos" -c:v libwebp -quality <quality> -compression_level 6 assets/frames/<id>/frame-%04d.webp
```

Remplace `<id>`, `<video-path>`, `<fps>`, `<width>` et `<quality>` par les valeurs parsées.

Après extraction :
- Compte le nombre total de frames extraites
- Calcule la taille totale approximative
- **Si plus de 300 frames** : avertis l'utilisateur et suggère de baisser le fps ou de couper la vidéo

### Étape 4 : Vérifier que `assets/js/scroll-video.js` existe

Le fichier `assets/js/scroll-video.js` contient le script d'animation scroll générique. S'il n'existe PAS encore dans le projet, crée-le avec le contenu suivant :

```javascript
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
      // Load first frame immediately for instant visual
      try {
        images[0] = await loadImage(srcs[0]);
        loaded = 1;
        sizeCanvas(images[0]);
        drawFrame(0);
      } catch (_) { /* first frame failed */ }

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

    // --- Scroll → frame mapping ---
    function onScroll() {
      if (!isVisible || !ready) return;

      const rect = section.getBoundingClientRect();
      const sectionH = section.offsetHeight;
      const viewH = window.innerHeight;
      const scrolled = -rect.top;
      const scrollable = sectionH - viewH;

      if (scrollable <= 0) return;

      const progress = Math.max(0, Math.min(1, scrolled / scrollable));
      const frameIndex = Math.min(frameCount - 1, Math.floor(progress * frameCount));

      if (frameIndex !== currentFrame) {
        drawFrame(frameIndex);
      }
    }

    // --- rAF scroll loop (only when visible) ---
    function loop() {
      onScroll();
      if (isVisible) rafId = requestAnimationFrame(loop);
    }

    // --- IntersectionObserver to activate/deactivate ---
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

    // --- Handle reduced-motion toggle ---
    reducedMotion.addEventListener("change", (e) => {
      if (e.matches) {
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
        io.unobserve(section);
      }
    });

    // Start preloading
    preloadAll();
  });
})();
```

S'il existe déjà, ne le recrée pas (il est générique et supporte plusieurs sections).

### Étape 5 : Vérifier le CSS dans `assets/css/components.css`

Vérifie si le bloc `/* ======= Scroll Video Animation ======= */` existe déjà dans `assets/css/components.css`. S'il n'existe PAS, ajoute-le à la fin du fichier :

```css
/* =======================================================
   Scroll Video Animation
   ======================================================= */
.scroll-video {
  padding: 0;
  position: relative;
}

.scroll-video__sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--c-ink);
  will-change: transform;
}

.scroll-video__canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
}

.scroll-video__loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  place-content: center;
  gap: var(--sp-3);
  background: var(--c-ink);
  z-index: 2;
  transition: opacity var(--dur-slow) var(--ease);
}

.scroll-video__loading[data-loaded="true"] {
  opacity: 0;
  pointer-events: none;
}

.scroll-video__loading-bar {
  width: clamp(120px, 30vw, 280px);
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--r-pill);
  overflow: hidden;
}

.scroll-video__loading-bar::after {
  content: "";
  display: block;
  height: 100%;
  width: var(--sv-progress, 0%);
  background: var(--c-brand);
  border-radius: var(--r-pill);
  transition: width 100ms linear;
}

.scroll-video__loading-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--fs-sm);
}

.scroll-video__fallback {
  display: none;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

@media (prefers-reduced-motion: reduce) {
  .scroll-video {
    height: auto;
    padding-block: 0;
  }
  .scroll-video__sticky {
    position: relative;
    height: auto;
    aspect-ratio: 16 / 9;
  }
  .scroll-video__canvas,
  .scroll-video__loading {
    display: none;
  }
  .scroll-video__fallback {
    display: block;
  }
}
```

S'il existe déjà, ne le duplique pas.

### Étape 6 : Intégrer dans la page HTML cible

1. **Insère la section HTML** à l'emplacement spécifié (après le sélecteur `--after`, ou avant `</main>` par défaut) :

```html
<section class="section scroll-video" id="<id>"
  style="height: calc(<height-multiplier> * 100vh)"
  data-frame-dir="assets/frames/<id>"
  data-frame-count="<NOMBRE_TOTAL_DE_FRAMES>"
  data-frame-pad="4"
  data-frame-ext="webp"
  aria-label="Animation vidéo défilante">
  <div class="scroll-video__sticky">
    <canvas class="scroll-video__canvas" aria-hidden="true"></canvas>
    <div class="scroll-video__loading" aria-live="polite">
      <div class="scroll-video__loading-bar"></div>
      <span class="scroll-video__loading-text">Chargement de l'animation…</span>
    </div>
    <video class="scroll-video__fallback" muted playsinline autoplay loop>
      <source src="<video-path>" type="video/mp4">
    </video>
  </div>
</section>
```

Remplace `<id>`, `<height-multiplier>`, `<NOMBRE_TOTAL_DE_FRAMES>` et `<video-path>` par les valeurs réelles.

2. **Ajoute le script** avant `</body>` s'il n'est pas déjà présent :
```html
<script src="assets/js/scroll-video.js" defer></script>
```

### Étape 7 : Rapport final

Affiche un résumé :
- Nombre de frames extraites
- Taille totale des frames
- Page modifiée et emplacement de la section
- Instructions de test : ouvrir la page dans un navigateur via un serveur local (`npx serve .` ou `python -m http.server 8000`), scroller pour vérifier l'animation
- Rappel : tester `prefers-reduced-motion` via DevTools > Rendering > Emulate CSS media feature
