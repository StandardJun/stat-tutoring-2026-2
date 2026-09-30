(function(){
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent){
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function clear(node){ while (node.firstChild) node.removeChild(node.firstChild); }
  function gcd(a, b){ return b ? gcd(b, a % b) : a; }
  function fr(a, b){ if (a === 0) return "0"; var g = gcd(a, b); a /= g; b /= g; return b === 1 ? String(a) : a + "/" + b; }
  function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function segWire(buttons, onPick){
    Array.prototype.forEach.call(buttons, function(b){
      b.addEventListener("click", function(){
        Array.prototype.forEach.call(buttons, function(o){ var on = o === b; o.classList.toggle("on", on); o.setAttribute("aria-pressed", on); });
        onPick(b);
      });
    });
  }

  /* ---------- 1. 결합분포표: 칸을 눌러 주변확률의 곱과 비교 ---------- */
  (function(){
    var table = document.getElementById("jt-table");
    if (!table) return;
    var out = document.getElementById("jt-out");
    /* 분모 8. 행 = Y, 열 = X */
    var SETS = {
      a: { xs: [0, 1, 2, 3], ys: [0, 1], cells: [[1, 2, 1, 0], [0, 1, 2, 1]] },
      b: { xs: [0, 1, 2],    ys: [0, 1], cells: [[1, 2, 1],    [1, 2, 1]] }
    };
    var cur = "a", sel = [0, 0];
    function build(){
      var S = SETS[cur], nx = S.xs.length, ny = S.ys.length;
      var colSum = [], rowSum = [];
      for (var i = 0; i < nx; i++){ colSum[i] = 0; for (var j = 0; j < ny; j++) colSum[i] += S.cells[j][i]; }
      for (var j2 = 0; j2 < ny; j2++){ rowSum[j2] = 0; for (var i2 = 0; i2 < nx; i2++) rowSum[j2] += S.cells[j2][i2]; }
      clear(table);
      var thead = document.createElement("thead"), tr = document.createElement("tr");
      var c0 = document.createElement("th"); c0.scope = "col"; c0.textContent = "Y∖X"; tr.appendChild(c0);
      S.xs.forEach(function(x){ var th = document.createElement("th"); th.scope = "col"; th.textContent = x; tr.appendChild(th); });
      var thm = document.createElement("th"); thm.scope = "col"; thm.textContent = "합"; thm.className = "mg"; tr.appendChild(thm);
      thead.appendChild(tr); table.appendChild(thead);
      var tbody = document.createElement("tbody");
      var matches = 0;
      for (var r = 0; r < ny; r++){
        var row = document.createElement("tr");
        var th = document.createElement("th"); th.scope = "row"; th.textContent = S.ys[r]; row.appendChild(th);
        for (var c = 0; c < nx; c++){
          var td = document.createElement("td");
          var btn = document.createElement("button");
          btn.type = "button"; btn.className = "jt-cell";
          btn.textContent = S.cells[r][c] ? S.cells[r][c] + "/8" : "0";
          btn.setAttribute("aria-label", "X = " + S.xs[c] + ", Y = " + S.ys[r] + " 칸, " + (S.cells[r][c] ? S.cells[r][c] + "/8" : "0"));
          if (r === sel[0] && c === sel[1]) btn.classList.add("sel");
          (function(rr, cc){ btn.addEventListener("click", function(){ sel = [rr, cc]; build(); }); })(r, c);
          if (S.cells[r][c] * 8 === colSum[c] * rowSum[r]) matches++;
          td.appendChild(btn); row.appendChild(td);
        }
        var tdm = document.createElement("td"); tdm.className = "mg" + (r === sel[0] ? " hl" : ""); tdm.textContent = fr(rowSum[r], 8); row.appendChild(tdm);
        tbody.appendChild(row);
      }
      var last = document.createElement("tr");
      var thl = document.createElement("th"); thl.scope = "row"; thl.textContent = "합"; thl.className = "mg"; last.appendChild(thl);
      for (var c2 = 0; c2 < nx; c2++){ var t2 = document.createElement("td"); t2.className = "mg" + (c2 === sel[1] ? " hl" : ""); t2.textContent = fr(colSum[c2], 8); last.appendChild(t2); }
      var one = document.createElement("td"); one.textContent = "1"; last.appendChild(one);
      tbody.appendChild(last); table.appendChild(tbody);

      var x = S.xs[sel[1]], y = S.ys[sel[0]];
      var pxy = S.cells[sel[0]][sel[1]], px = colSum[sel[1]], py = rowSum[sel[0]];
      var same = pxy * 8 === px * py;
      var total = nx * ny;
      out.innerHTML =
        "<p>p(" + x + ", " + y + ") = <span class=\"n\">" + (pxy ? pxy + "/8" : "0") + "</span></p>" +
        "<p>p<sub>X</sub>(" + x + ") × p<sub>Y</sub>(" + y + ") = " + fr(px, 8) + " × " + fr(py, 8) + " = <span class=\"n\">" + fr(px * py, 64) + "</span></p>" +
        "<div class=\"verdict\"><span class=\"pill " + (same ? "yes" : "no") + "\">" + (same ? "이 칸은 곱과 같음" : "이 칸은 곱과 다름") + "</span>" +
        "<span class=\"pill " + (matches === total ? "yes" : "no") + "\">" +
        (matches === total ? "모든 칸(" + total + "칸)이 곱과 같음 → 독립" : "곱과 같은 칸 " + matches + " / " + total + " → 독립 아님") + "</span></div>";
    }
    segWire(document.querySelectorAll("#jt .seg button"), function(b){ cur = b.getAttribute("data-set"); sel = [0, 0]; build(); });
    build();
  })();

  /* ---------- 2. 산점도: 공분산은 단위에 따라, 상관계수는 그대로 ---------- */
  (function(){
    var svg = document.getElementById("cr-svg");
    if (!svg) return;
    var slider = document.getElementById("cr-rho"), sv = document.getElementById("cr-rho-v");
    var rowR = document.getElementById("cr-rho-row"), unitBtn = document.getElementById("cr-unit");
    var note = document.getElementById("cr-note");
    var N = 60, shape = "line", big = false;
    /* 고정된 난수로 만든 표준정규 두 줄 */
    var rng = mulberry32(20260930), z1 = [], z2 = [], u = [], e = [];
    function gauss(){ var a = Math.max(rng(), 1e-9), b = rng(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); }
    for (var i = 0; i < N; i++){ z1.push(gauss()); z2.push(gauss()); u.push(-2 + 4 * (i + 0.5) / N); e.push(gauss() * 0.25); }
    /* 표본에서 정확히 원하는 상관이 나오도록 z2를 z1과 직교화 */
    (function(){
      function mean(a){ var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
      var m1 = mean(z1), m2 = mean(z2), i;
      for (i = 0; i < N; i++){ z1[i] -= m1; z2[i] -= m2; }
      var s11 = 0, s12 = 0; for (i = 0; i < N; i++){ s11 += z1[i] * z1[i]; s12 += z1[i] * z2[i]; }
      for (i = 0; i < N; i++) z2[i] -= s12 / s11 * z1[i];
      var a = 0, b = 0; for (i = 0; i < N; i++){ a += z1[i] * z1[i]; b += z2[i] * z2[i]; }
      a = Math.sqrt(a / N); b = Math.sqrt(b / N);
      for (i = 0; i < N; i++){ z1[i] /= a; z2[i] /= b; }
    })();
    function data(){
      var xs = [], ys = [], r = parseFloat(slider.value);
      for (var i = 0; i < N; i++){
        if (shape === "line"){ xs.push(z1[i]); ys.push(r * z1[i] + Math.sqrt(Math.max(0, 1 - r * r)) * z2[i]); }
        else { xs.push(u[i]); ys.push(u[i] * u[i] - 4 / 3 + e[i]); }
      }
      /* 기본 단위: X는 cm, Y는 cm처럼 읽히도록 크기를 키움 */
      for (var j = 0; j < N; j++){ xs[j] = 170 + 6 * xs[j]; ys[j] = 65 + 8 * ys[j]; }
      if (big) for (var k = 0; k < N; k++) ys[k] *= 10;
      return {x: xs, y: ys};
    }
    function stats(d){
      var n = d.x.length, mx = 0, my = 0, i;
      for (i = 0; i < n; i++){ mx += d.x[i]; my += d.y[i]; }
      mx /= n; my /= n;
      var sxy = 0, sxx = 0, syy = 0;
      for (i = 0; i < n; i++){ var a = d.x[i] - mx, b = d.y[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
      return {mx: mx, my: my, cov: sxy / n, rho: sxy / Math.sqrt(sxx * syy)};
    }
    function render(){
      var d = data(), s = stats(d);
      clear(svg);
      var L = 40, R = 540, T = 16, B = 300;
      var xmin = Math.min.apply(null, d.x), xmax = Math.max.apply(null, d.x);
      var ymin = Math.min.apply(null, d.y), ymax = Math.max.apply(null, d.y);
      var px = (xmax - xmin) * 0.08 || 1, py = (ymax - ymin) * 0.08 || 1;
      xmin -= px; xmax += px; ymin -= py; ymax += py;
      function X(v){ return L + (v - xmin) / (xmax - xmin) * (R - L); }
      function Y(v){ return B - (v - ymin) / (ymax - ymin) * (B - T); }
      el("rect", {x: L, y: T, width: R - L, height: B - T, "class": "cr-frame"}, svg);
      el("line", {x1: X(s.mx), x2: X(s.mx), y1: T, y2: B, "class": "cr-mean"}, svg);
      el("line", {x1: L, x2: R, y1: Y(s.my), y2: Y(s.my), "class": "cr-mean"}, svg);
      for (var i = 0; i < d.x.length; i++){
        var pos = (d.x[i] - s.mx) * (d.y[i] - s.my) >= 0;
        el("circle", {cx: X(d.x[i]), cy: Y(d.y[i]), r: 4.5, "class": pos ? "cr-pos" : "cr-neg"}, svg);
      }
      var t1 = el("text", {x: (L + R) / 2, y: 324, "class": "svg-t"}, svg); t1.textContent = "X";
      var t2 = el("text", {x: 16, y: (T + B) / 2, "class": "svg-t"}, svg); t2.textContent = "Y";
      var ticks = [ymin + py, ymax - py];
      ticks.forEach(function(v){ var t = el("text", {x: L - 4, y: Y(v) + 4, "class": "svg-t cr-tick"}, svg); t.textContent = Math.round(v); });
      sv.textContent = parseFloat(slider.value).toFixed(1);
      note.innerHTML = "Cov(X, Y) = <b>" + s.cov.toFixed(1) + "</b> · 상관계수 ρ = <b>" + s.rho.toFixed(2) + "</b><br>" +
        (shape === "curve"
          ? "점들이 포물선 위에 뚜렷하게 모여 있는데도 상관계수는 거의 0이에요. 직선 관계가 없을 뿐, 관계가 없는 게 아니에요."
          : (big ? "Y의 단위를 10배로 바꾸자 공분산은 10배가 됐지만 상관계수는 그대로예요. 공분산 크기만으로는 관계의 세기를 말할 수 없어요."
                 : "파란 점(편차 곱 +)이 많으면 공분산이 +, 빨간 점(편차 곱 −)이 많으면 −예요. 아래 버튼으로 단위를 바꿔 보세요."));
    }
    slider.addEventListener("input", render);
    unitBtn.addEventListener("click", function(){
      big = !big; unitBtn.setAttribute("aria-pressed", big);
      unitBtn.textContent = big ? "Y의 단위를 원래대로" : "Y의 단위를 10배로 바꾸기";
      render();
    });
    segWire(document.querySelectorAll("#cr .seg button"), function(b){
      shape = b.getAttribute("data-shape");
      rowR.hidden = shape !== "line";
      render();
    });
    render();
  })();

  /* ---------- 3. 중심극한정리: 표본평균의 히스토그램 ---------- */
  (function(){
    var svg = document.getElementById("clt-svg");
    if (!svg) return;
    var cnt = document.getElementById("clt-count"), note = document.getElementById("clt-note");
    var POPS = {
      flat: [1, 1, 1, 1, 1, 1].map(function(v){ return v / 6; }),
      skew: [0.45, 0.25, 0.13, 0.08, 0.05, 0.04]
    };
    var pop = "flat", n = 5, rng, hist, count;
    var BINS = 25, LO = 1, HI = 6;
    function popMean(){ var p = POPS[pop], m = 0; for (var i = 0; i < 6; i++) m += (i + 1) * p[i]; return m; }
    function drawOne(){
      var p = POPS[pop], s = 0;
      for (var k = 0; k < n; k++){
        var r = rng(), acc = 0, v = 6;
        for (var i = 0; i < 6; i++){ acc += p[i]; if (r < acc){ v = i + 1; break; } }
        s += v;
      }
      return s / n;
    }
    function reset(){
      rng = mulberry32(20260930 + n * 7 + (pop === "skew" ? 1000 : 0));
      BINS = Math.round((HI - LO) / (n <= 5 ? 1 / n : 0.1));
      hist = []; for (var i = 0; i <= BINS; i++) hist.push(0);
      count = 0; add(1000);
    }
    function add(k){
      for (var s = 0; s < k; s++){
        var m = drawOne();
        var b = Math.round((m - LO) / (HI - LO) * BINS);
        hist[Math.max(0, Math.min(BINS, b))]++;
        count++;
      }
      render();
    }
    function render(){
      clear(svg);
      var L = 30, R = 530;
      function X(v){ return L + (v - 0.5) / 6 * (R - L); }
      var mu = popMean();
      /* 위: 모집단 */
      var p = POPS[pop], pmax = Math.max.apply(null, p), T1 = 26, B1 = 118;
      var lab1 = el("text", {x: L, y: 14, "class": "svg-sum"}, svg); lab1.textContent = "모집단 분포";
      el("line", {x1: L, x2: R, y1: B1, y2: B1, "class": "ax"}, svg);
      for (var i = 0; i < 6; i++){
        var h = p[i] / pmax * (B1 - T1), w = (R - L) / 6 * 0.62;
        el("rect", {x: X(i + 1) - w / 2, y: B1 - h, width: w, height: h, rx: 3, "class": "clt-pop"}, svg);
      }
      /* 아래: 표본평균 히스토그램 */
      var T2 = 162, B2 = 322, hmax = Math.max.apply(null, hist) || 1;
      var lab2 = el("text", {x: L, y: 150, "class": "svg-sum"}, svg); lab2.textContent = "표본평균 x̄ " + count.toLocaleString("ko-KR") + "개의 히스토그램";
      el("line", {x1: L, x2: R, y1: B2, y2: B2, "class": "ax"}, svg);
      var bw = (X(6) - X(1)) / BINS;
      for (var b = 0; b <= BINS; b++){
        if (!hist[b]) continue;
        var v = LO + b * (HI - LO) / BINS, hh = hist[b] / hmax * (B2 - T2);
        el("rect", {x: X(v) - bw * 0.45, y: B2 - hh, width: bw * 0.9, height: hh, "class": "clt-bar"}, svg);
      }
      [T1, T2].forEach(function(t, k){ el("line", {x1: X(mu), x2: X(mu), y1: t - 4, y2: k ? B2 : B1, "class": "mark mean"}, svg); });
      for (var x = 1; x <= 6; x++){
        var t = el("text", {x: X(x), y: B1 + 16, "class": "svg-t"}, svg); t.textContent = x;
        var t2 = el("text", {x: X(x), y: B2 + 16, "class": "svg-t"}, svg); t2.textContent = x;
      }
      cnt.textContent = "표본 하나 = " + n + "개를 뽑아 평균 · 지금까지 " + count.toLocaleString("ko-KR") + "번 반복";
      var msg;
      if (n === 1) msg = "n = 1이면 표본평균이 곧 값 하나라서, 히스토그램이 모집단 모양 그대로예요.";
      else if (n < 30) msg = "n = " + n + "만 돼도 가운데가 볼록해지기 시작해요. " + (pop === "skew" ? "모집단이 치우쳐 있으면 아직 한쪽으로 기울어 있어요." : "") + " n을 더 키워 보세요.";
      else msg = "n = 30이면 모집단이 " + (pop === "skew" ? "이렇게 치우쳐 있어도" : "평평해도") + " 표본평균의 히스토그램은 종 모양이 되고 폭도 좁아져요. 중심은 모평균(파란 점선) 그대로예요.";
      note.textContent = msg + " 반복 횟수를 늘리면 히스토그램이 더 매끈해질 뿐, 모양을 정하는 건 표본의 크기 n이에요.";
    }
    segWire(document.querySelectorAll("#clt-w .panel-head .seg button"), function(b){ pop = b.getAttribute("data-pop"); reset(); });
    segWire(document.querySelectorAll("#clt-n button"), function(b){ n = parseInt(b.getAttribute("data-n"), 10); reset(); });
    document.getElementById("clt-more").addEventListener("click", function(){ add(1000); });
    document.getElementById("clt-reset").addEventListener("click", reset);
    reset();
  })();
})();
