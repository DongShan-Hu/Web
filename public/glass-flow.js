/* Animate the existing artwork, not the foreground interface or customer site.
   One texture pass; capped pixel density and frame rate; static art is always beneath. */
window.mountGlassFlow = function mountGlassFlow(hero) {
  const canvas = hero.querySelector('.glass-flow');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let gl, program, buffer, texture;
  let disposed = false, ready = false, visible = false, failed = false;
  let frame = 0, previous = 0, elapsed = 0, lastDraw = 0;
  const shaders = [];
  const source = new Image();
  const uniforms = {};

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
  }
  function sync() {
    const running = ready && visible && !reduced.matches && !document.hidden && !failed && !disposed;
    hero.dataset.flow = failed ? 'fallback' : reduced.matches ? 'reduced' : !ready ? 'loading' : running ? 'running' : 'paused';
    canvas.classList.toggle('is-ready', ready && !reduced.matches && !failed);
    if (running && !frame) frame = requestAnimationFrame(tick);
    if (!running) stop();
  }
  function fallback(error) {
    failed = true;
    stop();
    sync();
    console.warn('玻璃动效不可用，保留静态画面。', error?.message || 'WebGL unavailable');
  }
  function shader(type, code) {
    const value = gl.createShader(type);
    if (!value) throw new Error('Unable to allocate shader');
    shaders.push(value);
    gl.shaderSource(value, code);
    gl.compileShader(value);
    if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(value));
    return value;
  }
  function resize() {
    if (!ready || disposed || failed) return;
    const width = hero.clientWidth, height = hero.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, width < 800 ? 1 : 1.25);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const scale = Math.max(width / source.width, height / source.height);
    const cropX = width / (source.width * scale), cropY = height / (source.height * scale);
    gl.uniform2f(uniforms.crop, cropX, cropY);
    gl.uniform2f(uniforms.offset, (1 - cropX) * (width <= 800 ? .65 : .5), (1 - cropY) * .5);
    gl.uniform1f(uniforms.amplitude, width < 800 ? .7 : 1);
    draw();
  }
  function draw() {
    gl.uniform1f(uniforms.time, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function tick(now) {
    frame = 0;
    if (disposed || failed) return;
    if (previous) elapsed += Math.min((now - previous) / 1000, .08);
    previous = now;
    // 30 fps is sufficient for this deliberately slow material motion.
    if (now - lastDraw >= 1000 / 30) { draw(); lastDraw = now; }
    frame = requestAnimationFrame(tick);
  }
  function start() {
    if (ready || disposed || failed || reduced.matches) return;
    try {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
      if (!gl) throw new Error('WebGL unavailable');
      const vertex = shader(gl.VERTEX_SHADER, `
        attribute vec2 position;
        varying vec2 uv;
        void main() { uv = vec2(position.x * .5 + .5, .5 - position.y * .5); gl_Position = vec4(position, 0., 1.); }
      `);
      const fragment = shader(gl.FRAGMENT_SHADER, `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        varying vec2 uv;
        uniform sampler2D artwork;
        uniform vec2 crop;
        uniform vec2 offset;
        uniform float time;
        uniform float amplitude;
        void main() {
          vec2 p = uv * crop + offset;
          float t = time * .38;
          // Travelling, overlapping currents: no full-image zoom or periodic reset.
          float region = smoothstep(.18, .67, p.x);
          vec2 current = vec2(
            sin(p.y * 9. - t + sin(p.x * 5. + t * .43)) + .38 * sin(p.y * 19. + t * .72),
            cos(p.x * 7. - t * .8 + sin(p.y * 6. - t * .46)) + .3 * sin(p.x * 17. - t * .58)
          );
          vec2 bend = current * vec2(.019, .024) * region * amplitude;
          vec2 q = clamp(p + bend, vec2(.003), vec2(.997));
          vec3 color = texture2D(artwork, q).rgb;
          // Light travels on the original bright glass edges rather than drawing new shapes.
          float edge = smoothstep(.22, .82, max(color.r, max(color.g, color.b)));
          float path = p.x * 8. - p.y * 5. + sin(p.y * 5.) * 1.2 - t * 1.25;
          float light = pow(.5 + .5 * sin(path), 5.);
          vec2 dispersion = bend * .018 * edge;
          color.r = texture2D(artwork, clamp(q + dispersion, .002, .998)).r;
          color.b = texture2D(artwork, clamp(q - dispersion, .002, .998)).b;
          color *= 1. + region * edge * (.22 * light - .04);
          color += vec3(.025, .035, .065) * light * edge * region;
          gl_FragColor = vec4(color, 1.);
        }
      `);
      program = gl.createProgram();
      gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      for (const name of ['crop','offset','time','amplitude']) uniforms[name] = gl.getUniformLocation(program, name);
      gl.uniform1i(gl.getUniformLocation(program, 'artwork'), 0);
      if (gl.getError() !== gl.NO_ERROR) throw new Error('Texture initialization failed');
      ready = true;
      resize(); sync();
    } catch (error) { fallback(error); }
  }
  function preferenceChanged() { if (source.complete && source.naturalWidth) start(); sync(); }
  function contextLost(event) { event.preventDefault(); fallback(new Error('Graphics context lost')); }
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
  const sizing = new ResizeObserver(resize);
  observer.observe(hero); sizing.observe(hero);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', preferenceChanged);
  canvas.addEventListener('webglcontextlost', contextLost);
  source.onload = start;
  source.onerror = () => fallback(new Error('Artwork failed to load'));
  source.src = 'assets/studio-glass-background.png';
  sync();
  return () => {
    disposed = true; stop(); observer.disconnect(); sizing.disconnect();
    source.onload = source.onerror = null;
    document.removeEventListener('visibilitychange', sync);
    reduced.removeEventListener('change', preferenceChanged);
    canvas.removeEventListener('webglcontextlost', contextLost);
    if (gl) {
      gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
      shaders.forEach(value => gl.deleteShader(value));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  };
};
