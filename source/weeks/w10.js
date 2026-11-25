(function(){
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent){
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, cls, s, style){
    var t = el("text", {x: x, y: y, "class": cls}, parent);
    if (style) t.setAttribute("style", style);
    t.textContent = s; return t;
  }
  function clear(node){ while (node.firstChild) node.removeChild(node.firstChild); }
  function svgBox(svg){
    svg.setAttribute("style", "width:100%;height:auto;display:block;background:var(--ground);border-radius:10px;margin-top:6px");
  }
  function pill(ok, yes, no){ return "<span class=\"pill " + (ok ? "yes\">" + yes : "no\">" + no) + "</span>"; }
  /* t(df)의 상위 2.5% 점, df = 1 … 98 */
  var T025 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042, 2.04, 2.037, 2.035, 2.032, 2.03, 2.028, 2.026, 2.024, 2.023, 2.021, 2.02, 2.018, 2.017, 2.015, 2.014, 2.013, 2.012, 2.011, 2.01, 2.009, 2.008, 2.007, 2.006, 2.005, 2.004, 2.003, 2.002, 2.002, 2.001, 2.0, 2.0, 1.999, 1.998, 1.998, 1.997, 1.997, 1.996, 1.995, 1.995, 1.994, 1.994, 1.993, 1.993, 1.993, 1.992, 1.992, 1.991, 1.991, 1.99, 1.99, 1.99, 1.989, 1.989, 1.989, 1.988, 1.988, 1.988, 1.987, 1.987, 1.987, 1.986, 1.986, 1.986, 1.986, 1.985, 1.985, 1.985, 1.984];

  /* ---------- 1. 상관계수 검정: r과 n을 바꾸면 ---------- */
  (function(){
    var out = document.getElementById("ct10-out");
    if (!out) return;
    var note = document.getElementById("ct10-note");
    var sr = document.getElementById("ct10-r"), sn = document.getElementById("ct10-n");
    var vr = document.getElementById("ct10-r-v"), vn = document.getElementById("ct10-n-v");
    function render(){
      var r = parseFloat(sr.value), n = parseInt(sn.value, 10), df = n - 2;
      vr.textContent = r.toFixed(2); vn.textContent = n;
      var se = Math.sqrt((1 - r * r) / df), T = r / se, c = T025[df - 1];
      var rej = Math.abs(T) > c;
      out.innerHTML =
        "<p>표준오차 SE(r) = √((1 − " + r.toFixed(2) + "²) / " + df + ") = <span class=\"n\">" + se.toFixed(3) + "</span></p>" +
        "<p>검정통계량 T = " + r.toFixed(2) + " ÷ " + se.toFixed(3) + " = <span class=\"n\">" + T.toFixed(2) + "</span></p>" +
        "<p>임계값 t<sub>0.025</sub>(" + df + ") = <span class=\"n\">" + c.toFixed(3) + "</span></p>" +
        "<p>|T| " + (rej ? "&gt;" : "≤") + " " + c.toFixed(3) + " " + pill(rej, "기각", "기각 못 함") + "</p>";
      var msg;
      if (Math.abs(r) < 0.005) msg = "r이 0이면 T도 0이라서 n이 아무리 커도 기각할 수 없어요.";
      else if (rej && Math.abs(r) < 0.4) msg = "상관계수는 크지 않은데도 n이 커서 표준오차가 작아졌고, 그래서 기각돼요. 상관계수가 큰 것과 유의한 것은 다른 말이에요.";
      else if (!rej && Math.abs(r) >= 0.6) msg = "상관계수가 꽤 큰데도 n이 작아서 표준오차가 커요. 이 정도 r은 우연으로도 나올 수 있다는 뜻이라 기각하지 못해요.";
      else if (rej) msg = "r이 0에서 충분히 멀고 자료도 충분해서 기각돼요. n을 줄여 보면서 언제 결론이 바뀌는지 확인해 보세요.";
      else msg = "같은 r에서 n을 키워 보세요. 표준오차 √((1 − r²)/(n − 2))가 작아지면서 어느 순간 기각돼요.";
      note.textContent = msg;
    }
    sr.addEventListener("input", render); sn.addEventListener("input", render);
    render();
  })();

  /* ---------- 2. 최소제곱법: 정사각형 넓이 합이 가장 작은 직선 ---------- */
  (function(){
    var svg = document.getElementById("ls10-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("ls10-out"), note = document.getElementById("ls10-note");
    var sa = document.getElementById("ls10-a"), sb = document.getElementById("ls10-b");
    var va = document.getElementById("ls10-a-v"), vb = document.getElementById("ls10-b-v");
    var xs = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    var ys = [45, 52, 50, 61, 58, 55, 69, 62, 73, 66, 80, 74];
    var n = xs.length;
    var xb = xs.reduce(function(s, v){ return s + v; }, 0) / n;
    var yb = ys.reduce(function(s, v){ return s + v; }, 0) / n;
    var sxx = 0, sxy = 0, sst = 0;
    for (var i = 0; i < n; i++){ sxx += (xs[i] - xb) * (xs[i] - xb); sxy += (xs[i] - xb) * (ys[i] - yb); sst += (ys[i] - yb) * (ys[i] - yb); }
    var bhat = sxy / sxx, ahat = yb - bhat * xb;
    function Q(a, b){ var s = 0; for (var i = 0; i < n; i++){ var r = ys[i] - (a + b * xs[i]); s += r * r; } return s; }
    var qmin = Q(ahat, bhat), a = 50, b = 1.5, best = false;
    function render(){
      var aa = best ? ahat : a, bb = best ? bhat : b;
      var q = Q(aa, bb);
      clear(svg);
      var L = 44, R = 540, T = 14, B = 252, x0 = 0, x1 = 15, y0 = 30, y1 = 92;
      function X(v){ return L + (v - x0) / (x1 - x0) * (R - L); }
      function Y(v){ return B - (v - y0) / (y1 - y0) * (B - T); }
      function Yc(v){ return Y(Math.max(y0, Math.min(y1, v))); }
      el("clipPath", {id: "ls10-clip"}, svg);
      el("rect", {x: L, y: T, width: R - L, height: B - T}, svg.lastChild);
      [40, 50, 60, 70, 80, 90].forEach(function(t){
        el("line", {x1: L, x2: R, y1: Y(t), y2: Y(t), "class": "grid-l"}, svg);
        txt(svg, L - 8, Y(t) + 4, "svg-t", String(t), "text-anchor:end");
      });
      [0, 2, 4, 6, 8, 10, 12, 14].forEach(function(t){ txt(svg, X(t), B + 18, "svg-t", String(t)); });
      txt(svg, (L + R) / 2, B + 38, "svg-t", "주당 공부 시간 (시간)");
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      var g = el("g", {"clip-path": "url(#ls10-clip)"}, svg);
      for (var i = 0; i < n; i++){
        var fit = aa + bb * xs[i], px = X(xs[i]), py = Y(ys[i]), pf = Y(fit);
        var side = Math.abs(py - pf);
        var left = ys[i] > fit;          /* 직선 위의 점은 왼쪽, 아래의 점은 오른쪽에 정사각형 */
        el("rect", {x: left ? px - side : px, y: Math.min(py, pf), width: side, height: side,
          style: "fill:var(--orange);fill-opacity:.22;stroke:var(--orange);stroke-opacity:.6;stroke-width:1"}, g);
        el("line", {x1: px, x2: px, y1: py, y2: pf, style: "stroke:var(--orange);stroke-width:2"}, g);
      }
      el("line", {x1: X(x0), x2: X(x1), y1: Y(aa + bb * x0), y2: Y(aa + bb * x1),
        style: "stroke:var(--red);stroke-width:" + (best ? 3 : 2.4)}, g);
      for (i = 0; i < n; i++) el("circle", {cx: X(xs[i]), cy: Y(ys[i]), r: 5, style: "fill:var(--blue)"}, svg);
      el("circle", {cx: X(xb), cy: Y(yb), r: 6, style: "fill:var(--ground);stroke:var(--ink);stroke-width:2"}, svg);
      txt(svg, X(xb) + 10, Y(yb) + 20, "w4-leg", "평균점", "text-anchor:start");
      txt(svg, L + 8, T + 14, "w4-leg", "주황 정사각형 넓이의 합 = Q", "text-anchor:start;fill:var(--orange)");
      var through = Math.abs(aa + bb * xb - yb) < 0.15;
      out.innerHTML =
        "<p>지금 직선: ŷ = " + aa.toFixed(2) + " + " + bb.toFixed(2) + "x</p>" +
        "<p>넓이 합 Q = <span class=\"n\">" + q.toFixed(1) + "</span></p>" +
        "<p>최소제곱 직선: ŷ = " + ahat.toFixed(2) + " + " + bhat.toFixed(3) + "x</p>" +
        "<p>그때의 Q = <span class=\"n\">" + qmin.toFixed(1) + "</span> <span class=\"muted\">(가장 작은 값)</span></p>";
      var msg;
      if (best) msg = "지금이 최소제곱 직선이에요. 절편이나 기울기를 어느 쪽으로 움직여도 넓이 합이 커져요. 직선이 평균점을 지나는 것도 확인해 보세요. 이때의 넓이 합이 SSE(" + qmin.toFixed(1) + ")이고, 전체 흩어짐 SST(" + sst.toFixed(1) + ") 중 SSE가 아닌 부분의 비율이 R² = " + (1 - qmin / sst).toFixed(3) + "예요.";
      else if (q < qmin * 1.05) msg = "거의 다 왔어요. 넓이 합이 최솟값과 5% 이내로 차이 나요.";
      else if (!through) msg = "직선이 평균점(흰 동그라미)을 지나지 않아요. 최소제곱 직선은 항상 평균점을 지나니, 먼저 직선을 평균점에 맞춰 보세요.";
      else msg = "직선이 평균점은 지나요. 이제 기울기를 바꾸면서 큰 정사각형들이 작아지는 쪽을 찾아보세요.";
      note.textContent = msg;
    }
    sa.addEventListener("input", function(){ best = false; a = parseFloat(sa.value); va.textContent = a.toFixed(1); render(); });
    sb.addEventListener("input", function(){ best = false; b = parseFloat(sb.value); vb.textContent = b.toFixed(2); render(); });
    document.getElementById("ls10-best").addEventListener("click", function(){
      best = true; a = ahat; b = bhat;
      sa.value = ahat.toFixed(1); va.textContent = ahat.toFixed(1);
      sb.value = bhat.toFixed(2); vb.textContent = bhat.toFixed(2);
      render();
    });
    render();
  })();

  function f1(v){ return v.toFixed(1); }
  function f2(v){ return v.toFixed(2); }
  function segWire(buttons, onPick){
    Array.prototype.forEach.call(buttons, function(b){
      b.addEventListener("click", function(){
        Array.prototype.forEach.call(buttons, function(o){ var on = o === b; o.classList.toggle("on", on); o.setAttribute("aria-pressed", on); });
        onPick(b);
      });
    });
  }
  function stackBar(svg, y, h, parts, total, L, R){
    var x = L, W = R - L;
    parts.forEach(function(p){
      var w = total > 0 ? p.v / total * W : 0;
      if (w > 0.5){
        el("rect", {x: x, y: y, width: w, height: h, style: "fill:" + p.c + ";stroke:var(--ground);stroke-width:1.5"}, svg);
        if (w > 52) txt(svg, x + w / 2, y + h / 2 + 5, "svg-t", p.label, "fill:#fff;font-weight:700;font-size:14px");
      }
      x += w;
    });
  }
  /* 고정 시드 난수 (새로고침해도 같은 자료) */
  function rng(seed){
    var a = seed >>> 0;
    function u(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    return function(){ var x = u() || 1e-9, y = u(); return Math.sqrt(-2 * Math.log(x)) * Math.cos(2 * Math.PI * y); };
  }
  function fitLine(xs, ys){
    var n = xs.length, xb = 0, yb = 0, sxx = 0, sxy = 0, sst = 0, i;
    for (i = 0; i < n; i++){ xb += xs[i] / n; yb += ys[i] / n; }
    for (i = 0; i < n; i++){ sxx += (xs[i] - xb) * (xs[i] - xb); sxy += (xs[i] - xb) * (ys[i] - yb); sst += (ys[i] - yb) * (ys[i] - yb); }
    var b = sxy / sxx, a = yb - b * xb, sse = 0;
    for (i = 0; i < n; i++){ var r = ys[i] - a - b * xs[i]; sse += r * r; }
    return {a: a, b: b, xb: xb, yb: yb, sxx: sxx, sst: sst, sse: sse};
  }

  /* ---------- 3. 기울기와 잡음에 따라 SSR, SSE, R², F가 어떻게 바뀌나 ---------- */
  (function(){
    var svg = document.getElementById("r210-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("r210-out"), note = document.getElementById("r210-note");
    var sb = document.getElementById("r210-b"), ss = document.getElementById("r210-s");
    var vb = document.getElementById("r210-b-v"), vs = document.getElementById("r210-s-v");
    /* 최소제곱법 위젯과 같은 12명 자료. 잡음 1배, 기울기 = 원래 기울기면 원래 자료 */
    var xs = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    var ys0 = [45, 52, 50, 61, 58, 55, 69, 62, 73, 66, 80, 74];
    var f0 = fitLine(xs, ys0), n = 12;
    var Z = xs.map(function(x, i){ return ys0[i] - f0.a - f0.b * x; });
    var FC = 4.96, TC = 2.228;   /* F0.05(1,10), t0.025(10) */
    function render(){
      var b = parseFloat(sb.value), c = parseFloat(ss.value);
      vb.textContent = f2(b); vs.textContent = f2(c) + "배";
      var ys = xs.map(function(x, i){ return f0.yb + b * (x - f0.xb) + c * Z[i]; });
      var ssr = b * b * f0.sxx, sse = c * c * f0.sse, sst = ssr + sse;
      var r2 = sst > 0 ? ssr / sst : 0, mse = sse / (n - 2), F = ssr / mse, T = b / Math.sqrt(mse / f0.sxx);
      clear(svg);
      var L = 44, R = 540, Tp = 14, B = 232, x0 = 0, x1 = 15, y0 = 30, y1 = 92;
      function X(v){ return L + (v - x0) / (x1 - x0) * (R - L); }
      function Y(v){ return B - (v - y0) / (y1 - y0) * (B - Tp); }
      el("clipPath", {id: "r210-clip"}, svg);
      el("rect", {x: L, y: Tp, width: R - L, height: B - Tp}, svg.lastChild);
      [40, 50, 60, 70, 80, 90].forEach(function(t){
        el("line", {x1: L, x2: R, y1: Y(t), y2: Y(t), "class": "grid-l"}, svg);
        txt(svg, L - 8, Y(t) + 4, "svg-t", String(t), "text-anchor:end");
      });
      [0, 2, 4, 6, 8, 10, 12, 14].forEach(function(t){ txt(svg, X(t), B + 18, "svg-t", String(t)); });
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      var g = el("g", {"clip-path": "url(#r210-clip)"}, svg);
      el("line", {x1: L, x2: R, y1: Y(f0.yb), y2: Y(f0.yb), style: "stroke:var(--ink);stroke-width:1;stroke-dasharray:5 4"}, g);
      for (var i = 0; i < n; i++){
        var px = X(xs[i]), fit = f0.yb + b * (xs[i] - f0.xb);
        el("line", {x1: px - 3, x2: px - 3, y1: Y(f0.yb), y2: Y(fit), style: "stroke:var(--blue);stroke-width:3"}, g);
        el("line", {x1: px + 3, x2: px + 3, y1: Y(fit), y2: Y(ys[i]), style: "stroke:var(--orange);stroke-width:3"}, g);
      }
      el("line", {x1: X(x0), x2: X(x1), y1: Y(f0.yb + b * (x0 - f0.xb)), y2: Y(f0.yb + b * (x1 - f0.xb)), style: "stroke:var(--red);stroke-width:2.4"}, g);
      for (i = 0; i < n; i++) el("circle", {cx: X(xs[i]), cy: Y(ys[i]), r: 5, style: "fill:var(--ink)"}, g);
      txt(svg, R - 4, Y(f0.yb) - 6, "w4-leg", "평균 ȳ", "text-anchor:end");
      stackBar(svg, 262, 30, [
        {v: ssr, c: "var(--blue)", label: "SSR"},
        {v: sse, c: "var(--orange)", label: "SSE"}], sst, L, R);
      txt(svg, L, 312, "w4-leg", "파랑 = 평균에서 직선까지(설명 O) · 주황 = 직선에서 점까지(설명 X)", "text-anchor:start;font-size:12px");
      out.innerHTML =
        "<p>SST = <span class=\"n\">" + f1(sst) + "</span> = SSR " + f1(ssr) + " + SSE " + f1(sse) + "</p>" +
        "<p>R² = SSR ÷ SST = <span class=\"n\">" + r2.toFixed(3) + "</span> <span class=\"muted\">(r = " + Math.sqrt(r2).toFixed(3) + ", r² = R²)</span></p>" +
        "<p>F = MSR ÷ MSE = " + f1(ssr) + " ÷ " + f2(mse) + " = <span class=\"n\">" + f2(F) + "</span></p>" +
        "<p>F vs 4.96 " + pill(F > FC, "기각", "기각 못 함") + " <span class=\"muted\">(T = " + f2(T) + ", T² = " + f2(T * T) + ")</span></p>";
      var msg;
      if (b === 0) msg = "기울기가 0이면 직선이 평균선과 겹쳐서 파란 막대가 모두 사라져요. SSR = 0, R² = 0, F = 0이에요. β = 0이라는 귀무가설이 바로 이런 모습이에요.";
      else if (Math.abs(b - f0.b) < 0.03 && Math.abs(c - 1) < 0.03) msg = "최소제곱법 위젯의 원래 자료예요. 잡음을 키우면 주황 막대만 길어져서 R²와 F가 같이 작아지는 걸 확인해 보세요.";
      else if (F > FC && r2 < 0.5) msg = "R²는 0.5도 안 되는데 F검정은 기각돼요. 설명력이 크지 않아도 '기울기가 0은 아니다'라고는 말할 수 있다는 뜻이에요. 설명력과 유의성은 다른 질문이에요.";
      else if (F > FC) msg = "파란 부분(SSR)이 주황 부분(SSE)에 비해 충분히 커서 기각돼요. 이때 T² = F라서 t검정으로 해도 같은 결론이에요.";
      else msg = "잡음에 비해 기울기가 작아서 직선이 설명하는 부분이 작아요. 기각하지 못하니 이 자료로는 회귀직선이 유의하다고 말할 수 없어요.";
      note.textContent = msg;
    }
    sb.value = f0.b.toFixed(2);
    sb.addEventListener("input", render); ss.addEventListener("input", render);
    render();
  })();

  /* ---------- 4. x를 넓게 모을수록 β̂가 덜 흔들린다 ---------- */
  (function(){
    var svg = document.getElementById("bs10-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("bs10-out"), note = document.getElementById("bs10-note");
    var sw = document.getElementById("bs10-x"), sn = document.getElementById("bs10-n");
    var vw = document.getElementById("bs10-x-v"), vn = document.getElementById("bs10-n-v");
    var K = 30, NMAX = 40, SIG = 6, BETA = 2, C = 8;
    var g = rng(20261118), Zs = [];
    for (var k = 0; k < K; k++){ var row = []; for (var i = 0; i < NMAX; i++) row.push(g()); Zs.push(row); }
    function render(){
      var w = parseFloat(sw.value), n = parseInt(sn.value, 10), df = n - 2;
      vw.textContent = "±" + f1(w) + "시간"; vn.textContent = n;
      var xs = []; for (var i = 0; i < n; i++) xs.push(C - w + 2 * w * i / (n - 1));
      var fits = [], rej = 0, bmin = Infinity, bmax = -Infinity, tc = T025[df - 1];
      for (var k = 0; k < K; k++){
        var ys = xs.map(function(x, i){ return 60 + BETA * (x - C) + SIG * Zs[k][i]; });
        var f = fitLine(xs, ys); f.ys = ys; fits.push(f);
        var T = f.b / Math.sqrt(f.sse / df / f.sxx);
        if (Math.abs(T) > tc) rej++;
        bmin = Math.min(bmin, f.b); bmax = Math.max(bmax, f.b);
      }
      var sxx = fits[0].sxx, sd = SIG / Math.sqrt(sxx), Texp = BETA / sd;
      clear(svg);
      var L = 44, R = 540, T0 = 14, B = 232, x0 = 0, x1 = 16, y0 = 20, y1 = 100;
      function X(v){ return L + (v - x0) / (x1 - x0) * (R - L); }
      function Y(v){ return B - (v - y0) / (y1 - y0) * (B - T0); }
      el("clipPath", {id: "bs10-clip"}, svg);
      el("rect", {x: L, y: T0, width: R - L, height: B - T0}, svg.lastChild);
      [20, 40, 60, 80, 100].forEach(function(t){
        el("line", {x1: L, x2: R, y1: Y(t), y2: Y(t), "class": "grid-l"}, svg);
        txt(svg, L - 8, Y(t) + 4, "svg-t", String(t), "text-anchor:end");
      });
      [0, 4, 8, 12, 16].forEach(function(t){ txt(svg, X(t), B + 18, "svg-t", String(t)); });
      txt(svg, (L + R) / 2, B + 38, "svg-t", "주당 공부 시간 (시간)");
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      var gc = el("g", {"clip-path": "url(#bs10-clip)"}, svg);
      el("rect", {x: X(C - w), y: T0, width: X(C + w) - X(C - w), height: B - T0, style: "fill:var(--blue-tint)"}, gc);
      fits.forEach(function(f){
        el("line", {x1: X(x0), x2: X(x1), y1: Y(f.a + f.b * x0), y2: Y(f.a + f.b * x1), style: "stroke:var(--orange);stroke-opacity:.45;stroke-width:1.4"}, gc);
      });
      el("line", {x1: X(x0), x2: X(x1), y1: Y(60 + BETA * (x0 - C)), y2: Y(60 + BETA * (x1 - C)), style: "stroke:var(--ink);stroke-width:2.4;stroke-dasharray:7 4"}, gc);
      xs.forEach(function(x, i){ el("circle", {cx: X(x), cy: Y(fits[0].ys[i]), r: 3.5, style: "fill:var(--blue)"}, gc); });
      txt(svg, L + 8, T0 + 14, "w4-leg", "점선 = 진짜 직선(β = 2) · 주황 = 표본 30개로 각각 구한 직선", "text-anchor:start;font-size:12px");
      out.innerHTML =
        "<p>S<sub>(xx)</sub> = <span class=\"n\">" + f1(sxx) + "</span></p>" +
        "<p>β̂의 표준편차 σ ÷ √S<sub>(xx)</sub> = 6 ÷ " + Math.sqrt(sxx).toFixed(2) + " = <span class=\"n\">" + f2(sd) + "</span></p>" +
        "<p>30번 구한 β̂: <span class=\"n\">" + f2(bmin) + "</span> ~ <span class=\"n\">" + f2(bmax) + "</span></p>" +
        "<p>30번 중 β = 0 기각 <span class=\"n\">" + rej + "번</span> <span class=\"muted\">(기준 t<sub>0.025</sub>(" + df + ") = " + tc.toFixed(3) + ")</span></p>";
      var msg;
      if (w <= 1.5) msg = "x를 좁은 범위에서만 모으면 S(xx)가 작아서, 같은 진짜 직선에서 나온 자료인데도 표본마다 기울기가 크게 흔들려요. 그래서 기울기가 실제로 2인데도 β = 0을 기각하지 못하는 경우가 많아요.";
      else if (rej >= 27) msg = "x를 넓게 모으면 S(xx)가 커져서 직선들이 진짜 직선 근처에 모여요. 거의 매번 β = 0을 기각해요. 같은 n이라도 x를 어떻게 모으느냐에 따라 검정력이 달라져요.";
      else msg = "범위를 넓히거나 n을 늘려 보세요. 둘 다 S(xx)를 키워서 β̂의 분산 σ²/S(xx)를 줄여요. 파란 띠는 x를 모은 범위예요.";
      note.textContent = msg;
    }
    sw.addEventListener("input", render); sn.addEventListener("input", render);
    render();
  })();

  /* ---------- 5. 잔차 그림으로 가정 확인하기 ---------- */
  (function(){
    var svg = document.getElementById("rd10-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("rd10-out"), note = document.getElementById("rd10-note");
    var sk = document.getElementById("rd10-k"), vk = document.getElementById("rd10-k-v");
    var n = 40, g = rng(20261116), Z = [], XS = [];
    for (var i = 0; i < n; i++){ Z.push(g()); XS.push(1 + 19 * (i + 0.5) / n + 0.3 * g()); }
    var mode = "ok";
    function render(){
      var k = parseFloat(sk.value);
      sk.disabled = mode === "ok";
      vk.textContent = mode === "ok" ? "–" : f2(k);
      var ys = XS.map(function(x, i){
        if (mode === "fan") return 20 + 2 * x + 4 * ((1 - k) + k * x / 6) * Z[i];
        if (mode === "curve") return 20 + 2 * x + k * 0.35 * (x - 10.5) * (x - 10.5) + 3 * Z[i];
        return 20 + 2 * x + 4 * Z[i];
      });
      var f = fitLine(XS, ys), s = Math.sqrt(f.sse / (n - 2)), r2 = 1 - f.sse / f.sst;
      var res = XS.map(function(x, i){ return (ys[i] - f.a - f.b * x) / s; });
      var outside = res.filter(function(r){ return Math.abs(r) > 2; }).length;
      clear(svg);
      var L = 44, R = 540, x0 = 0, x1 = 21;
      function X(v){ return L + (v - x0) / (x1 - x0) * (R - L); }
      var ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys), pad = (ymax - ymin) * 0.08 + 1;
      var T1 = 14, B1 = 170;
      function Y1(v){ return B1 - (v - (ymin - pad)) / (ymax - ymin + 2 * pad) * (B1 - T1); }
      el("line", {x1: L, x2: R, y1: B1, y2: B1, "class": "ax"}, svg);
      txt(svg, L - 8, (T1 + B1) / 2 + 4, "svg-t", "y", "text-anchor:end");
      el("line", {x1: X(x0), x2: X(x1), y1: Y1(f.a + f.b * x0), y2: Y1(f.a + f.b * x1), style: "stroke:var(--red);stroke-width:2.2"}, svg);
      XS.forEach(function(x, i){ el("circle", {cx: X(x), cy: Y1(ys[i]), r: 3.8, style: "fill:var(--ink)"}, svg); });
      txt(svg, L + 6, T1 + 12, "w4-leg", "산점도와 최소제곱 직선", "text-anchor:start;font-size:12px");
      var T2 = 196, B2 = 340, lim = 3.5;
      function Y2(v){ return T2 + (lim - Math.max(-lim, Math.min(lim, v))) / (2 * lim) * (B2 - T2); }
      el("rect", {x: L, y: Y2(2), width: R - L, height: Y2(-2) - Y2(2), style: "fill:var(--green-tint)"}, svg);
      [-2, 0, 2].forEach(function(v){
        el("line", {x1: L, x2: R, y1: Y2(v), y2: Y2(v), style: v ? "stroke:var(--green);stroke-dasharray:5 4" : "stroke:var(--muted)"}, svg);
        txt(svg, L - 8, Y2(v) + 4, "svg-t", (v > 0 ? "+" : "") + v, "text-anchor:end");
      });
      XS.forEach(function(x, i){
        var bad = Math.abs(res[i]) > 2;
        el("circle", {cx: X(x), cy: Y2(res[i]), r: 3.8, style: "fill:" + (bad ? "var(--red)" : "var(--orange)")}, svg);
      });
      txt(svg, L + 6, T2 + 12, "w4-leg", "표준화 잔차 (초록 띠 = ±2)", "text-anchor:start;font-size:12px");
      [0, 5, 10, 15, 20].forEach(function(t){ txt(svg, X(t), B2 + 18, "svg-t", String(t)); });
      txt(svg, (L + R) / 2, B2 + 36, "svg-t", "x");
      var verdict = mode === "ok" ? pill(true, "가정 OK", "") : (k < 0.25 ? "<span class=\"pill neutral\">아직 애매함</span>" : pill(false, "", mode === "fan" ? "등분산성 X" : "선형성 X"));
      out.innerHTML =
        "<p>R² = <span class=\"n\">" + r2.toFixed(3) + "</span></p>" +
        "<p>±2 밖의 점 <span class=\"n\">" + outside + "개</span> / 40 <span class=\"muted\">(가정이 맞으면 약 2개)</span></p>" +
        "<p class=\"w-full\" style=\"grid-column:1/-1\">잔차 그림 판단 " + verdict + "</p>";
      var msg;
      if (mode === "ok") msg = "잔차가 0을 중심으로 고르게 퍼진 띠 모양이고, ±2 밖으로 나간 점도 몇 개 안 돼요. 슬라이드 16의 왼쪽 그림처럼 가정이 성립한다고 볼 수 있어요.";
      else if (k < 0.25) msg = "패턴이 약하면 잔차 그림만으로는 판단이 애매해요. 정도를 키워 보세요.";
      else if (mode === "fan") msg = "x가 커질수록 잔차가 넓게 퍼지는 깔때기 모양이에요. 오차의 분산이 x에 따라 달라지니 등분산성 가정이 깨졌어요. 위 산점도만 봐서는 직선이 그럴듯하고 R²도 나쁘지 않다는 점에 주의하세요.";
      else msg = "잔차가 U자 모양으로 휘어 있어요. 직선이 놓친 곡선 패턴이 잔차에 남은 거라 선형성 가정이 깨졌어요. R²가 높게 나와도 잔차 그림을 봐야 하는 이유예요.";
      note.textContent = msg;
    }
    segWire(document.querySelectorAll("#rd10-mode button"), function(b){ mode = b.getAttribute("data-m"); render(); });
    sk.addEventListener("input", render);
    render();
  })();

  /* ---------- 6. 다중공선성: 설명변수끼리 상관이 커지면 ---------- */
  (function(){
    var svg = document.getElementById("mc10-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("mc10-out"), note = document.getElementById("mc10-note");
    var sr = document.getElementById("mc10-r"), vr = document.getElementById("mc10-r-v");
    var n = 30, BETA = 0.45, TC = 2.052, FC = 3.35;   /* t0.025(27), F0.05(2,27) */
    function render(){
      var r = parseFloat(sr.value);
      vr.textContent = f2(r);
      var vif = 1 / (1 - r * r), t = BETA * Math.sqrt(n * (1 - r * r));
      var ssr = n * BETA * BETA * (2 + 2 * r), F = (ssr / 2) / 1, R2 = ssr / (ssr + (n - 3));
      clear(svg);
      var L = 150, Rr = 490;
      var rows = [
        {label: "집 크기 |t|", v: t, max: 3.2, crit: TC, ct: "2.05"},
        {label: "방 개수 |t|", v: t, max: 3.2, crit: TC, ct: "2.05"},
        {label: "모형 전체 F", v: F, max: 13, crit: FC, ct: "3.35"}];
      rows.forEach(function(row, i){
        var y = 18 + i * 46, W = Rr - L, ok = row.v > row.crit;
        txt(svg, L - 10, y + 19, "w4-leg", row.label, "text-anchor:end;font-size:14px");
        el("rect", {x: L, y: y, width: W, height: 26, rx: 4, style: "fill:var(--surface);stroke:var(--rule)"}, svg);
        el("rect", {x: L, y: y, width: Math.min(row.v / row.max, 1) * W, height: 26, rx: 4, style: "fill:" + (ok ? "var(--green)" : "var(--red)")}, svg);
        var cx = L + row.crit / row.max * W;
        el("line", {x1: cx, x2: cx, y1: y - 4, y2: y + 30, style: "stroke:var(--ink);stroke-width:2"}, svg);
        txt(svg, cx, y - 6, "svg-t", "기준 " + row.ct, "font-size:11px");
        txt(svg, Rr + 6, y + 19, "w4-leg", f2(row.v), "text-anchor:start;font-size:14px");
      });
      txt(svg, L, 160, "w4-leg", "초록 = 기준을 넘음(유의) · 빨강 = 기준 못 넘음", "text-anchor:start;font-size:12px");
      out.innerHTML =
        "<p>두 변수의 상관 ρ = <span class=\"n\">" + f2(r) + "</span></p>" +
        "<p>계수의 표준오차 <span class=\"n\">" + Math.sqrt(vif).toFixed(2) + "배</span> <span class=\"muted\">(상관이 0일 때 대비)</span></p>" +
        "<p>개별 t검정 " + pill(t > TC, "둘 다 유의", "둘 다 유의하지 않음") + "</p>" +
        "<p>모형 전체 F검정 " + pill(F > FC, "유의", "유의하지 않음") + " <span class=\"muted\">(R² ≈ " + R2.toFixed(2) + ")</span></p>";
      var msg;
      if (t > TC) msg = "두 설명변수의 상관이 작을 때는 각자 설명하는 부분이 따로 있어서, 모형 전체도 유의하고 변수 하나하나도 유의해요. 상관을 키워 보세요.";
      else msg = "두 변수가 설명하는 부분이 크게 겹쳐서, 둘 중 누구 덕분인지 가려내기 어려워졌어요. 그래서 계수의 표준오차가 커지고 개별 t검정은 둘 다 유의하지 않은데, 둘이 함께 설명하는 양은 줄지 않아서 모형 전체 F는 여전히 유의해요. 이게 다중공선성이에요. 대처는 겹치는 변수 하나를 빼는 거예요.";
      note.textContent = msg;
    }
    sr.addEventListener("input", render);
    render();
  })();
})();
