/* Bug Hunt — a 20-second mini game. Mount: <div data-bughunt></div>
   Colours come from CSS vars on the mount: --bh-bg, --bh-fg, --bh-accent, --bh-bug. */
(function () {
	function store(key, val) {
		try { if (val === undefined) { return parseInt(localStorage.getItem(key), 10) || 0; } localStorage.setItem(key, val); } catch (e) { return 0; }
	}
	function mount(root) {
		var css = getComputedStyle(root);
		var c = function (n, d) { return (css.getPropertyValue(n) || d).trim(); };
		root.innerHTML = '<div class="bh-hud"><span>score <b data-s>0</b></span><span>time <b data-t>20</b>s</span><span>best <b data-b>0</b></span></div>' +
			'<div class="bh-stage"><canvas></canvas><button type="button" class="bh-start">▶ Squash the bugs</button></div>';
		var canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
		var btn = root.querySelector('.bh-start'), sEl = root.querySelector('[data-s]'), tEl = root.querySelector('[data-t]'), bEl = root.querySelector('[data-b]');
		var W = 0, H = 0, bugs = [], pops = [], score = 0, end = 0, last = 0, spawn = 0, running = false;
		bEl.textContent = store('bughunt-best');

		function size() {
			var r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
			W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			if (!running) { draw(); }
		}
		function addBug() {
			var a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 60 + score * 3;
			bugs.push({ x: 20 + Math.random() * (W - 40), y: 20 + Math.random() * (H - 40), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 11 + Math.random() * 5, t: Math.random() * 6, life: 4 + Math.random() * 2 });
		}
		function drawBug(b) {
			var ang = Math.atan2(b.vy, b.vx), wig = Math.sin(b.t * 18) * 0.35;
			ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(ang);
			ctx.strokeStyle = c('--bh-fg', '#222'); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
			for (var i = -1; i <= 1; i++) {
				ctx.beginPath(); ctx.moveTo(i * b.r * 0.45, 0); ctx.lineTo(i * b.r * 0.45 + wig * 4, -b.r * 1.15); ctx.stroke();
				ctx.beginPath(); ctx.moveTo(i * b.r * 0.45, 0); ctx.lineTo(i * b.r * 0.45 - wig * 4, b.r * 1.15); ctx.stroke();
			}
			ctx.fillStyle = c('--bh-bug', '#e11d48'); ctx.beginPath(); ctx.ellipse(0, 0, b.r, b.r * 0.75, 0, 0, Math.PI * 2); ctx.fill();
			ctx.fillStyle = c('--bh-fg', '#222'); ctx.beginPath(); ctx.arc(b.r * 0.85, 0, b.r * 0.42, 0, Math.PI * 2); ctx.fill();
			ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.moveTo(-b.r, 0); ctx.lineTo(b.r * 0.5, 0); ctx.stroke();
			ctx.restore();
		}
		function draw() {
			ctx.clearRect(0, 0, W, H);
			bugs.forEach(drawBug);
			pops.forEach(function (p) {
				ctx.globalAlpha = Math.max(0, p.a); ctx.fillStyle = c('--bh-accent', '#7c3aed');
				ctx.font = '700 15px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText(p.txt, p.x, p.y);
				ctx.globalAlpha = 1;
			});
		}
		function loop(now) {
			if (!running) { return; }
			var dt = Math.min(0.05, (now - last) / 1000); last = now;
			spawn -= dt;
			if (spawn <= 0 && bugs.length < 7) { addBug(); spawn = Math.max(0.25, 0.9 - score * 0.03); }
			bugs.forEach(function (b) {
				b.t += dt; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
				if (b.x < b.r || b.x > W - b.r) { b.vx *= -1; }
				if (b.y < b.r || b.y > H - b.r) { b.vy *= -1; }
				if (Math.random() < dt * 0.8) { var a = Math.atan2(b.vy, b.vx) + (Math.random() - 0.5) * 2, s = Math.hypot(b.vx, b.vy); b.vx = Math.cos(a) * s; b.vy = Math.sin(a) * s; }
			});
			bugs = bugs.filter(function (b) { return b.life > 0; });
			pops.forEach(function (p) { p.y -= 30 * dt; p.a -= dt * 1.5; });
			pops = pops.filter(function (p) { return p.a > 0; });
			var left = Math.max(0, Math.ceil((end - now) / 1000));
			tEl.textContent = left;
			draw();
			if (now >= end) { finish(); return; }
			requestAnimationFrame(loop);
		}
		function finish() {
			running = false; bugs = []; draw();
			var best = store('bughunt-best');
			if (score > best) { store('bughunt-best', score); bEl.textContent = score; }
			btn.textContent = score > best ? '★ New record: ' + score + ' — again?' : 'Score: ' + score + ' — again?';
			btn.hidden = false;
		}
		function start() {
			size(); score = 0; sEl.textContent = 0; bugs = []; pops = []; spawn = 0; btn.hidden = true; running = true;
			last = performance.now(); end = last + 20000; requestAnimationFrame(loop);
		}
		function hit(e) {
			if (!running) { return; }
			var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
			for (var i = bugs.length - 1; i >= 0; i--) {
				var b = bugs[i];
				if (Math.hypot(b.x - x, b.y - y) < b.r + 10) {
					bugs.splice(i, 1); score++; sEl.textContent = score;
					pops.push({ x: b.x, y: b.y, a: 1, txt: ['+1', 'fixed', '200 OK', 'merged', '+1'][score % 5] });
					return;
				}
			}
		}
		btn.addEventListener('click', start);
		canvas.addEventListener('pointerdown', hit);
		if (window.ResizeObserver) { new ResizeObserver(size).observe(canvas); } else { window.addEventListener('resize', size); }
		size();
	}
	window.BugHunt = mount;
	document.querySelectorAll('[data-bughunt]').forEach(mount);
})();
