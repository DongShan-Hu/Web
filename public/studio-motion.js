/* Motion follows input and reading order. No perpetual pointer animation loop. */
(() => {
  window.mountStudioMotion = (root) => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const controller = new AbortController();
    const { signal } = controller;
    const animations = new Set();
    const pending = new Set();
    let observer;
    let frame = 0;
    let pointer = null;
    let alive = true;

    const animate = (node, keyframes, options) => {
      const animation = node.animate(keyframes, options);
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    };

    // Keep text visible until it intersects; animate only modest visual offsets.
    const targets = root.querySelectorAll('.editorial-heading, .showcase-case-head, .craft-screen, .craft-description, .responsive-lab, .craft-feature-media, .craft-feature-type, .process-preview, .process-accordion, .decision-heading, .service-options > a, .studio-final > div, .page-heading, .case-card, .plan-card');
    const reveal = () => {
      observer?.disconnect();
      if (reduce.matches) {
        pending.clear();
        return;
      }
      observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting || !pending.has(target)) return;
          pending.delete(target);
          observer.unobserve(target);
          animate(target, [
            { opacity: 0.5, translate: '0 16px' },
            { opacity: 1, translate: '0 0' }
          ], { duration: 660, easing: 'cubic-bezier(.2,.7,.2,1)' });
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });
      pending.forEach((node) => observer.observe(node));
    };
    targets.forEach((node) => pending.add(node));
    reveal();

    const scene = root.querySelector('.studio-scene');
    const desktop = scene?.querySelector('.studio-desktop');
    const phone = scene?.querySelector('.studio-phone');
    const resetPointer = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      desktop?.style.removeProperty('translate');
      phone?.style.removeProperty('translate');
      scene?.classList.remove('is-tracking');
    };
    if (scene) {
      scene.addEventListener('pointermove', (event) => {
        if (reduce.matches || !fine.matches || event.pointerType === 'touch') return;
        pointer = { x: event.clientX, y: event.clientY };
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (!alive || !pointer) return;
          const rect = scene.getBoundingClientRect();
          const x = Math.max(-1, Math.min(1, (pointer.x - rect.left) / rect.width * 2 - 1));
          const y = Math.max(-1, Math.min(1, (pointer.y - rect.top) / rect.height * 2 - 1));
          scene.classList.add('is-tracking');
          desktop.style.translate = `${x * 5}px ${y * 4}px`;
          phone.style.translate = `${x * 11}px ${y * 8}px`;
        });
      }, { signal, passive: true });
      scene.addEventListener('pointerleave', resetPointer, { signal });
      scene.addEventListener('pointercancel', resetPointer, { signal });
    }

    const visibility = () => { if (document.hidden) resetPointer(); };
    document.addEventListener('visibilitychange', visibility, { signal });
    window.addEventListener('blur', resetPointer, { signal });
    const preference = () => {
      resetPointer();
      if (reduce.matches) {
        animations.forEach((animation) => animation.cancel());
        animations.clear();
      }
      reveal();
    };
    reduce.addEventListener('change', preference, { signal });
    fine.addEventListener('change', resetPointer, { signal });

    return () => {
      alive = false;
      controller.abort();
      observer?.disconnect();
      pending.clear();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      resetPointer();
    };
  };
})();
