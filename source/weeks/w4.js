(function(){
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent){
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, cls, s){ var t = el("text", {x: x, y: y, "class": cls}, parent); t.textContent = s; return t; }
  function clear(node){ while (node.firstChild) node.removeChild(node.firstChild); }
  function segWire(buttons, onPick){
    Array.prototype.forEach.call(buttons, function(b){
      b.addEventListener("click", function(){
        Array.prototype.forEach.call(buttons, function(o){ var on = o === b; o.classList.toggle("on", on); o.setAttribute("aria-pressed", on); });
        onPick(b);
      });
    });
  }
  function comb(a, b){
    if (b < 0 || b > a) return 0;
    b = Math.min(b, a - b);
    var r = 1;
    for (var i = 1; i <= b; i++) r = r * (a - b + i) / i;
    return r;
  }
  function npdf(x, m, s){ var z = (x - m) / s; return Math.exp(-0.5 * z * z) / (s * Math.sqrt(2 * Math.PI)); }
  /* 표준정규 누적확률 (오차 1e-7 이하) */
  function Phi(z){
    var a = Math.abs(z), t = 1 / (1 + 0.2316419 * a);
    var poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    var up = Math.exp(-0.5 * a * a) / Math.sqrt(2 * Math.PI) * poly;
    return z >= 0 ? 1 - up : up;
  }
  function esc(t){ return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* ---------- 1. 초기하 vs 이항: 모집단 크기 N을 키우면 ---------- */
  (function(){
    var svg = document.getElementById("hy-svg");
    if (!svg) return;
    var out = document.getElementById("hy-out"), note = document.getElementById("hy-note");
    var n = 5, N = 10;
    function render(){
      var D = Math.round(N * 0.3), p = 0.3;
      var hy = [], bi = [], x;
      for (x = 0; x <= n; x++){
        hy.push(comb(D, x) * comb(N - D, n - x) / comb(N, n));
        bi.push(comb(n, x) * Math.pow(p, x) * Math.pow(1 - p, n - x));
      }
      clear(svg);
      var L = 20, R = 540, T = 44, B = 208, ymax = 0.5, gw = (R - L) / (n + 1), bw = 32;
      function Y(v){ return B - v / ymax * (B - T); }
      el("rect", {x: L + 4, y: 8, width: 12, height: 12, rx: 2, "class": "w4-bar-o"}, svg);
      txt(svg, L + 22, 19, "w4-leg", "초기하 (비복원)");
      el("rect", {x: L + 150, y: 8, width: 12, height: 12, rx: 2, "class": "w4-bar-b"}, svg);
      txt(svg, L + 168, 19, "w4-leg", "이항 (복원)");
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      for (x = 0; x <= n; x++){
        var cx = L + gw * (x + 0.5);
        el("rect", {x: cx - bw - 2, y: Y(hy[x]), width: bw, height: B - Y(hy[x]), rx: 2, "class": "w4-bar-o"}, svg);
        el("rect", {x: cx + 2, y: Y(bi[x]), width: bw, height: B - Y(bi[x]), rx: 2, "class": "w4-bar-b"}, svg);
        txt(svg, cx - bw / 2 - 2, Y(hy[x]) - 5, "svg-t w4-num", hy[x].toFixed(2));
        txt(svg, cx + bw / 2 + 2, Y(bi[x]) - 5, "svg-t w4-num", bi[x].toFixed(2));
        txt(svg, cx, B + 17, "svg-t", String(x));
      }
      txt(svg, (L + R) / 2, B + 36, "svg-t", "당첨 개수 x");
      var fpc = (N - n) / (N - 1), vb = n * p * (1 - p);
      out.innerHTML =
        "<p>복원: P(X<sub>2</sub>=1 | X<sub>1</sub>=1) = 3/10 = <span class=\"n\">0.300</span></p>" +
        "<p>비복원: P(X<sub>2</sub>=1 | X<sub>1</sub>=1) = " + (D - 1) + "/" + (N - 1) + " = <span class=\"n\">" + ((D - 1) / (N - 1)).toFixed(3) + "</span></p>" +
        "<p>FPC = (N − n)/(N − 1) = " + (N - n) + "/" + (N - 1) + " = <span class=\"n\">" + fpc.toFixed(3) + "</span></p>" +
        "<p>분산: 이항 <span class=\"n\">" + vb.toFixed(3) + "</span> · 초기하 <span class=\"n\">" + (vb * fpc).toFixed(3) + "</span></p>";
      var msg;
      if (N <= 10) msg = "10개 중 5개를 뽑으면 하나를 뽑을 때마다 남은 것의 구성이 크게 바뀌어요. 조건부확률이 3/10과 많이 다르고, 초기하분포가 이항분포보다 눈에 띄게 좁아요. 분산이 FPC만큼 작기 때문이에요.";
      else if (N <= 50) msg = "N이 커지면 하나를 뽑은 영향이 줄어들어요. 조건부확률이 3/10에 가까워지고 FPC도 1에 가까워져요. 평균은 처음부터 끝까지 np = 1.5로 같아요.";
      else if (N <= 100) msg = "N = 100이면 막대 높이가 거의 같아졌어요. 분산도 FPC가 1에 가까운 만큼만 차이 나요.";
      else msg = "N이 n보다 월등히 크면 FPC ≈ 1이라 두 분포를 구분하기 어려워요. 그래서 모집단이 크면 초기하분포를 이항분포로 근사해서 풀어요.";
      note.textContent = msg;
    }
    segWire(document.querySelectorAll("#hy-N button"), function(b){ N = parseInt(b.getAttribute("data-n"), 10); render(); });
    render();
  })();

  /* ---------- 2. 표준오차: n일 평균의 분포 ---------- */
  (function(){
    var svg = document.getElementById("se-svg");
    if (!svg) return;
    var slider = document.getElementById("se-n"), sv = document.getElementById("se-n-v");
    var out = document.getElementById("se-out"), note = document.getElementById("se-note");
    var MU = 50, SIG = 10, CUT = 52, LO = 20, HI = 80;
    function render(){
      var n = parseInt(slider.value, 10), se = SIG / Math.sqrt(n);
      clear(svg);
      var L = 20, R = 540, T = 30, B = 218, ymax = 0.42;
      function X(v){ return L + (v - LO) / (HI - LO) * (R - L); }
      function Y(d){ return B - Math.min(d, ymax) / ymax * (B - T); }
      function path(s, from, to, close){
        var pts = [], steps = 300, i, v;
        for (i = 0; i <= steps; i++){ v = from + (to - from) * i / steps; pts.push(X(v).toFixed(1) + "," + Y(npdf(v, MU, s)).toFixed(1)); }
        if (close){ pts.push(X(to).toFixed(1) + "," + B); pts.push(X(from).toFixed(1) + "," + B); }
        return pts.join(" ");
      }
      el("polygon", {points: path(SIG, LO, HI, true), "class": "w4-area-b"}, svg);
      el("polygon", {points: path(se, CUT, HI, true), "class": "w4-area-o"}, svg);
      el("polyline", {points: path(SIG, LO, HI, false), "class": "w4-line-b"}, svg);
      el("polyline", {points: path(se, LO, HI, false), "class": "w4-line-o"}, svg);
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      el("line", {x1: X(CUT), x2: X(CUT), y1: T - 6, y2: B, "class": "w4-cut"}, svg);
      txt(svg, X(CUT) + 14, T - 10, "w4-cut-t", "52");
      for (var v = 20; v <= 80; v += 10) txt(svg, X(v), B + 17, "svg-t", String(v));
      txt(svg, (L + R) / 2, B + 36, "svg-t", "통학시간 (분)");
      txt(svg, L + 4, 16, "w4-leg b", "하루 통학시간 X");
      txt(svg, L + 4, 34, "w4-leg o", n + "일 평균 X̄");
      sv.textContent = String(n);
      /* 표준정규분포표로 푼 값과 맞도록 z를 소수 둘째 자리로 반올림해서 계산 */
      var z = Math.round((CUT - MU) / se * 100) / 100, pr = 1 - Phi(z);
      out.innerHTML =
        "<p>SE(X̄) = 10/√" + n + " = <span class=\"n\">" + se.toFixed(2) + "</span>분</p>" +
        "<p>P(X̄ &gt; 52) = P(Z &gt; " + z.toFixed(2) + ") = <span class=\"n\">" + pr.toFixed(4) + "</span></p>" +
        "<p class=\"muted\">하루: P(X &gt; 52) = P(Z &gt; 0.20) = 0.4207</p>";
      var msg;
      if (n === 1) msg = "n = 1이면 X̄가 곧 하루 통학시간이라 두 곡선이 겹쳐요.";
      else if (n === 25) msg = "n = 25이면 표준오차가 10분의 1/5인 2분이에요. 25일 평균이 52분을 넘을 확률이, 하루 통학시간이 60분을 넘을 확률 0.1587과 같아요.";
      else if (n < 25) msg = "며칠 치만 평균을 내도 X̄의 분포가 50분 주변으로 모이기 시작해요. 하루는 52분을 넘기 쉽지만 평균은 그보다 덜 넘어요.";
      else msg = "n이 커질수록 X̄의 분포가 50분 주변으로 좁아져서, 평균이 52분을 넘는 일은 점점 드물어져요. 하루 통학시간의 분포(파란 곡선)는 그대로예요.";
      note.textContent = msg;
    }
    slider.addEventListener("input", render);
    render();
  })();

  /* ---------- 3. 연속성 수정: 부등호와 경계 ---------- */
  (function(){
    var svg = document.getElementById("cc-svg");
    if (!svg) return;
    var slider = document.getElementById("cc-k"), sv = document.getElementById("cc-k-v");
    var out = document.getElementById("cc-out"), note = document.getElementById("cc-note");
    var NN = 20, P = 0.3, MU = NN * P, SD = Math.sqrt(NN * P * (1 - P)), XMAX = 15;
    var pmf = [], i;
    for (i = 0; i <= NN; i++) pmf.push(comb(NN, i) * Math.pow(P, i) * Math.pow(1 - P, NN - i));
    var type = "le";
    function h(v){ return (Math.round(v * 10) / 10).toFixed(1); }
    function render(){
      var k = parseInt(slider.value, 10);
      /* 포함되는 정수 범위 [a, b] */
      var a = 0, b = NN;
      if (type === "le") b = k;
      else if (type === "lt") b = k - 1;
      else if (type === "ge") a = k;
      else if (type === "gt") a = k + 1;
      else { a = k; b = k; }
      var exact = 0;
      for (i = a; i <= b; i++) exact += pmf[i];
      var lo = a === 0 ? -Infinity : a - 0.5, hi = b === NN ? Infinity : b + 0.5;
      function cdf(v){ return v === Infinity ? 1 : v === -Infinity ? 0 : Phi((v - MU) / SD); }
      var withCC = cdf(hi) - cdf(lo);
      var naive = type === "le" || type === "lt" ? cdf(k) : type === "eq" ? 0 : 1 - cdf(k);

      clear(svg);
      var L = 14, R = 546, T = 36, B = 226, ymax = 0.215, u = (R - L) / (XMAX + 1);
      function X(v){ return L + (v + 0.5) * u; }
      function Y(d){ return B - d / ymax * (B - T); }
      for (i = 0; i <= XMAX; i++){
        el("rect", {x: X(i - 0.5) + 1, y: Y(pmf[i]), width: u - 2, height: B - Y(pmf[i]), "class": (i >= a && i <= b) ? "w4-bar-o" : "w4-bar-g"}, svg);
        txt(svg, X(i), B + 16, "svg-t", String(i));
      }
      var s0 = Math.max(lo, -0.5), s1 = Math.min(hi, XMAX + 0.5), pts = [], steps = 200, v;
      for (i = 0; i <= steps; i++){ v = s0 + (s1 - s0) * i / steps; pts.push(X(v).toFixed(1) + "," + Y(npdf(v, MU, SD)).toFixed(1)); }
      pts.push(X(s1).toFixed(1) + "," + B); pts.push(X(s0).toFixed(1) + "," + B);
      el("polygon", {points: pts.join(" "), "class": "w4-area-b strong"}, svg);
      pts = [];
      for (i = 0; i <= 320; i++){ v = -0.5 + (XMAX + 1) * i / 320; pts.push(X(v).toFixed(1) + "," + Y(npdf(v, MU, SD)).toFixed(1)); }
      el("polyline", {points: pts.join(" "), "class": "w4-line-b"}, svg);
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      [lo, hi].forEach(function(c){
        if (!isFinite(c)) return;
        el("line", {x1: X(c), x2: X(c), y1: T - 8, y2: B, "class": "w4-cut"}, svg);
        txt(svg, X(c), T - 14, "w4-cut-t", h(c));
      });
      txt(svg, (L + R) / 2, B + 36, "svg-t", "주황 막대: 이항분포에서 더하는 막대 · 파란 넓이: 연속성 수정한 정규근사");

      sv.textContent = String(k);
      var eLab, cLab, nLab, msg;
      if (type === "le"){
        eLab = "P(X ≤ " + k + ")"; cLab = "P(Y ≤ " + h(hi) + ")"; nLab = "P(Y ≤ " + k + ")";
        msg = "막대 " + k + "까지 포함하니까, 그 막대의 오른쪽 끝인 " + h(hi) + "까지 넓이를 구해요.";
      } else if (type === "lt"){
        eLab = "P(X < " + k + ") = P(X ≤ " + (k - 1) + ")"; cLab = "P(Y ≤ " + h(hi) + ")"; nLab = "P(Y < " + k + ")";
        msg = "먼저 \"≤ 정수\" 꼴로 바꿔요: X ≤ " + (k - 1) + ". 막대 " + (k - 1) + "까지 포함하니까, 그 막대의 오른쪽 끝인 " + h(hi) + "까지 넓이를 구해요.";
      } else if (type === "ge"){
        eLab = "P(X ≥ " + k + ")"; cLab = "P(Y ≥ " + h(lo) + ")"; nLab = "P(Y ≥ " + k + ")";
        msg = "막대 " + k + "부터 포함하니까, 그 막대의 왼쪽 끝인 " + h(lo) + "부터 넓이를 구해요.";
      } else if (type === "gt"){
        eLab = "P(X > " + k + ") = P(X ≥ " + (k + 1) + ")"; cLab = "P(Y ≥ " + h(lo) + ")"; nLab = "P(Y > " + k + ")";
        msg = "먼저 \"≥ 정수\" 꼴로 바꿔요: X ≥ " + (k + 1) + ". 막대 " + (k + 1) + "부터 포함하니까, 그 막대의 왼쪽 끝인 " + h(lo) + "부터 넓이를 구해요.";
      } else {
        eLab = "P(X = " + k + ")"; cLab = "P(" + h(lo) + " ≤ Y ≤ " + h(hi) + ")"; nLab = "P(Y = " + k + ")";
        msg = "막대 " + k + " 하나만 포함하니까, " + h(lo) + "부터 " + h(hi) + "까지 넓이를 구해요. 수정하지 않으면 연속형에서 한 점의 확률은 0이라 답이 0이 돼요.";
      }
      out.innerHTML =
        "<p>이항분포 그대로: " + esc(eLab) + " = <span class=\"n\">" + exact.toFixed(4) + "</span></p>" +
        "<p>연속성 수정: " + esc(cLab) + " = <span class=\"n\">" + withCC.toFixed(4) + "</span></p>" +
        "<p class=\"muted\">수정 없이: " + esc(nLab) + " = " + naive.toFixed(4) + "</p>";
      note.textContent = msg;
    }
    slider.addEventListener("input", render);
    segWire(document.querySelectorAll("#cc-type button"), function(b){ type = b.getAttribute("data-t"); render(); });
    render();
  })();
})();
