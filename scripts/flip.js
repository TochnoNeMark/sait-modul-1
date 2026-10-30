(() => {
  const root = document.querySelector('.flip');
  if (!root) return;

  const pin = root.querySelector('.flip__pin');
  const lidTop = root.querySelector('.flip__lid--top');
  const [bandTop, lashTop] = lidTop.children;
  const [bandBottom, lashBottom] = root.querySelector('.flip__lid--bottom').children;
  const opening = root.querySelector('.flip__opening');

  const X0 = 876;
  const SEG = [
    [2.37382, 0, 22.3244, 22.2995, 56.0832, 38.2974, 84.59, 37.1509],
    [84.59, 37.1509, 113.097, 38.2974, 146.855, 22.2993, 166.805, 0]
  ];
  const UP = [
    [894.211, -12.36, -25.332], [915.329, -8.84, -25.417], [935.72, -2.844, -26.282], [959.654, 0, -27.042],
    [983.369, 2.912, -25.78], [1004.289, 11.127, -25.332], [1025.692, 14.533, -22.402]
  ];
  const CL = [
    [895.361, -14.584, 22.481], [916.739, -11.153, 25.388], [937.636, -2.915, 25.808], [961.346, 0, 27.034],
    [985.287, 2.838, 26.225], [1005.7, 8.811, 25.334], [1026.842, 12.308, 25.225]
  ];
  const R = 4.775;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const smooth = t => t * t * (3 - 2 * t);
  const sine = t => 0.5 - Math.cos(Math.PI * t) / 2;
  const f = n => Math.round(n * 100) / 100;

  const bz = (a, b, c, d, u) => {
    const r = 1 - u;
    return r * r * r * a + 3 * r * r * u * b + 3 * r * u * u * c + u * u * u * d;
  };
  const lut = [];
  SEG.forEach((g, gi) => {
    for (let k = gi ? 1 : 0; k <= 48; k++) {
      const u = k / 48;
      lut.push([bz(g[0], g[2], g[4], g[6], u), bz(g[1], g[3], g[5], g[7], u)]);
    }
  });
  const I = x => {
    x -= X0;
    if (x <= lut[0][0] || x >= lut[lut.length - 1][0]) return 0;
    let lo = 0;
    let hi = lut.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (lut[m][0] < x) lo = m;
      else hi = m;
    }
    const [x0, y0] = lut[lo];
    const [x1, y1] = lut[hi];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  };

  const band = (A, a) => {
    const P = (x, y, o = 0) => f(X0 + x) + ' ' + f(A + o + a * y);
    const [g, h] = SEG;
    const ext = -2.493 * a;
    const topEdge = `C${P(g[2], g[3])} ${P(g[4], g[5])} ${P(g[6], g[7])}C${P(h[2], h[3])} ${P(h[4], h[5])} ${P(h[6], h[7])}`;
    const bottomEdge = `C${P(h[4], h[5], 10)} ${P(h[2], h[3], 10)} ${P(h[0], h[1], 10)}C${P(g[4], g[5], 10)} ${P(g[2], g[3], 10)} ${P(g[0], g[1], 10)}`;
    if (a >= 0) {
      return `M${P(g[0], g[1])}${topEdge}L${f(X0 + 169)} ${f(A + 10 + ext)}L${P(h[6], h[7], 10)}${bottomEdge}L${f(X0 + 0.18)} ${f(A + 10 + ext)}Z`;
    }
    return `M${f(X0 + 0.18)} ${f(A + ext)}L${P(g[0], g[1])}${topEdge}L${f(X0 + 169)} ${f(A + ext)}L${P(h[6], h[7], 10)}${bottomEdge}Z`;
  };

  const lash = (bx, by, vx, vy) => {
    const len = Math.hypot(vx, vy) || 1e-6;
    const nx = (-vy / len) * R;
    const ny = (vx / len) * R;
    const tx = bx + vx;
    const ty = by + vy;
    return `M${f(bx + nx)} ${f(by + ny)}L${f(tx + nx)} ${f(ty + ny)}A${R} ${R} 0 0 0 ${f(tx - nx)} ${f(ty - ny)}L${f(bx - nx)} ${f(by - ny)}Z`;
  };

  const gap = (A, a) => {
    const top = [];
    const bottom = [];
    for (let k = 0; k <= 40; k++) {
      const x = X0 + 2.37382 + (164.431 * k) / 40;
      const i = I(x);
      const t = A + 10 + a * i;
      const b = A + i;
      if (b > t) {
        top.push(f(x) + ' ' + f(t));
        bottom.unshift(f(x) + ' ' + f(b));
      }
    }
    return top.length > 1 ? 'M' + top.join('L') + 'L' + bottom.join('L') + 'Z' : 'M0 0Z';
  };

  const eye = e => {
    const A = lerp(535, 503, e);
    const a = lerp(-1, 1, e);
    bandTop.setAttribute('d', band(A, a));
    lashTop.setAttribute('d', UP.map((u, k) => {
      const c = CL[k];
      const bx = lerp(u[0], c[0], e);
      return lash(bx, A + a * I(bx) + 5, lerp(u[1], c[1], e), lerp(u[2], c[2], e));
    }).join(''));
    lidTop.style.opacity = 1 - seg(e, 0.9, 1);
    bandBottom.setAttribute('d', band(A, 1));
    lashBottom.setAttribute('d', CL.map(c => lash(c[0], A + I(c[0]) + 5, c[1], c[2])).join(''));
    opening.setAttribute('d', gap(A, a));
  };

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
  const SKY = [hex('#dbdbdb'), hex('#282382')];
  const STAR = [hex('#dbdbdb'), hex('#ece4bd')];
  const paints = [...root.querySelectorAll('[data-paint]')].flatMap(el =>
    el.dataset.paint.split(';').map(s => {
      const [attr, a, b] = s.split(',');
      return a[0] === '#' ? { el, attr, a: hex(a), b: hex(b) } : { el, attr, n: [+a, +b] };
    })
  );

  const memo = {};
  const once = (key, value, fn) => {
    if (memo[key] === value) return;
    memo[key] = value;
    fn(value);
  };

  const render = p => {
    const night = smooth(seg(p, 0.2, 0.85));
    root.style.setProperty('--rot', f(180 * (1 - sine(p))));
    root.style.setProperty('--mini', f(smooth(seg(p, 0.15, 0.6))));
    once('night', night, t => {
      root.style.setProperty('--sky', mix(SKY[0], SKY[1], t));
      paints.forEach(q => q.el.setAttribute(q.attr, q.a ? mix(q.a, q.b, t) : String(f(lerp(q.n[0], q.n[1], t)))));
    });
    once('star', smooth(seg(p, 0.2, 0.6)), t => root.style.setProperty('--star', mix(STAR[0], STAR[1], t)));
    once('eye', smooth(seg(p, 0.05, 0.5)), eye);
  };

  let target = 0;
  let current = 0;
  let raf = 0;
  let prev = 0;

  const measure = () => {
    const span = root.offsetHeight - pin.offsetHeight;
    target = span > 0 ? clamp(-root.getBoundingClientRect().top / span) : 0;
  };

  const tick = now => {
    const dt = prev ? Math.min(64, now - prev) : 16.7;
    prev = now;
    const d = target - current;
    current = Math.abs(d) < 0.0005 ? target : current + d * (1 - Math.pow(0.82, dt / 16.7));
    render(current);
    if (current !== target) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
      prev = 0;
    }
  };

  const update = () => {
    measure();
    if (!raf) raf = requestAnimationFrame(tick);
  };

  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  measure();
  current = target;
  render(current);
})();
