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
  function segWire(buttons, onPick){
    Array.prototype.forEach.call(buttons, function(b){
      b.addEventListener("click", function(){
        Array.prototype.forEach.call(buttons, function(o){ var on = o === b; o.classList.toggle("on", on); o.setAttribute("aria-pressed", on); });
        onPick(b);
      });
    });
  }
  function svgBox(svg){
    svg.setAttribute("style", "width:100%;height:auto;display:block;background:var(--ground);border-radius:10px;margin-top:6px");
  }
  function npdf(x, m, s){ var z = (x - m) / s; return Math.exp(-0.5 * z * z) / (s * Math.sqrt(2 * Math.PI)); }
  /* 표준정규 누적확률 (오차 1e-7 이하) */
  function Phi(z){
    var a = Math.abs(z), t = 1 / (1 + 0.2316419 * a);
    var poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    var up = Math.exp(-0.5 * a * a) / Math.sqrt(2 * Math.PI) * poly;
    return z >= 0 ? 1 - up : up;
  }
  function randn(){
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function path(pts){ return pts.map(function(p, i){ return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(""); }
  function area(pts, base){
    if (!pts.length) return "";
    return path(pts) + "L" + pts[pts.length - 1][0].toFixed(1) + " " + base + "L" + pts[0][0].toFixed(1) + " " + base + "Z";
  }
  var C = {
    blue: "var(--blue)", orange: "var(--orange)", red: "var(--red)", ink: "var(--ink)", muted: "var(--muted)", rule: "var(--rule)"
  };

  /* ---------- 1. 신뢰구간 40개: 신뢰수준의 의미 ---------- */
  (function(){
    var svg = document.getElementById("ci-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("ci-out"), note = document.getElementById("ci-note");
    var MU = 50, SIG = 10, N = 16, SE = SIG / Math.sqrt(N), K = 40;
    var Z = {90: 1.645, 95: 1.960, 99: 2.576};
    var lv = 95, means = [], tally = {90: [0, 0], 95: [0, 0], 99: [0, 0]};
    function draw(){
      means = [];
      for (var i = 0; i < K; i++) means.push(MU + SE * randn());
      count();
      render();
    }
    function count(){
      var hit = 0, half = Z[lv] * SE;
      means.forEach(function(m){ if (Math.abs(m - MU) <= half) hit++; });
      tally[lv][0] += hit; tally[lv][1] += K;
    }
    function render(){
      clear(svg);
      var L = 20, R = 490, T = 14, B = 256, lo = MU - 16, hi = MU + 16, half = Z[lv] * SE, hit = 0;
      function Y(v){ return B - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (B - T); }
      var gw = (R - L) / K;
      means.forEach(function(m, i){
        var ok = Math.abs(m - MU) <= half; if (ok) hit++;
        var x = L + gw * (i + 0.5), col = ok ? C.orange : C.red;
        el("line", {x1: x, x2: x, y1: Y(m - half), y2: Y(m + half), style: "stroke:" + col + ";stroke-width:" + (ok ? 2.4 : 3.2)}, svg);
        el("circle", {cx: x, cy: Y(m), r: 2.6, style: "fill:" + col}, svg);
      });
      el("line", {x1: L - 6, x2: R + 4, y1: Y(MU), y2: Y(MU), style: "stroke:" + C.blue + ";stroke-width:2"}, svg);
      txt(svg, R + 10, Y(MU) + 5, "w4-leg b", "μ = 50", "text-anchor:start");
      var cum = tally[lv];
      out.innerHTML =
        "<p>이번 40개 중 μ를 포함: <span class=\"n\">" + hit + "개</span> <span class=\"muted\">(놓침 " + (K - hit) + "개)</span></p>" +
        "<p>" + lv + "% 구간 폭: <span class=\"n\">" + (2 * half).toFixed(2) + "</span> <span class=\"muted\">(" + Z[lv].toFixed(3) + " × 2.5 × 2)</span></p>" +
        "<p>지금까지 " + lv + "% 구간 <span class=\"n\">" + cum[1] + "개</span> 중 포함 <span class=\"n\">" + cum[0] + "개</span></p>" +
        "<p>누적 포함 비율: <span class=\"n\">" + (cum[1] ? (100 * cum[0] / cum[1]).toFixed(1) : "0.0") + "%</span></p>";
      var msg;
      if (cum[1] <= K) msg = "μ는 가로선에 그대로 있고, 표본마다 구간이 위아래로 움직여요. 40개 중 몇 개가 μ를 놓쳤는지 세어 보고, 여러 번 다시 뽑아 보세요.";
      else if (cum[1] < 400) msg = "한 번에 놓치는 개수는 그때그때 달라요. 그래도 누적 비율은 " + lv + "% 근처로 모여 가요. " + lv + "%는 구간 하나의 성질이 아니라 구간을 만드는 방법의 적중률이에요.";
      else msg = "구간을 " + cum[1] + "개나 만들었어요. 누적 비율이 " + lv + "%에 아주 가까워졌죠? 신뢰수준을 바꿔 보면 구간이 넓어지거나 좁아지면서 놓치는 비율도 함께 달라져요.";
      note.textContent = msg;
    }
    segWire(document.querySelectorAll("#ci-lv button"), function(b){ lv = parseInt(b.getAttribute("data-lv"), 10); render(); });
    document.getElementById("ci-draw").addEventListener("click", draw);
    document.getElementById("ci-reset").addEventListener("click", function(){ tally = {90: [0, 0], 95: [0, 0], 99: [0, 0]}; render(); });
    draw();
  })();

  /* ---------- 2. α와 β: 유의수준과 표본 크기 ---------- */
  (function(){
    var svg = document.getElementById("ab-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("ab-out"), note = document.getElementById("ab-note");
    var slider = document.getElementById("ab-n"), sv = document.getElementById("ab-n-v");
    var M0 = 50, M1 = 54, SIG = 10, ZA = {"0.10": 1.2816, "0.05": 1.6449, "0.01": 2.3263};
    var a = "0.05", n = 16;
    function render(){
      var se = SIG / Math.sqrt(n), c = M0 + ZA[a] * se;
      var alpha = parseFloat(a), beta = Phi((c - M1) / se), power = 1 - beta;
      clear(svg);
      var L = 20, R = 540, T = 30, B = 206, lo = 40, hi = 66;
      var ymax = npdf(0, 0, SIG / Math.sqrt(64)) * 1.05;
      function X(v){ return L + (v - lo) / (hi - lo) * (R - L); }
      function Y(v){ return B - Math.min(v, ymax) / ymax * (B - T); }
      function curve(m, from, to){
        var pts = [], steps = 160;
        for (var i = 0; i <= steps; i++){ var v = from + (to - from) * i / steps; pts.push([X(v), Y(npdf(v, m, se))]); }
        return pts;
      }
      el("path", {d: area(curve(M1, c, hi), B), style: "fill:" + C.orange + ";opacity:.22"}, svg);
      el("path", {d: area(curve(M1, lo, c), B), style: "fill:" + C.muted + ";opacity:.45"}, svg);
      el("path", {d: area(curve(M0, c, hi), B), style: "fill:" + C.red + ";opacity:.75"}, svg);
      el("path", {d: path(curve(M0, lo, hi)), style: "fill:none;stroke:" + C.blue + ";stroke-width:2.5"}, svg);
      el("path", {d: path(curve(M1, lo, hi)), style: "fill:none;stroke:" + C.ink + ";stroke-width:2;stroke-dasharray:6 4"}, svg);
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      el("line", {x1: X(c), x2: X(c), y1: T - 8, y2: B, style: "stroke:" + C.ink + ";stroke-width:1.4"}, svg);
      txt(svg, X(c), T - 12, "svg-t", "임계값 " + c.toFixed(2), "fill:var(--ink);font-weight:700");
      [40, 45, 50, 54, 60, 65].forEach(function(v){ txt(svg, X(v), B + 17, "svg-t", String(v)); });
      txt(svg, X(M0), B + 34, "w4-leg b", "H₀: μ = 50", "text-anchor:middle");
      txt(svg, X(M1) + 34, B + 34, "w4-leg", "실제 μ = 54", "text-anchor:middle");
      out.innerHTML =
        "<p>임계값 c = 50 + " + ZA[a].toFixed(3) + " × 10/√" + n + " = <span class=\"n\">" + c.toFixed(2) + "</span></p>" +
        "<p><span style=\"color:var(--red);font-weight:700\">α</span> (제1종 오류) = <span class=\"n\">" + alpha.toFixed(2) + "</span></p>" +
        "<p><span style=\"color:var(--muted);font-weight:700\">β</span> (제2종 오류) = <span class=\"n\">" + beta.toFixed(3) + "</span></p>" +
        "<p><span style=\"color:var(--orange);font-weight:700\">1 − β</span> (검정력) = <span class=\"n\">" + power.toFixed(3) + "</span></p>";
      var msg;
      if (n <= 9) msg = "표본이 작으면 두 분포가 넓게 겹쳐요. α를 아무리 지켜도 β가 커서, 실제로 μ = 54인데도 놓치기 쉬워요.";
      else if (beta > 0.3) msg = "α를 줄이면 임계값이 오른쪽으로 가면서 빨간 넓이(α)는 줄고 회색 넓이(β)는 늘어나요. 같은 n에서는 둘을 동시에 줄일 수 없어요.";
      else msg = "n이 커지면 두 분포가 좁아져서 겹치는 부분이 줄어요. α는 정해 둔 그대로인데 β가 작아졌어요. 그래서 α를 먼저 고정하고 n으로 β를 줄여요.";
      note.textContent = msg;
    }
    segWire(document.querySelectorAll("#ab-a button"), function(b){ a = b.getAttribute("data-a"); render(); });
    slider.addEventListener("input", function(){ n = parseInt(slider.value, 10); sv.textContent = n; render(); });
    render();
  })();

  /* ---------- 3. 기각역 vs 유의확률: 관측값 움직이기 ---------- */
  (function(){
    var svg = document.getElementById("rp-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("rp-out"), note = document.getElementById("rp-note");
    var slider = document.getElementById("rp-x"), sv = document.getElementById("rp-x-v");
    var DF = 15, TA = {"0.10": 1.341, "0.05": 1.753, "0.01": 2.602};
    /* t(15) 밀도: Γ(8) / (√(15π) Γ(7.5)) */
    var g75 = Math.sqrt(Math.PI); for (var h = 0.5; h < 7.5; h += 1) g75 *= h;
    var K = 5040 / (Math.sqrt(DF * Math.PI) * g75);
    function tpdf(t){ return K * Math.pow(1 + t * t / DF, -(DF + 1) / 2); }
    function tsf(t){
      var a = t, b = 60, m = 4000, hstep = (b - a) / m, s = tpdf(a) + tpdf(b);
      for (var i = 1; i < m; i++) s += tpdf(a + i * hstep) * (i % 2 ? 4 : 2);
      return s * hstep / 3;
    }
    var a = "0.05", xb = 44.4;
    function render(){
      var t = (xb - 40) / 2, c = TA[a], p = tsf(t), alpha = parseFloat(a);
      var rejRR = t >= c, rejP = p <= alpha;
      clear(svg);
      var L = 20, R = 540, T = 20, B = 196, lo = -4, hi = 5.2, ymax = 0.42;
      function X(v){ return L + (v - lo) / (hi - lo) * (R - L); }
      function Y(v){ return B - v / ymax * (B - T); }
      function curve(from, to){
        var pts = [], steps = 180;
        for (var i = 0; i <= steps; i++){ var v = from + (to - from) * i / steps; pts.push([X(v), Y(tpdf(v))]); }
        return pts;
      }
      el("path", {d: area(curve(Math.max(t, lo), hi), B), style: "fill:" + C.orange + ";opacity:.55"}, svg);
      el("path", {d: area(curve(c, hi), B), style: "fill:" + C.red + ";opacity:.15"}, svg);
      el("line", {x1: X(c), x2: R, y1: B + 0.5, y2: B + 0.5, style: "stroke:" + C.red + ";stroke-width:6;opacity:.8"}, svg);
      txt(svg, R - 4, B - 8, "w4-cut-t", "기각역", "text-anchor:end");
      el("path", {d: path(curve(lo, hi)), style: "fill:none;stroke:" + C.blue + ";stroke-width:2.5"}, svg);
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      el("line", {x1: X(c), x2: X(c), y1: Y(tpdf(c)) - 30, y2: B, "class": "w4-cut"}, svg);
      txt(svg, X(c), Y(tpdf(c)) - 36, "w4-cut-t", "임계값 " + c.toFixed(3));
      var tx = X(Math.max(lo, Math.min(hi, t)));
      el("line", {x1: tx, x2: tx, y1: B - 4, y2: B + 6, style: "stroke:" + C.orange + ";stroke-width:3"}, svg);
      el("circle", {cx: tx, cy: B, r: 5.5, style: "fill:" + C.orange + ";stroke:var(--ground);stroke-width:1.5"}, svg);
      txt(svg, tx, B + 22, "svg-t", "관측값 t = " + t.toFixed(2), "fill:var(--orange);font-weight:700");
      out.innerHTML =
        "<p>t = (" + xb.toFixed(1) + " − 40) / 2 = <span class=\"n\">" + t.toFixed(2) + "</span></p>" +
        "<p>p값 = P(T ≥ " + t.toFixed(2) + ") = <span class=\"n\">" + (p < 0.0001 ? "0.0000" : p.toFixed(4)) + "</span></p>" +
        "<p>기각역 t ≥ " + c.toFixed(3) + " → <span class=\"pill " + (rejRR ? "yes\">H₀ 기각" : "no\">기각 못 함") + "</span></p>" +
        "<p>" + (rejP ? "p값 ≤ " + a : "p값이 " + a + "보다 큼") + " → <span class=\"pill " + (rejP ? "yes\">H₀ 기각" : "no\">기각 못 함") + "</span></p>";
      var msg;
      if (rejRR) msg = "관측값이 빨간 기각역 안에 있어요. 그러면 관측값 오른쪽 주황 넓이(p값)도 빨간 넓이(α) 안에 쏙 들어가서 α보다 작아요. 두 방법의 결론이 같아요.";
      else msg = "관측값이 기각역 밖에 있어요. 그러면 주황 넓이(p값)가 빨간 넓이(α)보다 커서, p값으로 판단해도 기각하지 못해요.";
      if (Math.abs(t - c) < 0.06) msg = "관측값이 임계값과 거의 같아요. 이때 p값이 α와 거의 같아져요. 임계값이란 p값이 정확히 α가 되는 지점이에요.";
      note.textContent = msg;
    }
    segWire(document.querySelectorAll("#rp-a button"), function(b){ a = b.getAttribute("data-a"); render(); });
    slider.addEventListener("input", function(){ xb = parseFloat(slider.value); sv.textContent = xb.toFixed(1); render(); });
    render();
  })();
})();
