/* Build the Stack — one-tap timing game. Mount: <div data-game></div>
   Blocks slide in; tap / click / Space to drop. Overhang is cut off. Perfect drops grow the block back.
   Colours from CSS vars on the mount: --bh-fg, --bh-accent, --c1..--c6 (optional). */
(function () {
	var LABELS = ['php', 'mysql', 'flutter', 'dart', 'go', 'wordpress', 'api', 'cache', 'ui', 'auth', 'queue', 'cdn'];
	function store(key, val) {
		try { if (val === undefined) { return parseInt(localStorage.getItem(key), 10) || 0; } localStorage.setItem(key, val); } catch (e) { return 0; }
	}
	function mount(root) {
		var css = getComputedStyle(root);
		var v = function (n, d) { return (css.getPropertyValue(n) || '').trim() || d; };
		root.innerHTML = '<div class="bh-hud"><span>height <b data-s>0</b></span><span>perfect <b data-p>0</b></span><span>best <b data-b>0</b></span></div>' +
			'<div class="bh-stage" tabindex="0" aria-label="Game: tap or press space to drop the block"><canvas></canvas><button type="button" class="bh-start">▶ Build the stack</button></div>';
		var stage = root.querySelector('.bh-stage'), canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
		var btn = root.querySelector('.bh-start'), sEl = root.querySelector('[data-s]'), pEl = root.querySelector('[data-p]'), bEl = root.querySelector('[data-b]');
		var W = 0, H = 0, BH = 26, blocks = [], cur = null, debris = [], cam = 0, camT = 0, running = false, over = false, combo = 0, perfects = 0, flash = 0, last = 0;
		bEl.textContent = store('stack-best');

		function colour(i) {
			var list = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'].map(function (n) { return v(n, ''); }).filter(Boolean);
			if (!list.length) { list = [v('--bh-accent', '#c9a45c'), v('--bh-fg', '#e8e3d6')]; }
			return list[i % list.length];
		}
		function size() {
			var r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
			W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			if (!running) { draw(); }
		}
		function reset() {
			var w = Math.min(220, W * 0.55);
			blocks = [{ x: (W - w) / 2, w: w, i: 0 }];
			debris = []; cam = camT = 0; combo = perfects = 0; flash = 0;
			sEl.textContent = 0; pEl.textContent = 0;
			spawn();
		}
		function spawn() {
			var top = blocks[blocks.length - 1], n = blocks.length;
			var dir = n % 2 ? 1 : -1, speed = Math.min(420, 150 + n * 9);
			cur = { x: dir > 0 ? -top.w : W, w: top.w, i: n, vx: dir * speed };
		}
		function yOf(level) { return H - 40 - level * BH + cam; }
		function drop() {
			if (!running || !cur) { return; }
			var top = blocks[blocks.length - 1];
			var left = Math.max(cur.x, top.x), right = Math.min(cur.x + cur.w, top.x + top.w), overlap = right - left;
			if (overlap <= 0) { debris.push({ x: cur.x, w: cur.w, y: yOf(cur.i), i: cur.i, vy: 0, a: 1 }); cur = null; return end(); }
			if (Math.abs(cur.x - top.x) < 5) {
				combo++; perfects++; pEl.textContent = perfects; flash = 1;
				var grow = combo >= 3 ? Math.max(0, Math.min(12, Math.min(220, W * 0.55) - top.w)) : 0;
				blocks.push({ x: top.x - grow / 2, w: top.w + Math.max(0, grow), i: cur.i, perfect: true });
			} else {
				combo = 0;
				var cutX = cur.x < top.x ? cur.x : right, cutW = cur.w - overlap;
				debris.push({ x: cutX, w: cutW, y: yOf(cur.i), i: cur.i, vy: 0, a: 1 });
				blocks.push({ x: left, w: overlap, i: cur.i });
			}
			sEl.textContent = blocks.length - 1;
			if (blocks.length * BH > H * 0.55) { camT = (blocks.length * BH) - H * 0.55; }
			spawn();
		}
		function end() {
			running = false; over = true;
			var h = blocks.length - 1, best = store('stack-best');
			if (h > best) { store('stack-best', h); bEl.textContent = h; }
			btn.textContent = h > best ? '★ New record: ' + h + ' — again?' : 'Height ' + h + ' — again?';
			setTimeout(function () { btn.hidden = false; }, 500);
			requestAnimationFrame(loop);
		}
		function rect(x, y, w, i, alpha, perfect) {
			ctx.globalAlpha = alpha;
			ctx.fillStyle = colour(i);
			ctx.fillRect(x, y, w, BH - 3);
			ctx.globalAlpha = alpha * 0.9;
			if (w > 46) {
				ctx.fillStyle = 'rgba(0,0,0,.55)';
				ctx.font = '600 11px ui-monospace, monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
				ctx.fillText(LABELS[i % LABELS.length], x + 8, y + (BH - 3) / 2 + 1);
			}
			if (perfect) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, w, 2); }
			ctx.globalAlpha = 1;
		}
		function draw() {
			ctx.clearRect(0, 0, W, H);
			blocks.forEach(function (b, n) { var y = yOf(n); if (y < H + BH && y > -BH) { rect(b.x, y, b.w, b.i, n === 0 ? 0.5 : 1, b.perfect); } });
			debris.forEach(function (d) { rect(d.x, d.y, d.w, d.i, d.a); });
			if (cur) { rect(cur.x, yOf(cur.i), cur.w, cur.i, 1); }
			if (flash > 0) {
				ctx.globalAlpha = flash; ctx.fillStyle = v('--bh-accent', '#c9a45c');
				ctx.font = '700 14px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
				ctx.fillText(combo >= 3 ? 'perfect ×' + combo + ' — growing' : 'perfect', W / 2, yOf(blocks.length) - 8);
				ctx.globalAlpha = 1;
			}
		}
		function loop(now) {
			var dt = Math.min(0.05, (now - last) / 1000); last = now;
			if (cur) {
				cur.x += cur.vx * dt;
				if (cur.x > W) { cur.vx = -Math.abs(cur.vx); }
				if (cur.x + cur.w < 0) { cur.vx = Math.abs(cur.vx); }
			}
			debris.forEach(function (d) { d.vy += 900 * dt; d.y += d.vy * dt; d.a -= dt * 0.8; });
			debris = debris.filter(function (d) { return d.a > 0 && d.y < H + 60; });
			cam += (camT - cam) * Math.min(1, dt * 6);
			flash = Math.max(0, flash - dt * 1.4);
			draw();
			if (running || debris.length) { requestAnimationFrame(loop); }
		}
		function start() {
			size(); reset(); btn.hidden = true; running = true; over = false;
			last = performance.now(); requestAnimationFrame(loop); stage.focus({ preventScroll: true });
		}
		btn.addEventListener('click', function (e) { e.stopPropagation(); start(); });
		stage.addEventListener('pointerdown', function (e) { if (e.target !== btn) { e.preventDefault(); drop(); } });
		stage.addEventListener('keydown', function (e) {
			if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); if (running) { drop(); } else if (!btn.hidden) { start(); } }
		});
		if (window.ResizeObserver) { new ResizeObserver(size).observe(canvas); } else { window.addEventListener('resize', size); }
		size(); reset(); cur = null; draw();
	}
	window.StackGame = mount;
	document.querySelectorAll('[data-game]').forEach(mount);
})();
