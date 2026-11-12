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
  var C = { blue: "var(--blue)", orange: "var(--orange)", red: "var(--red)", ink: "var(--ink)", muted: "var(--muted)" };
  function pill(ok, yes, no){ return "<span class=\"pill " + (ok ? "yes\">" + yes : "no\">" + no) + "</span>"; }
  function f2(v){ return (Math.round(v * 100) / 100).toFixed(2); }
  function f3(v){ return (Math.round(v * 1000) / 1000).toFixed(3); }
  function f4(v){ return (Math.round(v * 10000) / 10000).toFixed(4); }

  /* 이항분포 확률 (로그로 계산해서 n = 200까지 안전) */
  function lgamma(z){
    var g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
    z -= 1; var x = c[0];
    for (var i = 1; i < g + 2; i++) x += c[i] / (z + i);
    var t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  function binom(n, k, p){
    return Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }

  /* ---------- 1. 표본비율의 분포: 언제 정규근사가 맞나 ---------- */
  (function(){
    var svg = document.getElementById("pb8-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("pb8-out"), note = document.getElementById("pb8-note");
    var sn = document.getElementById("pb8-n"), sp = document.getElementById("pb8-p");
    var vn = document.getElementById("pb8-n-v"), vp = document.getElementById("pb8-p-v");
    function render(){
      var n = parseInt(sn.value, 10), p = parseFloat(sp.value);
      vn.textContent = n; vp.textContent = f2(p);
      var sd = Math.sqrt(p * (1 - p) / n);
      clear(svg);
      var L = 30, R = 540, B = 175, T = 22;
      function X(v){ return L + v * (R - L); }
      var probs = [], maxp = 0;
      for (var k = 0; k <= n; k++){ var q = binom(n, k, p); probs.push(q); if (q > maxp) maxp = q; }
      /* 막대 높이 = 확률 ÷ 폭(1/n) → 밀도 단위로 맞춰 정규 곡선과 비교 */
      var dens = probs.map(function(q){ return q * n; });
      var peakN = 1 / (sd * Math.sqrt(2 * Math.PI));
      var top = Math.max(Math.max.apply(null, dens), peakN) * 1.08;
      function Y(d){ return B - d / top * (B - T); }
      var bw = Math.max(1, (R - L) / n * 0.8);
      for (k = 0; k <= n; k++){
        if (dens[k] < top * 0.002) continue;
        var x = X(k / n);
        el("rect", {x: x - bw / 2, y: Y(dens[k]), width: bw, height: B - Y(dens[k]), style: "fill:" + C.orange + ";opacity:.55"}, svg);
      }
      var d = "";
      for (var i = 0; i <= 300; i++){
        var v = i / 300, z = (v - p) / sd, f = Math.exp(-0.5 * z * z) * peakN;
        d += (i ? " L" : "M") + X(v).toFixed(1) + " " + Y(f).toFixed(1);
      }
      el("path", {d: d, style: "fill:none;stroke:" + C.blue + ";stroke-width:2.2"}, svg);
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      [0, 0.25, 0.5, 0.75, 1].forEach(function(t){
        el("line", {x1: X(t), x2: X(t), y1: B, y2: B + 4, "class": "ax"}, svg);
        txt(svg, X(t), B + 19, "svg-t", String(t));
      });
      el("line", {x1: X(p), x2: X(p), y1: T - 6, y2: B, style: "stroke:" + C.red + ";stroke-width:1.5;stroke-dasharray:4 3"}, svg);
      txt(svg, X(p), T - 9, "svg-t", "p", "fill:var(--red);font-weight:700");
      /* 정규근사가 0 아래나 1 위로 넘치는 비율 */
      function Phi(z){ var t = 1 / (1 + 0.2316419 * Math.abs(z)), y = 0.3989423 * Math.exp(-z * z / 2) * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - y : y; }
      var spill = Phi((0 - p) / sd) + (1 - Phi((1 - p) / sd));
      var a = n * p, b = n * (1 - p), ok = a >= 5 && b >= 5;
      out.innerHTML =
        "<p>np = " + n + " × " + f2(p) + " = <span class=\"n\">" + f2(a) + "</span>, n(1 − p) = <span class=\"n\">" + f2(b) + "</span> " + pill(ok, "조건 만족", "조건 불만족") + "</p>" +
        "<p>표준오차 √(p(1 − p)/n) = <span class=\"n\">" + f4(sd) + "</span></p>" +
        "<p>정규 곡선이 0보다 작거나 1보다 큰 쪽으로 넘친 넓이 = <span class=\"n\">" + f3(spill) + "</span> <span class=\"muted\">(비율은 0~1 밖으로 못 나가요)</span></p>";
      var msg;
      if (!ok) msg = "성공이나 실패의 기댓값이 5보다 작으면 막대가 한쪽(0 또는 1 근처)으로 쏠려서 좌우 대칭인 정규 곡선과 잘 안 맞아요. n을 키워 보세요.";
      else if (n < 60) msg = "조건을 만족하면 막대가 대체로 종 모양을 따라가요. n을 더 키우면 막대가 촘촘해지고 곡선과 더 잘 겹치면서, 폭(표준오차)도 좁아져요.";
      else msg = "n이 크면 막대와 곡선이 거의 겹쳐요. p가 0이나 1에 가까울수록 같은 n에서도 덜 맞으니, p를 0.03처럼 극단으로 옮겨 보세요.";
      note.textContent = msg;
    }
    sn.addEventListener("input", render); sp.addEventListener("input", render);
    render();
  })();

  /* ---------- 2. 합동표본비율: 표본 크기로 가중한 평균은 어디에 놓이나 ---------- */
  (function(){
    var svg = document.getElementById("pp8-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("pp8-out"), note = document.getElementById("pp8-note");
    var ids = ["n1", "p1", "n2", "p2"], sl = {}, vs = {};
    ids.forEach(function(i){ sl[i] = document.getElementById("pp8-" + i); vs[i] = document.getElementById("pp8-" + i + "-v"); });
    function render(){
      var n1 = parseInt(sl.n1.value, 10), n2 = parseInt(sl.n2.value, 10);
      var p1 = parseFloat(sl.p1.value), p2 = parseFloat(sl.p2.value);
      vs.n1.textContent = n1; vs.n2.textContent = n2; vs.p1.textContent = f2(p1); vs.p2.textContent = f2(p2);
      var x1 = Math.round(n1 * p1), x2 = Math.round(n2 * p2);
      var ph = (n1 * p1 + n2 * p2) / (n1 + n2), avg = (p1 + p2) / 2;
      var seP = Math.sqrt(ph * (1 - ph) * (1 / n1 + 1 / n2));
      var seE = Math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2);
      var z = (p1 - p2) / seP;
      clear(svg);
      var L = 30, R = 530, Yl = 92;
      function X(v){ return L + v * (R - L); }
      el("line", {x1: L, x2: R, y1: Yl, y2: Yl, "class": "ax"}, svg);
      [0, 0.25, 0.5, 0.75, 1].forEach(function(t){
        el("line", {x1: X(t), x2: X(t), y1: Yl - 4, y2: Yl + 4, "class": "ax"}, svg);
        txt(svg, X(t), Yl + 22, "svg-t", String(t));
      });
      var r1 = 5 + 12 * Math.sqrt(n1 / (n1 + n2)), r2 = 5 + 12 * Math.sqrt(n2 / (n1 + n2));
      el("circle", {cx: X(p1), cy: Yl, r: r1, style: "fill:" + C.blue + ";opacity:.55"}, svg);
      el("circle", {cx: X(p2), cy: Yl, r: r2, style: "fill:" + C.orange + ";opacity:.55"}, svg);
      /* 두 점이 가까우면 이름표를 바깥쪽으로 벌려서 겹치지 않게 (축 눈금 숫자와도 안 겹치게 위쪽 유지) */
      var close = Math.abs(X(p1) - X(p2)) < 80, s1 = p1 <= p2 ? -1 : 1;
      function lx(v, s){ return Math.min(R - 30, Math.max(L + 30, X(v) + (close ? s * 32 : 0))); }
      txt(svg, lx(p1, s1), Yl - r1 - 6, "svg-t", "표본비율 1", "fill:var(--blue);font-weight:700");
      txt(svg, lx(p2, -s1), Yl - r2 - 6, "svg-t", "표본비율 2", "fill:var(--orange);font-weight:700");
      el("line", {x1: X(avg), x2: X(avg), y1: Yl + 30, y2: Yl + 44, style: "stroke:" + C.muted + ";stroke-width:2;stroke-dasharray:3 3"}, svg);
      txt(svg, X(avg), Yl + 56, "svg-t", "단순평균", "font-size:12px");
      el("path", {d: "M" + X(ph) + " " + (Yl - 34) + " l-7 -12 h14 z", style: "fill:" + C.red}, svg);
      txt(svg, X(ph), Yl - 52, "svg-t", "합동표본비율", "fill:var(--red);font-weight:700");
      var rej = Math.abs(z) >= 1.96;
      out.innerHTML =
        "<p>성공 개수 ≈ <span class=\"c-mu\">" + x1 + "</span>, <span class=\"c-xb\">" + x2 + "</span> → 합동표본비율 = (X₁ + X₂) ÷ (n₁ + n₂) = <span class=\"n\">" + f4(ph) + "</span> <span class=\"muted\">(단순평균 " + f4(avg) + ")</span></p>" +
        "<p>합동비율로 구한 SE = <span class=\"n\">" + f4(seP) + "</span> <span class=\"muted\">(H₀: p₁ = p₂ 검정)</span></p>" +
        "<p>각자 비율로 구한 SE = <span class=\"n\">" + f4(seE) + "</span> <span class=\"muted\">(H₀: p₁ − p₂ = D, 신뢰구간)</span></p>" +
        "<p>H₀: p₁ = p₂의 z = <span class=\"n\">" + f2(z) + "</span> " + pill(rej, "기각", "기각 못 함") + " <span class=\"muted\">(양측 5%, 기준 1.96)</span></p>";
      var msg;
      if (Math.abs(p1 - p2) < 1e-9) msg = "두 표본비율이 같으면 합동비율도 같은 값이고, 두 SE도 같아져요.";
      else if (n1 === n2) msg = "두 표본 크기가 같으면 비중이 같아서 합동비율이 단순평균과 같아져요.";
      else msg = "표본이 더 큰 " + (n1 > n2 ? "첫 번째(파랑)" : "두 번째(주황)") + " 쪽 비중이 커서, 합동비율이 단순평균보다 그쪽으로 끌려가요. 두 SE는 비슷하지만 같지는 않아서, 귀무가설에 맞는 쪽을 골라 써야 해요.";
      note.textContent = msg;
    }
    ids.forEach(function(i){ sl[i].addEventListener("input", render); });
    render();
  })();
})();
