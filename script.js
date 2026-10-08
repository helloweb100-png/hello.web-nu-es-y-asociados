/* ═══════════════════════════════════════════════════════════════
   NUÑEZ Y ASOCIADOS - Interacciones
   Vanilla JS, sin dependencias. Cada módulo es independiente y
   respeta prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ───────── CONFIGURACIÓN (editar aquí) ─────────
     Un solo lugar para el número de WhatsApp. Formato: código de país + lada + número,
     sin "+" ni espacios. Ejemplo México: 5215512345678                                  */
  var CONFIG = {
    whatsapp: '5215533821966',
    business: 'Núñez y Asociados'
  };

  var doc = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  function waUrl(message) {
    return 'https://wa.me/' + CONFIG.whatsapp + (message ? '?text=' + encodeURIComponent(message) : '');
  }

  /* ═══════════════════════════════
     ENLACES DE WHATSAPP
     Todo elemento con data-wa recibe el número y el mensaje predefinido.
     ═══════════════════════════════ */
  $$('[data-wa]').forEach(function (a) {
    a.href = waUrl(a.getAttribute('data-wa'));
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });

  /* ═══════════════════════════════
     DIVISIÓN DE TEXTO EN PALABRAS
     ═══════════════════════════════ */
  function splitWords(el, wrapClass, innerClass) {
    var index = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var outer = document.createElement('span');
            outer.className = wrapClass;
            if (innerClass) {
              var inner = document.createElement('span');
              inner.className = innerClass;
              inner.textContent = part;
              inner.style.setProperty('--wi', index++);
              outer.appendChild(inner);
            } else {
              outer.textContent = part;
            }
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(el);
  }

  $$('[data-split]').forEach(function (el) { splitWords(el, 'w', 'wi'); });
  $$('[data-words]').forEach(function (el) { splitWords(el, 'st-w'); });

  /* ═══════════════════════════════
     LOADER (spinner + cortina)
     ═══════════════════════════════ */
  (function initLoader() {
    var loader = $('#loader');
    if (!loader) { doc.classList.add('is-ready'); return; }

    var pct = $('#ldPct');
    var bar = $('#ldBar');
    var msg = $('#ldMsg');
    var minTime = reduceMotion ? 250 : 2400;
    var start = performance.now();
    var loaded = document.readyState === 'complete';
    var finished = false;
    var messages = [
      [0, 'Preparando tu información'],
      [.38, 'Validando cumplimiento'],
      [.72, 'Ordenando tus números'],
      [1, 'Todo listo']
    ];

    window.addEventListener('load', function () { loaded = true; });
    body.classList.add('is-locked');

    function pad(n) { return ('000' + n).slice(-3); }

    function finish() {
      if (finished) return;
      finished = true;
      loader.classList.add('is-done');
      body.classList.remove('is-locked');
      setTimeout(function () { doc.classList.add('is-ready'); }, reduceMotion ? 0 : 380);
      setTimeout(function () { loader.classList.add('is-gone'); }, reduceMotion ? 0 : 1300);
    }

    function frame(now) {
      if (finished) return;
      var t = clamp((now - start) / minTime, 0, 1);
      var eased = 1 - Math.pow(1 - t, 2.4);
      var p = loaded ? eased : Math.min(eased, .92);

      pct.textContent = pad(Math.round(p * 100));
      bar.style.setProperty('--p', p.toFixed(4));
      for (var i = messages.length - 1; i >= 0; i--) {
        if (p >= messages[i][0]) { if (msg.textContent !== messages[i][1]) msg.textContent = messages[i][1]; break; }
      }

      if (p >= 1) { setTimeout(finish, 260); return; }
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
    setTimeout(finish, 8000);      // red de seguridad: nunca bloquear el sitio
  })();

  /* ═══════════════════════════════
     HEADER: estado al hacer scroll + sección activa + progreso
     ═══════════════════════════════ */
  (function initHeader() {
    var header = $('#header');
    if (!header) return;

    if (hasIO) {
      var sentinel = document.createElement('span');
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:48px;pointer-events:none;';
      body.insertBefore(sentinel, body.firstChild);
      new IntersectionObserver(function (entries) {
        header.classList.toggle('is-stuck', !entries[0].isIntersecting);
      }).observe(sentinel);

      var links = {};
      $$('.nav a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var link = links[e.target.id];
          if (!link) return;
          if (e.isIntersecting) {
            Object.keys(links).forEach(function (k) { links[k].classList.remove('is-active'); });
            link.classList.add('is-active');
          } else {
            link.classList.remove('is-active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
    } else {
      header.classList.add('is-stuck');
    }

    /* Barra de progreso: CSS scroll-timeline donde existe; respaldo ligero donde no */
    var supportsTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
    if (!supportsTimeline) {
      var ticking = false;
      var update = function () {
        var max = doc.scrollHeight - window.innerHeight;
        doc.style.setProperty('--sp', max > 0 ? clamp(window.scrollY / max, 0, 1).toFixed(4) : 0);
        ticking = false;
      };
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }, { passive: true });
      update();
    }
  })();

  /* ═══════════════════════════════
     MENÚ MÓVIL
     ═══════════════════════════════ */
  (function initMobileNav() {
    var burger = $('#burger');
    var panel = $('#mnav');
    if (!burger || !panel) return;
    var closeTimer;

    function open() {
      clearTimeout(closeTimer);
      panel.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.add('is-open'); }); });
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Cerrar menú');
      body.classList.add('is-locked');
    }
    function close(returnFocus) {
      panel.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Abrir menú');
      body.classList.remove('is-locked');
      closeTimer = setTimeout(function () { panel.hidden = true; }, 750);
      if (returnFocus) burger.focus();
    }

    burger.addEventListener('click', function () {
      burger.getAttribute('aria-expanded') === 'true' ? close() : open();
    });
    $$('a', panel).forEach(function (a) { a.addEventListener('click', function () { close(); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') close(true);
    });
    window.matchMedia('(min-width: 1080px)').addEventListener('change', function (e) {
      if (e.matches && burger.getAttribute('aria-expanded') === 'true') close();
    });
  })();

  /* ═══════════════════════════════
     REVEAL AL HACER SCROLL
     ═══════════════════════════════ */
  (function initReveal() {
    var targets = $$('[data-reveal], [data-split]');
    if (!hasIO || reduceMotion) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add('is-in');
          io.unobserve(el);
          /* tras revelar, se libera el elemento para que sus hovers/transiciones propias funcionen */
          if (el.hasAttribute('data-reveal')) {
            var delay = (parseInt(el.style.getPropertyValue('--i'), 10) || 0) * 90 + 1300;
            setTimeout(function () { el.removeAttribute('data-reveal'); el.classList.remove('is-in'); }, delay);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      targets.forEach(function (el) { io.observe(el); });
    }

    /* Declaración: las palabras se iluminan conforme se hace scroll */
    var words = $$('.st-w');
    if (!hasIO || reduceMotion) {
      words.forEach(function (w) { w.classList.add('is-lit'); });
    } else {
      var wio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          e.target.classList.toggle('is-lit', e.isIntersecting || e.boundingClientRect.top < 0);
        });
      }, { rootMargin: '0px 0px -32% 0px' });
      words.forEach(function (w) { wio.observe(w); });
    }
  })();

  /* ═══════════════════════════════
     CONTADORES
     ═══════════════════════════════ */
  (function initCounters() {
    var els = $$('[data-count]');
    if (!els.length) return;

    function render(el, value) {
      el.textContent = (el.getAttribute('data-prefix') || '') + value.toLocaleString('es-MX') + (el.getAttribute('data-suffix') || '');
    }
    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      if (reduceMotion) { render(el, target); return; }
      var dur = 2200, t0 = null;
      requestAnimationFrame(function tick(ts) {
        if (!t0) t0 = ts;
        var p = clamp((ts - t0) / dur, 0, 1);
        render(el, Math.round((p === 1 ? 1 : 1 - Math.pow(2, -10 * p)) * target));
        if (p < 1) requestAnimationFrame(tick);
      });
    }

    if (!hasIO) { els.forEach(function (el) { render(el, parseInt(el.getAttribute('data-count'), 10) || 0); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ═══════════════════════════════
     HERO: titular con palabra rotatoria
     ═══════════════════════════════ */
  (function initCycle() {
    var words = $$('#cycle .cycle-w');
    if (words.length < 2 || reduceMotion) return;
    var idx = 0;

    function next() {
      var current = words[idx];
      idx = (idx + 1) % words.length;
      var incoming = words[idx];
      current.classList.remove('is-on');
      current.classList.add('is-out');
      incoming.classList.remove('is-out');
      incoming.classList.add('is-on');
      setTimeout(function () { current.classList.remove('is-out'); }, 950);
    }

    var started = false;
    var watcher = setInterval(function () {
      if (!doc.classList.contains('is-ready') || started) return;
      started = true;
      clearInterval(watcher);
      setTimeout(function () { setInterval(function () { if (!document.hidden) next(); }, 3300); }, 2600);
    }, 200);
  })();

  /* ═══════════════════════════════
     HERO: red de nodos animada (canvas)
     Nodos cuadrados (coherentes con la marca), pulsos de datos
     viajando por las conexiones y reacción al cursor.
     ═══════════════════════════════ */
  (function initNetwork() {
    var canvas = $('#net');
    var hero = $('#inicio');
    if (!canvas || !hero || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, LINK = 150, LINK2 = LINK * LINK, MOUSE_R = 190;
    var nodes = [], pulses = [];
    var raf = 0, last = 0, spawn = 0;
    var mouse = { x: 0, y: 0, on: false };

    function build() {
      var count = Math.round(Math.min((W * H) / 13000, W < 700 ? 34 : 80));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .36, vy: (Math.random() - .5) * .36,
          r: Math.random() * 1.5 + 1.1, hub: Math.random() < .13
        });
      }
      pulses = [];
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      LINK = W < 700 ? 110 : 150; LINK2 = LINK * LINK;
      build();
      if (reduceMotion) draw(1);
    }

    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d2, d;

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!reduceMotion) {
          a.x += a.vx * dt; a.y += a.vy * dt;
          if (a.x < -10) a.x = W + 10; else if (a.x > W + 10) a.x = -10;
          if (a.y < -10) a.y = H + 10; else if (a.y > H + 10) a.y = -10;
          if (mouse.on) {
            dx = mouse.x - a.x; dy = mouse.y - a.y; d = Math.sqrt(dx * dx + dy * dy);
            if (d < MOUSE_R && d > 1) { var pull = (1 - d / MOUSE_R) * .018 * dt; a.x += dx * pull; a.y += dy * pull; }
          }
        }
      }

      ctx.lineWidth = .8;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy;
          if (d2 < LINK2) {
            ctx.strokeStyle = 'rgba(10,77,216,' + ((1 - Math.sqrt(d2) / LINK) * .3).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }

      if (mouse.on) {
        for (i = 0; i < nodes.length; i++) {
          a = nodes[i]; dx = mouse.x - a.x; dy = mouse.y - a.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < MOUSE_R) {
            ctx.strokeStyle = 'rgba(27,102,245,' + ((1 - d / MOUSE_R) * .6).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
      }

      /* pulsos de datos */
      if (!reduceMotion) {
        spawn += dt;
        if (spawn > 34 && pulses.length < 7 && nodes.length > 4) {
          spawn = 0;
          var from = nodes[(Math.random() * nodes.length) | 0];
          for (j = 0; j < nodes.length; j++) {
            b = nodes[(Math.random() * nodes.length) | 0];
            dx = from.x - b.x; dy = from.y - b.y; d2 = dx * dx + dy * dy;
            if (b !== from && d2 < LINK2) { pulses.push({ a: from, b: b, t: 0, v: .016 + Math.random() * .014 }); break; }
          }
        }
        for (i = pulses.length - 1; i >= 0; i--) {
          var p = pulses[i]; p.t += p.v * dt;
          if (p.t >= 1) { pulses.splice(i, 1); continue; }
          var px = p.a.x + (p.b.x - p.a.x) * p.t, py = p.a.y + (p.b.y - p.a.y) * p.t;
          ctx.fillStyle = 'rgba(27,102,245,.18)'; ctx.fillRect(px - 7, py - 7, 14, 14);
          ctx.fillStyle = 'rgba(27,102,245,.95)'; ctx.fillRect(px - 2.5, py - 2.5, 5, 5);
        }
      }

      /* nodos */
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (a.hub) {
          ctx.strokeStyle = 'rgba(10,77,216,.5)'; ctx.lineWidth = 1;
          ctx.strokeRect(a.x - 5.5, a.y - 5.5, 11, 11);
          ctx.fillStyle = 'rgba(10,77,216,.9)'; ctx.fillRect(a.x - 2, a.y - 2, 4, 4);
        } else {
          ctx.fillStyle = 'rgba(10,77,216,.5)'; ctx.fillRect(a.x - a.r, a.y - a.r, a.r * 2, a.r * 2);
        }
      }
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      var dt = clamp((now - last) / 16.67, 0, 3); last = now;
      draw(dt);
    }
    function play() { if (!raf && !reduceMotion) { last = performance.now(); raf = requestAnimationFrame(loop); } }
    function pause() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    hero.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { mouse.on = false; });

    if ('ResizeObserver' in window) new ResizeObserver(debounce(resize, 120)).observe(canvas);
    else window.addEventListener('resize', debounce(resize, 150));
    resize();

    if (hasIO) {
      new IntersectionObserver(function (entries) { entries[0].isIntersecting ? play() : pause(); }, { threshold: 0.02 }).observe(hero);
    } else { play(); }
    document.addEventListener('visibilitychange', function () { document.hidden ? pause() : play(); });
  })();

  /* ═══════════════════════════════
     HERO: parallax con el cursor
     ═══════════════════════════════ */
  (function initHeroParallax() {
    var hero = $('#inicio');
    var visual = $('#heroVisual');
    if (!hero || !visual || reduceMotion || !finePointer) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    function tick() {
      cx += (tx - cx) * .08; cy += (ty - cy) * .08;
      visual.style.setProperty('--px', cx.toFixed(4));
      visual.style.setProperty('--py', cy.toFixed(4));
      raf = (Math.abs(tx - cx) > .001 || Math.abs(ty - cy) > .001) ? requestAnimationFrame(tick) : 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - .5) * 2;
      ty = ((e.clientY - r.top) / r.height - .5) * 2;
      kick();
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; kick(); });
  })();

  /* ═══════════════════════════════
     BOTONES MAGNÉTICOS Y FOCO DE LUZ EN CELDAS
     ═══════════════════════════════ */
  (function initPointerFx() {
    if (reduceMotion || !finePointer) return;

    $$('[data-magnet]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .22;
        var y = (e.clientY - r.top - r.height / 2) * .32;
        el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    $$('[data-spot]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  })();

  /* ═══════════════════════════════
     MÉTODO: línea de progreso y paso activo
     ═══════════════════════════════ */
  (function initTimeline() {
    var steps = $$('.tl-step');
    var line = $('#tlLine');
    var fill = $('#tlFill');
    if (!steps.length || !line || !fill) return;

    var centers = [];
    var activeIndex = -1;

    function measure() {
      /* Alturas acumuladas: no dependen de transforms activos (reveal) que alteran offsetParent */
      var acc = 0;
      centers = steps.map(function (s) {
        var center = acc + $('.tl-icon', s).offsetHeight / 2;
        acc += s.offsetHeight;
        return center;
      });
      var first = centers[0], last = centers[centers.length - 1];
      line.style.top = first + 'px';
      line.style.height = Math.max(last - first, 0) + 'px';
      apply();
    }

    function apply() {
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i <= activeIndex); });
      var first = centers[0], last = centers[centers.length - 1];
      var ratio = activeIndex <= 0 || last === first ? 0 : (centers[activeIndex] - first) / (last - first);
      fill.style.transform = 'scaleY(' + clamp(ratio, 0, 1).toFixed(4) + ')';
    }

    if (hasIO) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { activeIndex = steps.indexOf(e.target); apply(); }
        });
      }, { rootMargin: '-50% 0px -50% 0px' });
      steps.forEach(function (s) { io.observe(s); });
    } else {
      activeIndex = steps.length - 1;
    }

    measure();
    if ('ResizeObserver' in window) new ResizeObserver(debounce(measure, 60)).observe($('#timeline'));
    else window.addEventListener('resize', debounce(measure, 150));
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  })();

  /* ═══════════════════════════════
     SECTORES: acordeón de imágenes
     ═══════════════════════════════ */
  (function initSectors() {
    var panels = $$('.sector');
    if (!panels.length) return;

    function open(target) {
      panels.forEach(function (p) { p.classList.toggle('is-open', p === target); });
    }
    panels.forEach(function (p) {
      p.addEventListener('mouseenter', function () { if (finePointer && window.innerWidth >= 1100) open(p); });
      p.addEventListener('focusin', function () { open(p); });
      p.addEventListener('click', function () { open(p); });
    });
  })();

  /* ═══════════════════════════════
     PREGUNTAS FRECUENTES
     ═══════════════════════════════ */
  (function initFaq() {
    $$('.faq-q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        var isOpen = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });
  })();

  /* ═══════════════════════════════
     FORMULARIO -> WHATSAPP
     ═══════════════════════════════ */
  (function initForm() {
    var form = $('#cForm');
    if (!form) return;

    var submit = $('#fSubmit');
    var label = $('.btn-label', submit);
    var status = $('#fStatus');
    var rules = {
      fn: function (v) { return v.trim().length >= 3 ? '' : 'Escribe tu nombre completo.'; },
      ft: function (v) {
        var digits = v.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 13 ? '' : 'Escribe un teléfono de 10 dígitos.';
      },
      fe: function (v) {
        return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Revisa el formato de tu correo.';
      },
      fs: function (v) { return v ? '' : 'Elige el servicio que te interesa.'; },
      fm: function (v) { return v.trim().length >= 10 ? '' : 'Cuéntanos brevemente en qué podemos ayudarte.'; }
    };

    function check(id) {
      var input = document.getElementById(id);
      var error = document.getElementById(id + '-err');
      var message = rules[id](input.value);
      error.textContent = message;
      input.closest('.field').classList.toggle('has-error', !!message);
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      return !message;
    }

    Object.keys(rules).forEach(function (id) {
      var input = document.getElementById(id);
      input.addEventListener('blur', function () { if (input.value || input.closest('.field').classList.contains('has-error')) check(id); });
      input.addEventListener('input', function () { if (input.closest('.field').classList.contains('has-error')) check(id); });
      input.addEventListener('change', function () { if (input.tagName === 'SELECT') check(id); });
    });

    function openWhatsApp(url) {
      var a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstInvalid = null;
      Object.keys(rules).forEach(function (id) {
        if (!check(id) && !firstInvalid) firstInvalid = document.getElementById(id);
      });
      if (firstInvalid) { firstInvalid.focus(); status.textContent = ''; return; }

      var get = function (id) { return document.getElementById(id).value.trim(); };
      var lines = [
        '*Solicitud de cotización - ' + CONFIG.business + '*',
        '',
        'Nombre: ' + get('fn'),
        'Teléfono: ' + get('ft')
      ];
      if (get('fe')) lines.push('Correo: ' + get('fe'));
      lines.push('Servicio: ' + get('fs'), '', 'Mensaje: ' + get('fm'));
      var url = waUrl(lines.join('\n'));

      submit.classList.add('is-loading');
      label.textContent = 'Preparando tu mensaje';
      status.textContent = '';

      setTimeout(function () {
        openWhatsApp(url);
        submit.classList.remove('is-loading');
        label.textContent = 'Quiero mi cotización';
        status.innerHTML = 'Listo, te esperamos en WhatsApp. Si no se abrió, <a href="' + url + '" target="_blank" rel="noopener noreferrer">toca aquí</a>.';
        form.reset();
      }, reduceMotion ? 0 : 900);
    });
  })();

  /* ═══════════════════════════════
     AÑO EN EL FOOTER
     ═══════════════════════════════ */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
