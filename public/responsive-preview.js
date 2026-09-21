/* A real, opt-in viewport demonstration. Customer files remain independent. */
(() => {
  'use strict';

  const mounted = new WeakMap();
  let sequence = 0;
  const MIN_WIDTH = 360;
  const MAX_WIDTH = 1440;
  const STEP = 10;

  window.mountResponsivePreview = (root = document) => {
    const lab = root.matches?.('[data-responsive-lab]') ? root : root.querySelector('[data-responsive-lab]');
    if (!lab) return () => {};
    if (mounted.has(lab)) return mounted.get(lab);

    const launch = lab.querySelector('[data-preview-launch]');
    const workbench = lab.querySelector('[data-preview-workbench]');
    if (!launch || !workbench) return () => {};

    const id = `responsive-preview-${++sequence}`;
    const lifecycle = new AbortController();
    const { signal } = lifecycle;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let session = null;
    let frame = null;
    let observer = null;
    let loadTimer = 0;
    let resizeFrame = 0;
    let widthFrame = 0;
    let targetWidth = null;
    let generation = 0;
    let opened = false;
    let disposed = false;
    let width = 1440;
    let scale = 1;
    let drag = null;

    workbench.id = id;
    workbench.hidden = true;
    workbench.innerHTML = `
      <div class="preview-controls">
        <div class="preview-presets" role="group" aria-label="选择预览屏幕">
          <button type="button" data-preview-width="390" aria-pressed="false">手机 <span>390</span></button>
          <button type="button" data-preview-width="768" aria-pressed="false">平板 <span>768</span></button>
          <button type="button" data-preview-width="1440" aria-pressed="true">桌面 <span>1440</span></button>
        </div>
        <div class="preview-width-control">
          <label for="${id}-width">屏幕宽度</label>
          <input id="${id}-width" type="range" min="360" max="1440" step="1" value="1440" aria-describedby="${id}-hint">
          <output for="${id}-width" aria-live="off"><span data-preview-output>1440</span><span class="preview-unit">px</span></output>
        </div>
        <button class="preview-close" type="button" data-preview-close aria-label="关闭实时预览">收起 <span aria-hidden="true">×</span></button>
      </div>
      <div class="preview-stage" data-preview-stage>
        <div class="preview-viewport" data-preview-viewport hidden>
          <div class="preview-frame-host" data-preview-host></div>
          <div class="preview-resize-handle" data-preview-handle role="slider" tabindex="0" aria-label="调整预览宽度" aria-valuemin="360" aria-valuemax="1440" aria-valuenow="1440" aria-orientation="horizontal" aria-describedby="${id}-hint"><span aria-hidden="true"></span></div>
        </div>
        <div class="preview-message" data-preview-message>
          <span class="preview-status-dot" aria-hidden="true"></span>
          <p data-preview-status role="status" aria-live="polite"></p>
          <button class="preview-retry" type="button" data-preview-retry hidden>重新加载 <span aria-hidden="true">↻</span></button>
        </div>
      </div>
      <div class="preview-footnote">
        <p id="${id}-hint">拖动右侧把手，或调整上方滑杆。页面可以滚动、点击；宽屏会按比例缩小展示。</p>
        <a href="/sites/zhang-hong/" target="_blank" rel="noopener">独立打开作品集 <span aria-hidden="true">↗</span></a>
      </div>`;

    const range = workbench.querySelector('input');
    const output = workbench.querySelector('[data-preview-output]');
    const stage = workbench.querySelector('[data-preview-stage]');
    const viewport = workbench.querySelector('[data-preview-viewport]');
    const host = workbench.querySelector('[data-preview-host]');
    const handle = workbench.querySelector('[data-preview-handle]');
    const message = workbench.querySelector('[data-preview-message]');
    const status = workbench.querySelector('[data-preview-status]');
    const retry = workbench.querySelector('[data-preview-retry]');
    const presets = [...workbench.querySelectorAll('[data-preview-width]')];
    launch.setAttribute('aria-controls', id);
    launch.setAttribute('aria-expanded', 'false');

    function fitViewport() {
      resizeFrame = 0;
      if (!opened || disposed || !lab.isConnected) return;
      const available = Math.max(1, stage.clientWidth - 56);
      const height = Math.max(1, stage.clientHeight - 40);
      scale = Math.min(1, available / width);
      viewport.style.width = `${width * scale}px`;
      viewport.style.height = `${height}px`;
      if (frame) {
        frame.style.width = `${width}px`;
        frame.style.height = `${Math.ceil(height / scale)}px`;
        frame.style.transform = `scale(${scale})`;
      }
    }

    function scheduleFit() {
      if (!resizeFrame && opened) resizeFrame = requestAnimationFrame(fitViewport);
    }

    function setWidth(value, snap = true) {
      const bounded = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, value));
      width = snap ? Math.round(bounded / STEP) * STEP : bounded;
      // Preserve exact presets (including 768) in both the control and viewport.
      range.value = String(width);
      output.textContent = String(width);
      handle.setAttribute('aria-valuenow', String(width));
      handle.setAttribute('aria-valuetext', `${width} 像素`);
      presets.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.previewWidth) === width)));
      fitViewport();
    }

    function stopWidthMotion() {
      cancelAnimationFrame(widthFrame);
      widthFrame = 0;
      targetWidth = null;
    }

    function transitionWidth(value) {
      stopWidthMotion();
      if (reducedMotion.matches || width === value) {
        setWidth(value, false);
        return;
      }
      const startWidth = width;
      const start = performance.now();
      targetWidth = value;
      const tick = (now) => {
        widthFrame = 0;
        if (!opened || disposed) return;
        const t = Math.min(1, (now - start) / 440);
        setWidth(Math.round(startWidth + (value - startWidth) * (1 - Math.pow(1 - t, 3))), false);
        if (t < 1) widthFrame = requestAnimationFrame(tick);
        else targetWidth = null;
      };
      widthFrame = requestAnimationFrame(tick);
    }

    function endDrag() {
      if (!drag) return;
      const pointerId = drag.pointerId;
      drag = null;
      lab.classList.remove('is-resizing-preview');
      if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
    }

    function releaseFrame() {
      generation += 1;
      clearTimeout(loadTimer);
      loadTimer = 0;
      session?.abort();
      session = null;
      endDrag();
      frame?.remove();
      frame = null;
      viewport.hidden = true;
      stage.setAttribute('aria-busy', 'false');
    }

    function loadPreview() {
      if (!opened || disposed || !lab.isConnected) return;
      releaseFrame();
      const token = generation;
      session = new AbortController();
      const active = () => opened && !disposed && token === generation && lab.isConnected;
      message.hidden = false;
      retry.hidden = true;
      status.textContent = '正在打开游戏灯光师 Z 女士的真实作品集，图片和交互将随页面一起加载。';
      stage.dataset.state = 'loading';
      stage.setAttribute('aria-busy', 'true');

      const fail = () => {
        if (!active()) return;
        releaseFrame();
        stage.dataset.state = 'error';
        message.hidden = false;
        status.textContent = '作品集暂时未能加载。可以重试，或使用下方链接独立打开。';
        retry.hidden = false;
      };

      const next = document.createElement('iframe');
      next.className = 'preview-live-frame';
      next.title = '游戏灯光师 Z 女士作品集：可调整屏幕宽度的实时预览';
      next.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads');
      next.setAttribute('referrerpolicy', 'same-origin');
      next.addEventListener('load', () => {
        if (!active()) return;
        try {
          // iframe load also fires for HTTP errors; verify the actual client page.
          if (!next.contentDocument?.querySelector('#hero-title') || !next.contentWindow.location.pathname.startsWith('/sites/zhang-hong/')) {
            fail();
            return;
          }
        } catch {
          fail();
          return;
        }
        clearTimeout(loadTimer);
        loadTimer = 0;
        viewport.hidden = false;
        message.hidden = true;
        stage.dataset.state = 'ready';
        stage.setAttribute('aria-busy', 'false');
        fitViewport();
      }, { signal: session.signal });
      next.addEventListener('error', fail, { signal: session.signal });
      frame = next;
      next.src = '/sites/zhang-hong/';
      host.append(next);
      fitViewport();
      loadTimer = window.setTimeout(fail, 20000);
    }

    function closePreview(restoreFocus = true) {
      if (!opened) return;
      opened = false;
      stopWidthMotion();
      releaseFrame();
      observer?.disconnect();
      observer = null;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = 0;
      workbench.hidden = true;
      launch.setAttribute('aria-expanded', 'false');
      if (restoreFocus && launch.isConnected) launch.focus({ preventScroll: true });
    }

    function openPreview() {
      if (disposed || opened) return;
      opened = true;
      workbench.hidden = false;
      launch.setAttribute('aria-expanded', 'true');
      observer = new ResizeObserver(scheduleFit);
      observer.observe(stage);
      loadPreview();
      range.focus({ preventScroll: true });
    }

    launch.addEventListener('click', () => opened ? closePreview() : openPreview(), { signal });
    workbench.querySelector('[data-preview-close]').addEventListener('click', () => closePreview(), { signal });
    retry.addEventListener('click', loadPreview, { signal });
    range.addEventListener('input', () => { stopWidthMotion(); setWidth(Number(range.value), false); }, { signal });
    presets.forEach(button => button.addEventListener('click', () => transitionWidth(Number(button.dataset.previewWidth)), { signal }));
    reducedMotion.addEventListener('change', () => {
      if (!reducedMotion.matches || targetWidth === null) return;
      const nextWidth = targetWidth;
      stopWidthMotion();
      setWidth(nextWidth, false);
    }, { signal });
    workbench.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePreview();
      }
    }, { signal });
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !opened || stage.dataset.state !== 'ready') return;
      event.preventDefault();
      stopWidthMotion();
      handle.focus({ preventScroll: true });
      drag = { pointerId: event.pointerId, startX: event.clientX, startWidth: width, scale };
      handle.setPointerCapture(event.pointerId);
      lab.classList.add('is-resizing-preview');
    }, { signal });
    handle.addEventListener('pointermove', event => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      // The viewport is centered: each edge travels half the width difference.
      setWidth(drag.startWidth + 2 * (event.clientX - drag.startX) / drag.scale);
    }, { signal });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => handle.addEventListener(type, endDrag, { signal }));
    handle.addEventListener('keydown', event => {
      const offsets = { ArrowLeft: -STEP, ArrowDown: -STEP, ArrowRight: STEP, ArrowUp: STEP, PageDown: -100, PageUp: 100 };
      if (event.key in offsets) {
        event.preventDefault();
        stopWidthMotion();
        setWidth(width + offsets[event.key]);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        stopWidthMotion();
        setWidth(event.key === 'Home' ? MIN_WIDTH : MAX_WIDTH);
      }
    }, { signal });

    const cleanup = () => {
      if (disposed) return;
      closePreview(false);
      disposed = true;
      lifecycle.abort();
      workbench.replaceChildren();
      launch.removeAttribute('aria-controls');
      launch.removeAttribute('aria-expanded');
      mounted.delete(lab);
    };
    mounted.set(lab, cleanup);
    return cleanup;
  };
})();
