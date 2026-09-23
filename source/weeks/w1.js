(function(){
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent){
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- 1. 표본을 어떻게 뽑느냐 ---------- */
  (function(){
    var grid = document.getElementById("w1s-grid");
    if (!grid) return;
    var barsBox = document.getElementById("w1s-bars"), note = document.getElementById("w1s-note");
    var COLS = 10, ROWS = 6, N = COLS * ROWS;
    var rnd = mulberry32(20260916), vals = [], cells = [];
    for (var i = 0; i < N; i++){
      var row = Math.floor(i / COLS);
      vals.push(Math.round((21 - 2.4 * row + (rnd() * 5 - 2.5)) * 10) / 10);
    }
    var popMean = vals.reduce(function(a, b){ return a + b; }, 0) / N;
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    for (var j = 0; j < N; j++){
      var c = document.createElement("div");
      c.className = "seat";
      var t = (vals[j] - lo) / (hi - lo);
      c.style.opacity = (0.28 + 0.72 * t).toFixed(2);
      grid.appendChild(c); cells.push(c);
    }
    var rows = [
      {key: "pop", label: "모집단 전체 평균", cls: "truth"},
      {key: "smp", label: "뽑은 10명의 평균", cls: "n1"}
    ];
    var fills = {}, nums = {};
    rows.forEach(function(r){
      var row = document.createElement("div"); row.className = "bar-row";
      var lab = document.createElement("span"); lab.textContent = r.label;
      var track = document.createElement("div"); track.className = "bar-track";
      var fill = document.createElement("div"); fill.className = "bar-fill " + r.cls;
      track.appendChild(fill);
      var num = document.createElement("span"); num.className = "bar-num";
      row.appendChild(lab); row.appendChild(track); row.appendChild(num);
      barsBox.appendChild(row);
      fills[r.key] = fill; nums[r.key] = num;
    });
    var MAX = 26;
    function paint(pick, kind){
      cells.forEach(function(c, idx){ c.classList.toggle("pick", pick.indexOf(idx) >= 0); });
      fills.pop.style.width = (popMean / MAX * 100) + "%";
      nums.pop.textContent = popMean.toFixed(1) + "시간";
      if (!pick.length){
        fills.smp.style.width = "0%"; nums.smp.textContent = "–";
        note.textContent = "버튼을 눌러 표본을 뽑아 보세요.";
        return;
      }
      var m = pick.reduce(function(a, i){ return a + vals[i]; }, 0) / pick.length;
      fills.smp.style.width = (m / MAX * 100) + "%";
      nums.smp.textContent = m.toFixed(1) + "시간";
      var gap = (m - popMean).toFixed(1);
      if (kind === "front"){
        note.innerHTML = "앞에서부터 뽑으면 공부시간이 긴 사람만 들어와서 평균이 <b>" + gap + "시간</b>만큼 높게 나와요. 뽑는 방법이 한쪽으로 기울면, 표본을 아무리 늘려도 이 차이는 줄지 않아요.";
      } else {
        note.innerHTML = "랜덤으로 뽑으면 전체 평균 근처에서 왔다 갔다 해요(지금은 차이 <b>" + gap + "시간</b>). 여러 번 눌러 보면 값이 조금씩 달라지는데, 이게 바로 표본을 뽑을 때마다 통계량이 달라진다는 뜻이에요.";
      }
    }
    document.getElementById("w1s-front").addEventListener("click", function(){
      var pick = []; for (var i = 0; i < 10; i++) pick.push(i);
      paint(pick, "front");
    });
    document.getElementById("w1s-rand").addEventListener("click", function(){
      var idx = [], pick = [];
      for (var i = 0; i < N; i++) idx.push(i);
      for (var k = 0; k < 10; k++) pick.push(idx.splice(Math.floor(Math.random() * idx.length), 1)[0]);
      paint(pick, "rand");
    });
    document.getElementById("w1s-clear").addEventListener("click", function(){ paint([], null); });
    paint([], null);
  })();

  /* ---------- 2. 분포의 균형점 ---------- */
  (function(){
    var svg = document.getElementById("w2b-svg");
    if (!svg) return;
    var box = document.getElementById("w2b-sliders"), out = document.getElementById("w2b-out");
    var xs = [100, 200, 300, 400], w = [20, 40, 35, 5], inputs = [], vals = [];
    xs.forEach(function(x, i){
      var row = document.createElement("div"); row.className = "sl";
      var id = "w2b-p" + i;
      var lab = document.createElement("label"); lab.setAttribute("for", id);
      lab.textContent = x;
      var val = document.createElement("span"); val.className = "val";
      var inp = document.createElement("input");
      inp.type = "range"; inp.min = "0"; inp.max = "60"; inp.step = "1"; inp.id = id; inp.value = String(w[i]);
      inp.addEventListener("input", function(){ w[i] = parseInt(this.value, 10); render(); });
      lab.appendChild(document.createTextNode(" "));
      lab.appendChild(val);
      row.appendChild(lab); row.appendChild(inp);
      box.appendChild(row); inputs.push(inp); vals.push(val);
    });
    function render(){
      var tot = w.reduce(function(a, b){ return a + b; }, 0);
      if (tot === 0){ w[0] = 1; tot = 1; inputs[0].value = "1"; }
      var p = w.map(function(v){ return v / tot; });
      var mu = 0, i;
      for (i = 0; i < 4; i++) mu += xs[i] * p[i];
      var v2 = 0;
      for (i = 0; i < 4; i++) v2 += (xs[i] - mu) * (xs[i] - mu) * p[i];
      for (i = 0; i < 4; i++) vals[i].textContent = p[i].toFixed(2);

      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var base = 176, left = 60, right = 520, x2px = function(x){ return left + (x - 50) / 400 * (right - left); };
      var maxP = Math.max.apply(null, p.concat([0.25]));
      el("line", {x1: 34, y1: base, x2: 540, y2: base, "class": "ax"}, svg);
      for (i = 0; i < 4; i++){
        var h = p[i] / maxP * 118, cx = x2px(xs[i]);
        el("rect", {x: cx - 26, y: base - h, width: 52, height: Math.max(h, 1.5), rx: 4, "class": "b-free mu"}, svg);
        var t1 = el("text", {x: cx, y: base - h - 8, "class": "svg-v"}, svg); t1.textContent = p[i].toFixed(2);
        var t2 = el("text", {x: cx, y: base + 20, "class": "svg-t"}, svg); t2.textContent = xs[i];
      }
      var mx = x2px(mu);
      el("path", {d: "M" + mx + " " + (base + 2) + " L" + (mx - 13) + " " + (base + 26) + " L" + (mx + 13) + " " + (base + 26) + " Z", "class": "fulcrum"}, svg);
      var t3 = el("text", {x: mx, y: base + 48, "class": "svg-lock mu"}, svg); t3.textContent = "μ = " + mu.toFixed(1);
      var sd = Math.sqrt(v2);
      el("line", {x1: x2px(mu - sd), y1: base + 68, x2: x2px(mu + sd), y2: base + 68, "class": "sd-line"}, svg);
      var t4 = el("text", {x: x2px(mu + sd) + 30, y: base + 73, "class": "svg-t"}, svg); t4.textContent = "μ ± σ";
      out.innerHTML = "<p>모평균 μ = <span class=\"n\">" + mu.toFixed(1) + "</span></p>" +
        "<p>모분산 σ² = <span class=\"n\">" + v2.toFixed(0) + "</span></p>" +
        "<p>모표준편차 σ = <span class=\"n\">" + sd.toFixed(1) + "</span></p>" +
        "<p>편차 × 상대도수의 합 = <span class=\"n\">0</span> <span class=\"muted\">(그래서 균형점)</span></p>";
    }
    render();
  })();

  /* ---------- 3. 왜도 ---------- */
  (function(){
    var svg = document.getElementById("w3s-svg");
    if (!svg) return;
    var range = document.getElementById("w3s-range"), note = document.getElementById("w3s-note");
    function phi(z){ return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); }
    function Phi(z){
      var t = 1 / (1 + 0.2316419 * Math.abs(z));
      var d = phi(z) * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
      return z >= 0 ? 1 - d : d;
    }
    function render(){
      var a = parseInt(range.value, 10) / 10;   /* 치우침 모수 */
      var n = 240, xs = [], ys = [], i, x, s = 0;
      for (i = 0; i <= n; i++){
        x = -4 + 8 * i / n;
        var y = 2 * phi(x) * Phi(a * x);
        xs.push(x); ys.push(y); s += y;
      }
      var mean = 0, cum = 0, med = 0, half = s / 2, found = false;
      for (i = 0; i <= n; i++){ mean += xs[i] * ys[i] / s; }
      for (i = 0; i <= n; i++){ cum += ys[i]; if (!found && cum >= half){ med = xs[i]; found = true; } }
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var L = 40, R = 520, base = 172, maxY = Math.max.apply(null, ys);
      var px = function(x){ return L + (x + 4) / 8 * (R - L); }, py = function(y){ return base - y / maxY * 120; };
      var d = "M" + px(xs[0]) + " " + py(ys[0]);
      for (i = 1; i <= n; i++) d += " L" + px(xs[i]) + " " + py(ys[i]);
      el("path", {d: d + " L" + px(xs[n]) + " " + base + " L" + px(xs[0]) + " " + base + " Z", "class": "d-fill"}, svg);
      el("path", {d: d, "class": "d-curve"}, svg);
      el("line", {x1: L - 8, y1: base, x2: R + 12, y2: base, "class": "ax"}, svg);
      el("line", {x1: px(mean), y1: py(maxY) - 14, x2: px(mean), y2: base, "class": "mark mean"}, svg);
      el("line", {x1: px(med), y1: py(maxY) - 14, x2: px(med), y2: base, "class": "mark med"}, svg);
      var t1 = el("text", {x: px(mean), y: py(maxY) - 20, "class": "svg-lock mu"}, svg); t1.textContent = "평균";
      var t2 = el("text", {x: px(med), y: py(maxY) - 38, "class": "svg-lock"}, svg); t2.textContent = "중앙값";
      var t3 = el("text", {x: (L + R) / 2, y: base + 34, "class": "svg-t"}, svg);
      t3.textContent = a > 0.3 ? "오른쪽 꼬리가 길다 (양의 왜도)" : (a < -0.3 ? "왼쪽 꼬리가 길다 (음의 왜도)" : "대칭에 가깝다");
      var diff = mean - med;
      if (Math.abs(diff) < 0.02){
        note.innerHTML = "대칭이면 평균과 중앙값이 거의 같은 자리에 있어요.";
      } else if (diff > 0){
        note.innerHTML = "오른쪽 꼬리가 길어지면 중앙은 그대로인데 큰 값들이 합을 끌어올려서 <b>평균 &gt; 중앙값</b>이 돼요.";
      } else {
        note.innerHTML = "왼쪽 꼬리가 길어지면 중앙은 그대로인데 작은 값들이 합을 끌어내려서 <b>평균 &lt; 중앙값</b>이 돼요.";
      }
    }
    range.addEventListener("input", render);
    render();
  })();
})();
