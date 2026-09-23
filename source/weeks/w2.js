(function(){
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent){
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function fmtSigned(v){ return v > 0 ? "+" + v : (v < 0 ? "−" + Math.abs(v) : "0"); }

  /* ---------- 1. 편차 5개와 자유도 ---------- */
  (function(){
    var svg = document.getElementById("w1-svg");
    var box = document.getElementById("w1-sliders");
    var note = document.getElementById("w1-note");
    var bX = document.getElementById("w1-xbar"), bM = document.getElementById("w1-mu");
    if (!svg) return;
    var mode = "xbar";
    var d = [2, -1, 1, -3, 0];
    var inputs = [], vals = [], rows = [];
    for (var i = 0; i < 5; i++){
      var row = document.createElement("div"); row.className = "sl";
      var id = "w1-d" + (i + 1);
      var lab = document.createElement("label"); lab.setAttribute("for", id);
      lab.textContent = "편차 " + (i + 1);
      var val = document.createElement("span"); val.className = "val";
      var inp = document.createElement("input");
      inp.type = "range"; inp.min = "-3"; inp.max = "3"; inp.step = "1"; inp.id = id;
      inp.value = String(d[i]);
      (function(k){ inp.addEventListener("input", function(){ d[k] = parseInt(this.value, 10); render(); }); })(i);
      lab.appendChild(document.createTextNode(" "));
      lab.appendChild(val);
      row.appendChild(lab); row.appendChild(inp);
      box.appendChild(row);
      inputs.push(inp); vals.push(val); rows.push(row);
    }
    function setMode(m){
      mode = m;
      bX.classList.toggle("on", m === "xbar"); bX.setAttribute("aria-pressed", m === "xbar");
      bM.classList.toggle("on", m === "mu"); bM.setAttribute("aria-pressed", m === "mu");
      if (m === "mu"){ d[4] = Math.max(-3, Math.min(3, d[4])); inputs[4].value = String(d[4]); }
      render();
    }
    bX.addEventListener("click", function(){ setMode("xbar"); });
    bM.addEventListener("click", function(){ setMode("mu"); });

    function render(){
      if (mode === "xbar") d[4] = -(d[0] + d[1] + d[2] + d[3]);
      var sum = d[0] + d[1] + d[2] + d[3] + d[4];
      for (var i = 0; i < 5; i++){
        vals[i].textContent = fmtSigned(d[i]);
        var locked = (mode === "xbar" && i === 4);
        rows[i].className = "sl" + (mode === "mu" ? " mu" : "") + (locked ? " locked" : "");
        inputs[i].hidden = locked;
      }
      rows[4].firstChild.firstChild.textContent = mode === "xbar" ? "편차 5 (자동)" : "편차 5";
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var W = 560, zero = 124, unit = 8, left = 50, gap = 96, bw = 46;
      for (var g = -12; g <= 12; g += 4){
        el("line", {x1: left - 18, x2: W - 20, y1: zero - g * unit, y2: zero - g * unit, "class": g === 0 ? "ax" : "grid-l"}, svg);
      }
      for (var j = 0; j < 5; j++){
        var v = d[j], x = left + j * gap + 12;
        var h = Math.abs(v) * unit, y = v >= 0 ? zero - h : zero;
        var locked = (mode === "xbar" && j === 4);
        var cls = locked ? "b-locked" : ("b-free" + (mode === "mu" ? " mu" : ""));
        el("rect", {x: x, y: y, width: bw, height: Math.max(h, 1.5), rx: 4, "class": cls}, svg);
        var ty = v >= 0 ? zero - h - 8 : zero + h + 18;
        var t = el("text", {x: x + bw / 2, y: ty, "class": "svg-v"}, svg); t.textContent = fmtSigned(v);
        var lt = el("text", {x: x + bw / 2, y: 262, "class": locked ? "svg-lock" : "svg-t"}, svg);
        lt.textContent = locked ? "자동으로 정해짐" : "편차 " + (j + 1);
      }
      if (mode === "xbar"){
        note.innerHTML = "편차의 합: <b>" + fmtSigned(sum) + "</b>. 표본평균으로 잰 편차는 합이 0이어야 해서, 4개를 정하면 다섯 번째는 저절로 정해져요. 자유롭게 정한 편차는 <b>4개 = n − 1</b>이에요.";
      } else {
        note.innerHTML = "편차의 합: <b>" + fmtSigned(sum) + "</b>. 모평균으로 잰 편차는 합이 0일 필요가 없어서 5개 모두 자유롭게 움직여요. 자유도는 <b>5 = n</b>이에요.";
      }
    }
    render();
  })();

  /* ---------- 2. 주사위 시뮬레이션 ---------- */
  (function(){
    var bars = document.getElementById("w2-bars");
    if (!bars) return;
    var note = document.getElementById("w2-note"), cnt = document.getElementById("w2-count");
    var SIGMA2 = 35 / 12, MAX = 3.5;
    function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    var rng, n = 5, count = 0, sN1 = 0, sN = 0;
    var rowsDef = [
      {key: "truth", label: "모분산 σ² (참값)"},
      {key: "n1", label: "n − 1로 나눈 값의 평균"},
      {key: "nn", label: "n으로 나눈 값의 평균"}
    ];
    var fills = {}, nums = {};
    rowsDef.forEach(function(r){
      var row = document.createElement("div"); row.className = "bar-row";
      var lab = document.createElement("span"); lab.textContent = r.label;
      var track = document.createElement("div"); track.className = "bar-track";
      var fill = document.createElement("div"); fill.className = "bar-fill " + r.key;
      track.appendChild(fill);
      var num = document.createElement("span"); num.className = "bar-num";
      row.appendChild(lab); row.appendChild(track); row.appendChild(num);
      bars.appendChild(row);
      fills[r.key] = fill; nums[r.key] = num;
    });
    function reset(seed){ rng = mulberry32(seed); count = 0; sN1 = 0; sN = 0; }
    function draw(k){
      for (var s = 0; s < k; s++){
        var xs = [], m = 0;
        for (var i = 0; i < n; i++){ var x = 1 + Math.floor(rng() * 6); xs.push(x); m += x; }
        m /= n;
        var ss = 0;
        for (var j = 0; j < n; j++) ss += (xs[j] - m) * (xs[j] - m);
        sN1 += ss / (n - 1); sN += ss / n; count++;
      }
      show();
    }
    function show(){
      var v = {truth: SIGMA2, n1: sN1 / count, nn: sN / count};
      for (var k in v){ fills[k].style.width = Math.min(100, v[k] / MAX * 100) + "%"; nums[k].textContent = v[k].toFixed(3); }
      cnt.textContent = "지금까지 뽑은 표본 " + count.toLocaleString("ko-KR") + "개 · 표본 하나 = 주사위 " + n + "번";
      var ratio = Math.round((n - 1) / n * 100);
      note.innerHTML = "n − 1로 나눈 쪽은 참값 2.917에 거의 붙고, n으로 나눈 쪽은 평균적으로 참값의 약 <b>" + ratio + "%</b>(= (n − 1)/n)로 작게 나와요. n이 커질수록 차이는 줄어들지만 없어지지는 않아요.";
    }
    var segBtns = document.querySelectorAll("#w2 .seg button");
    Array.prototype.forEach.call(segBtns, function(b){
      b.addEventListener("click", function(){
        n = parseInt(b.getAttribute("data-n"), 10);
        Array.prototype.forEach.call(segBtns, function(o){ var on = o === b; o.classList.toggle("on", on); o.setAttribute("aria-pressed", on); });
        reset(20260923 + n); draw(2000);
      });
    });
    document.getElementById("w2-more").addEventListener("click", function(){ draw(1000); });
    document.getElementById("w2-reset").addEventListener("click", function(){ reset(20260923 + n); draw(2000); });
    reset(20260923 + n); draw(2000);
  })();

  /* ---------- 3. 주사위 사건: 조건부확률, 독립, 배반 ---------- */
  (function(){
    var sa = document.getElementById("w3-a"), sb = document.getElementById("w3-b");
    if (!sa) return;
    var dice = document.getElementById("w3-dice"), out = document.getElementById("w3-out");
    var EV = [
      {k: "even", name: "짝수", set: [2, 4, 6]},
      {k: "odd", name: "홀수", set: [1, 3, 5]},
      {k: "m3", name: "3의 배수", set: [3, 6]},
      {k: "ge4", name: "4 이상", set: [4, 5, 6]},
      {k: "le2", name: "2 이하", set: [1, 2]}
    ];
    function opt(sel, value, text){ var o = document.createElement("option"); o.value = value; o.textContent = text; sel.appendChild(o); }
    EV.forEach(function(e){ opt(sa, e.k, e.name); });
    opt(sb, "none", "조건 없음");
    EV.forEach(function(e){ opt(sb, e.k, e.name); });
    sa.value = "even"; sb.value = "m3";
    var tiles = [];
    for (var i = 1; i <= 6; i++){ var t = document.createElement("div"); t.className = "die"; t.textContent = i; dice.appendChild(t); tiles.push(t); }
    function find(k){ for (var i = 0; i < EV.length; i++) if (EV[i].k === k) return EV[i]; return null; }
    function gcd(a, b){ return b ? gcd(b, a % b) : a; }
    function fr(a, b){ if (a === 0) return "0"; var g = gcd(a, b); return (a / g) + "/" + (b / g); }
    function render(){
      var A = find(sa.value), B = find(sb.value);
      var inA = function(x){ return A.set.indexOf(x) >= 0; };
      var inB = function(x){ return B ? B.set.indexOf(x) >= 0 : true; };
      tiles.forEach(function(t, idx){
        var x = idx + 1;
        t.className = "die" + (inA(x) ? " inA" : "") + (B && inB(x) ? " inB" : "") + (B && !inB(x) ? " out" : "");
      });
      var nA = A.set.length;
      var html = "<p>P(A) = " + nA + "/6 = <span class=\"n\">" + fr(nA, 6) + "</span></p>";
      if (!B){
        html += "<p>조건 B를 골라 보세요.</p>";
        out.innerHTML = html; return;
      }
      var nB = B.set.length, nAB = A.set.filter(function(x){ return inB(x); }).length;
      html += "<p>P(A | B) = " + nAB + "/" + nB + " = <span class=\"n\">" + fr(nAB, nB) + "</span> <span class=\"muted\">(B 안에서 A가 차지하는 비율)</span></p>";
      html += "<p>P(A ∩ B) = <span class=\"n\">" + fr(nAB, 6) + "</span></p>";
      html += "<p>P(A) × P(B) = " + fr(nA, 6) + " × " + fr(nB, 6) + " = <span class=\"n\">" + fr(nA * nB, 36) + "</span></p>";
      var disjoint = nAB === 0;
      var indep = nAB * 6 === nA * nB; /* P(A|B) = P(A) */
      html += "<div class=\"verdict\">" +
        "<span class=\"pill " + (disjoint ? "no" : "neutral") + "\">" + (disjoint ? "배반 (A ∩ B = ∅)" : "배반 아님 (겹침 있음)") + "</span>" +
        "<span class=\"pill " + (indep ? "yes" : "no") + "\">" + (indep ? "독립: P(A | B) = P(A)" : "독립 아님: P(A | B) ≠ P(A)") + "</span></div>";
      out.innerHTML = html;
    }
    sa.addEventListener("change", render); sb.addEventListener("change", render);
    render();
  })();
})();
