/**
 * Frontend script — initializes all NFT Split canvases on the page.
 */
import { renderCanvas } from "./canvas-engine";

document.addEventListener("DOMContentLoaded", () => {
  const canvases = document.querySelectorAll(".nft-split-canvas");

  canvases.forEach((canvas) => {
    const attrs = JSON.parse(canvas.dataset.config || "{}");
    const state = { mouseProgress: 0, targetProgress: 0, tree: null };

    function draw() {
      renderCanvas(canvas, attrs, state);
      requestAnimationFrame(draw);
    }

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width,
        h = rect.height;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cx = w / 2,
        cy = h / 2;
      const maxDist = Math.max(w, h) / 2;
      const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
      const normalized = 1 - Math.min(dist / maxDist, 1);
      state.targetProgress = Math.pow(normalized, attrs.mousePower);
    });

    canvas.addEventListener("mouseleave", () => {
      state.targetProgress = 0;
    });

    canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const w = rect.width,
          h = rect.height;
        const mx = touch.clientX - rect.left;
        const my = touch.clientY - rect.top;
        const cx = w / 2,
          cy = h / 2;
        const maxDist = Math.max(w, h) / 2;
        const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
        const normalized = 1 - Math.min(dist / maxDist, 1);
        state.targetProgress = Math.pow(normalized, attrs.mousePower);
      },
      { passive: false },
    );

    canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const w = rect.width,
          h = rect.height;
        const mx = touch.clientX - rect.left;
        const my = touch.clientY - rect.top;
        const cx = w / 2,
          cy = h / 2;
        const maxDist = Math.max(w, h) / 2;
        const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
        const normalized = 1 - Math.min(dist / maxDist, 1);
        state.targetProgress = Math.pow(normalized, attrs.mousePower);
      },
      { passive: false },
    );

    canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
      state.targetProgress = 0;
    });

    requestAnimationFrame(draw);
  });
});
