/* Deploy Run — one-button gravity-flip runner. Mount: <div data-game></div>
   A packet races down the pipeline; tap / click / Space flips it between floor and ceiling.
   Dodge the errors. Distance = score. Colours from CSS vars: --bh-fg, --bh-accent, --c2, --c5 (optional). */
(function () {
	var ERRORS = ['404', 'null', 'bug', '500', 'timeout', 'NaN', 'segfault', 'conflict', 'undefined', 'deadlock'];
	function store(key, val) {
		try { if (val === undefined) { return parseInt(localStorage.getItem(key), 10) || 0; } localStorage.setItem(key, val); } catch (e) { return 0; }
	}
	function mount(root) {
		var css = getComputedStyle(root);
		var v = function (n, d) { return (css.getPropertyValue(n) || '').trim() || d; };
		root.innerHTML = '<div class="bh-hud"><span>deployed <b data-s>0</b>m</span><span>speed <b data-v>1.0</b>x</span><span>best <b data-b>0</b>m</span></div>' +
			'<div class="bh-stage" tabindex="0" aria-label="Game: tap or press space to flip gravity"><canvas></canvas><button type="button" class="bh-start">▶ Deploy</button></div>';
		var stage = root.querySelector('.bh-stage'), canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
		var btn = root.querySelector('.bh-start'), sEl = root.querySelector('[data-s]'), vEl = root.querySelector('[data-v]'), bEl = root.querySelector('[data-b]');
		var W = 0, H = 0, PAD = 22, R = 9, p, obs, trail, sparks, speed, dist, nextGap, running = false, last = 0, shake = 0;
		bEl.textContent = store('deploy-best');

		function size() {
			var r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
			W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			if (!running) { draw(); }
		}
		function reset() {
			p = { x: Math.max(60, W * 0.18), y: H - PAD - R, vy: 0, g: 1 };
			obs = []; trail = []; sparks = []; speed = 210; dist = 0; nextGap = 260; shake = 0;
			sEl.textContent = 0; vEl.textContent = '1.0';
		}
		function addObstacle() {
			var top = Math.random() < 0.5, h = 26 + Math.random() * Math.min(70, H * 0.32);
			var label = ERRORS[Math.floor(Math.random() * ERRORS.length)];
			ctx.font = '600 11px ui-monospace, monospace';
			var w = Math.max(34, ctx.measureText(label).width + 16);
			obs.push({ x: W + 20, w: w, h: h, top: top, label: label });
			// Later on: a quick follow-up on the opposite rail (forces a double flip).
			if (dist > 600 && Math.random() < 0.3) {
				obs.push({ x: W + 20 + w + 95 + Math.random() * 50, w: w, h: h, top: !top, label: ERRORS[Math.floor(Math.random() * ERRORS.length)] });
			}
			nextGap = Math.max(150, 320 - dist / 25) + Math.random() * 160;
		}
		function flip() {
			if (!running) { return; }
			p.g *= -1;
			for (var i = 0; i < 6; i++) { sparks.push({ x: p.x, y: p.y, vx: -60 - Math.random() * 120, vy: (Math.random() - 0.5) * 160, a: 1 }); }
		}
		function hit(o) {
			var oy = o.top ? PAD : H - PAD - o.h;
			var cx = Math.max(o.x, Math.min(p.x, o.x + o.w)), cy = Math.max(oy, Math.min(p.y, oy + o.h));
			return Math.hypot(p.x - cx, p.y - cy) < R - 1;
		}
		function draw() {
			ctx.save();
			ctx.clearRect(0, 0, W, H);
			if (shake > 0) { ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); }
			var fg = v('--bh-fg', '#e8e3d6'), acc = v('--bh-accent', '#c9a45c'), bad = v('--c2', '#f472b6'), good = v('--c5', acc);
			// Rails with moving dashes.
			ctx.strokeStyle = fg; ctx.globalAlpha = 0.25; ctx.lineWidth = 1; ctx.setLineDash([10, 12]); ctx.lineDashOffset = dist % 22;
			ctx.beginPath(); ctx.moveTo(0, PAD); ctx.lineTo(W, PAD); ctx.moveTo(0, H - PAD); ctx.lineTo(W, H - PAD); ctx.stroke();
			ctx.setLineDash([]); ctx.globalAlpha = 1;
			// Obstacles.
			obs.forEach(function (o) {
				var oy = o.top ? PAD : H - PAD - o.h;
				ctx.fillStyle = bad; ctx.globalAlpha = 0.16; ctx.fillRect(o.x, oy, o.w, o.h); ctx.globalAlpha = 1;
				ctx.strokeStyle = bad; ctx.lineWidth = 1.5; ctx.strokeRect(o.x + 0.75, oy + 0.75, o.w - 1.5, o.h - 1.5);
				ctx.fillStyle = bad; ctx.font = '600 11px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
				ctx.fillText(o.label, o.x + o.w / 2, o.top ? oy + o.h - 11 : oy + 11);
			});
			// Trail + packet.
			trail.forEach(function (t, i) { ctx.globalAlpha = (i / trail.length) * 0.5; ctx.fillStyle = good; ctx.beginPath(); ctx.arc(t.x, t.y, R * (i / trail.length), 0, Math.PI * 2); ctx.fill(); });
			ctx.globalAlpha = 1;
			sparks.forEach(function (s) { ctx.globalAlpha = s.a; ctx.fillStyle = acc; ctx.fillRect(s.x, s.y, 2, 2); });
			ctx.globalAlpha = 1;
			if (p) {
				ctx.shadowColor = good; ctx.shadowBlur = 14; ctx.fillStyle = good;
				ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
				ctx.fillStyle = v('--bg', '#0b0b0c'); ctx.font = '700 9px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
				ctx.fillText('{}', p.x, p.y + 0.5);
			}
			ctx.restore();
		}
		function loop(now) {
			var dt = Math.min(0.033, (now - last) / 1000); last = now;
			if (running) {
				speed = Math.min(620, 210 + dist / 9);
				dist += speed * dt;
				p.vy += p.g * 2600 * dt; p.y += p.vy * dt;
				if (p.y > H - PAD - R) { p.y = H - PAD - R; p.vy = 0; }
				if (p.y < PAD + R) { p.y = PAD + R; p.vy = 0; }
				trail.push({ x: p.x, y: p.y }); if (trail.length > 14) { trail.shift(); }
				trail.forEach(function (t) { t.x -= speed * dt; });
				nextGap -= speed * dt;
				if (nextGap <= 0) { addObstacle(); }
				obs.forEach(function (o) { o.x -= speed * dt; });
				obs = obs.filter(function (o) { return o.x + o.w > -10; });
				sEl.textContent = Math.floor(dist / 10);
				vEl.textContent = (speed / 210).toFixed(1);
				for (var i = 0; i < obs.length; i++) { if (hit(obs[i])) { return crash(); } }
			}
			sparks.forEach(function (s) { s.x += s.vx * dt; s.y += s.vy * dt; s.a -= dt * 2; });
			sparks = sparks.filter(function (s) { return s.a > 0; });
			shake = Math.max(0, shake - dt * 40);
			draw();
			if (running || sparks.length || shake > 0) { requestAnimationFrame(loop); }
		}
		function crash() {
			running = false; shake = 10;
			for (var i = 0; i < 24; i++) { var a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 220; sparks.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, a: 1 }); }
			var m = Math.floor(dist / 10), best = store('deploy-best');
			if (m > best) { store('deploy-best', m); bEl.textContent = m; }
			btn.textContent = m > best ? '★ New record: ' + m + 'm — redeploy?' : 'Crashed at ' + m + 'm — redeploy?';
			setTimeout(function () { btn.hidden = false; }, 450);
			requestAnimationFrame(loop);
		}
		function start() {
			size(); reset(); btn.hidden = true; running = true;
			last = performance.now(); requestAnimationFrame(loop); stage.focus({ preventScroll: true });
		}
		btn.addEventListener('click', function (e) { e.stopPropagation(); start(); });
		stage.addEventListener('pointerdown', function (e) { if (e.target !== btn) { e.preventDefault(); flip(); } });
		stage.addEventListener('keydown', function (e) {
			if (e.code === 'Space' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); if (running) { flip(); } else if (!btn.hidden) { start(); } }
		});
		if (window.ResizeObserver) { new ResizeObserver(size).observe(canvas); } else { window.addEventListener('resize', size); }
		size(); reset(); draw();
	}
	window.MiniGame = mount;
	document.querySelectorAll('[data-game]').forEach(mount);
})();
