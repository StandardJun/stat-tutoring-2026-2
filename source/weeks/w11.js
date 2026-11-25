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
  function f2(v){ return v.toFixed(2); }
  function f1(v){ return v.toFixed(1); }

  /* ---------- 1. 반 평균 간격과 반 안 흩어짐 → MStr, MSE, F ---------- */
  (function(){
    var svg = document.getElementById("f11-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("f11-out"), note = document.getElementById("f11-note");
    var sd = document.getElementById("f11-d"), sc = document.getElementById("f11-c");
    var vd = document.getElementById("f11-d-v"), vc = document.getElementById("f11-c-v");
    /* 슬라이드 4 왼쪽 자료의 반 안 편차(세 반 모두 같은 모양). 4배 하면 오른쪽 자료 */
    var DEV = [-3, 2, -1, 1, -2, 3], OFF = [-0.15, -0.09, -0.03, 0.03, 0.09, 0.15];
    var NAMES = ["A반", "B반", "C반"], CRIT = 3.68;
    function render(){
      var d = parseFloat(sd.value), c = parseFloat(sc.value);
      vd.textContent = f1(d); vc.textContent = f1(c) + "배";
      var means = [65 - d, 65, 65 + d];
      var sstr = 12 * d * d, sse = 84 * c * c;      /* SStr = 6(d² + 0 + d²), SSE = 3 × 28c² */
      var mstr = sstr / 2, mse = sse / 15, F = mstr / mse, rej = F > CRIT;
      clear(svg);
      var L = 44, R = 486, T = 14, B = 222, y0 = 30, y1 = 100;
      function X(g, o){ return L + (g + 0.5 + o) / 3 * (R - L); }
      function Y(v){ return B - (v - y0) / (y1 - y0) * (B - T); }
      el("clipPath", {id: "f11-clip"}, svg);
      el("rect", {x: L, y: T, width: R - L, height: B - T}, svg.lastChild);
      [40, 50, 60, 70, 80, 90].forEach(function(t){
        el("line", {x1: L, x2: R, y1: Y(t), y2: Y(t), "class": "grid-l"}, svg);
        txt(svg, L - 8, Y(t) + 4, "svg-t", String(t), "text-anchor:end");
      });
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      var g = el("g", {"clip-path": "url(#f11-clip)"}, svg);
      el("line", {x1: L, x2: R, y1: Y(65), y2: Y(65), style: "stroke:var(--ink);stroke-width:1;stroke-dasharray:5 4"}, g);
      for (var i = 0; i < 3; i++){
        el("line", {x1: X(i, -0.25), x2: X(i, 0.25), y1: Y(means[i]), y2: Y(means[i]), style: "stroke:var(--ink);stroke-width:3"}, g);
        for (var j = 0; j < 6; j++){
          el("circle", {cx: X(i, OFF[j]), cy: Y(means[i] + c * DEV[j]), r: 5, style: "fill:var(--orange);stroke:var(--ground);stroke-width:1"}, g);
        }
        txt(svg, X(i, 0), B + 20, "svg-t", NAMES[i]);
      }
      txt(svg, R + 6, Y(65) - 4, "w4-leg", "전체", "text-anchor:start");
      txt(svg, R + 6, Y(65) + 12, "w4-leg", "평균 65", "text-anchor:start");
      out.innerHTML =
        "<p>SStr = <span class=\"n\">" + f1(sstr) + "</span>, MStr = SStr ÷ 2 = <span class=\"n\">" + f2(mstr) + "</span></p>" +
        "<p>SSE = <span class=\"n\">" + f1(sse) + "</span>, MSE = SSE ÷ 15 = <span class=\"n\">" + f2(mse) + "</span></p>" +
        "<p>F = MStr ÷ MSE = <span class=\"n\">" + f2(F) + "</span></p>" +
        "<p>임계값 3.68과 비교 " + pill(rej, "기각", "기각 못 함") + "</p>";
      var msg;
      if (d === 0) msg = "반 평균이 모두 같으면 MStr = 0이라 F도 0이에요. 반 안 흩어짐을 아무리 줄여도 기각할 수 없어요.";
      else if (d === 5 && Math.abs(c - 1) < 0.05) msg = "슬라이드 4, 10의 왼쪽 자료예요. 흩어짐을 키워 보면서 MStr은 그대로인데 MSE만 커지는 걸 확인해 보세요.";
      else if (d === 5 && Math.abs(c - 4) < 0.05) msg = "슬라이드 4, 10의 오른쪽 자료예요. 반 평균은 왼쪽과 같아서 MStr은 150 그대로인데, MSE가 89.6으로 커져서 F가 1.67로 작아졌어요.";
      else if (!rej) msg = "반 안 흩어짐(MSE)에 비해 반 평균끼리의 차이(MStr)가 작아서 기각하지 못해요. 흩어짐을 줄이거나 간격을 넓혀 보세요.";
      else msg = "반 안 흩어짐에 비해 반 평균끼리의 차이가 충분히 커서 기각돼요. 흩어짐을 키워 보면서 어느 순간 결론이 바뀌는지 찾아보세요.";
      note.textContent = msg;
    }
    sd.addEventListener("input", render); sc.addEventListener("input", render);
    render();
  })();

  /* ---------- 2. 처리 수에 따라 1종 오류가 얼마나 쌓이나 ---------- */
  (function(){
    var bars = document.getElementById("mc11-bars");
    if (!bars) return;
    var out = document.getElementById("mc11-out"), note = document.getElementById("mc11-note");
    var sk = document.getElementById("mc11-k"), vk = document.getElementById("mc11-k-v");
    var rowsDef = [
      {key: "n1", label: "쌍마다 유의수준 0.05"},
      {key: "truth", label: "Bonferroni: 쌍마다 0.05 ÷ m"}
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
    function render(){
      var k = parseInt(sk.value, 10), m = k * (k - 1) / 2;
      vk.textContent = k;
      var naive = 1 - Math.pow(0.95, m), a = 0.05 / m, bonf = 1 - Math.pow(1 - a, m);
      fills.n1.style.width = (naive * 100).toFixed(1) + "%";
      fills.truth.style.width = (bonf * 100).toFixed(1) + "%";
      nums.n1.textContent = naive.toFixed(3);
      nums.truth.textContent = bonf.toFixed(3);
      out.innerHTML =
        "<p>비교할 쌍의 수 m = k(k − 1) ÷ 2 = <span class=\"n\">" + m + "</span></p>" +
        "<p>Bonferroni의 쌍마다 유의수준 = 0.05 ÷ " + m + " = <span class=\"n\">" + a.toFixed(4) + "</span></p>";
      var msg;
      if (k === 2) msg = "처리가 2개면 비교가 한 번뿐이라 쌓일 게 없어요. 이때는 F = T²라서 t검정과 분산분석이 같은 결론을 줘요.";
      else if (k === 3) msg = "처리가 3개면 비교가 3번이라 1 − 0.95³ ≈ 0.14, 슬라이드에서 본 값이에요. 쌍마다 0.05 ÷ 3 ≈ 0.0167로 줄이면 0.05를 넘지 않아요.";
      else msg = "처리가 " + k + "개면 비교할 쌍이 " + m + "개로 빠르게 늘어서, 적어도 한 번 잘못 기각할 확률이 " + naive.toFixed(2) + "까지 커져요. Bonferroni로 쌍마다 유의수준을 줄이면 0.05를 넘지 않아요.";
      note.textContent = msg;
    }
    sk.addEventListener("input", render);
    render();
  })();

  /* ---------- 3. 반으로만 나눌 때 vs 조로 묶을 때 ---------- */
  (function(){
    var svg = document.getElementById("bl11-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("bl11-out"), note = document.getElementById("bl11-note");
    var sd = document.getElementById("bl11-d"), sb = document.getElementById("bl11-b");
    var vd = document.getElementById("bl11-d-v"), vb = document.getElementById("bl11-b-v");
    /* 슬라이드 17 자료: 6조 × 3반. 조 사이 제곱합 1301.33, 조와 반을 빼고 남은 제곱합 42.67 */
    var SSB0 = 3904 / 3, SSER = 128 / 3;
    var C1 = 3.68, C2 = 4.10, C3 = 3.33;   /* F0.05(2,15), F0.05(2,10), F0.05(5,10) */
    function seg(g, x, w, y, h, color, label){
      if (w <= 0.5) return;
      el("rect", {x: x, y: y, width: w, height: h, style: "fill:" + color + ";stroke:var(--ground);stroke-width:1.5"}, g);
      if (w > 50) txt(g, x + w / 2, y + h / 2 + 6, "svg-t", label, "fill:#fff;font-weight:700;font-size:16px");
    }
    function render(){
      var d = parseFloat(sd.value), b = parseFloat(sb.value);
      vd.textContent = d.toFixed(2); vb.textContent = b.toFixed(2) + "배";
      var sstr = 12 * d * d, ssb = SSB0 * b * b, sst = sstr + ssb + SSER;
      var mstr = sstr / 2;
      var mse1 = (ssb + SSER) / 15, F1w = mstr / mse1, rej1 = F1w > C1;
      var mse2 = SSER / 10, F1 = mstr / mse2, rej2 = F1 > C2;
      var F2 = (ssb / 5) / mse2, rej3 = F2 > C3;
      clear(svg);
      var L = 116, R = 546, W = R - L, H = 34;
      function w(v){ return v / sst * W; }
      txt(svg, L - 10, 41, "w4-leg", "반으로만", "text-anchor:end;font-size:16px");
      txt(svg, L - 10, 91, "w4-leg", "조로 묶으면", "text-anchor:end;font-size:16px");
      seg(svg, L, w(sstr), 18, H, "var(--blue)", "SStr");
      seg(svg, L + w(sstr), w(ssb + SSER), 18, H, "var(--orange)", "SSE");
      seg(svg, L, w(sstr), 70, H, "var(--blue)", "SStr");
      seg(svg, L + w(sstr), w(ssb), 70, H, "var(--muted)", "SSB");
      seg(svg, L + w(sstr) + w(ssb), w(SSER), 70, H, "var(--orange)", "SSE");
      txt(svg, L, 136, "w4-leg", "파랑 SStr · 회색 SSB(조 사이 차이) · 주황 SSE", "text-anchor:start;font-size:15px");
      out.innerHTML =
        "<p>반으로만: MSE = " + f1(ssb + SSER) + " ÷ 15 = <span class=\"n\">" + f2(mse1) + "</span></p>" +
        "<p>F = <span class=\"n\">" + f2(F1w) + "</span> vs 3.68 " + pill(rej1, "기각", "기각 못 함") + "</p>" +
        "<p>조로 묶으면: MSE = " + f1(SSER) + " ÷ 10 = <span class=\"n\">" + f2(mse2) + "</span></p>" +
        "<p>F<sub>1</sub> = <span class=\"n\">" + f2(F1) + "</span> vs 4.10 " + pill(rej2, "기각", "기각 못 함") + "</p>" +
        "<p class=\"w-full\" style=\"grid-column:1/-1\">블록 검정 F<sub>2</sub> = MSB ÷ MSE = <span class=\"n\">" + f2(F2) + "</span> vs 3.33 " + pill(rej3, "묶은 게 효과 있음", "묶은 효과 없음") + "</p>";
      var msg;
      if (d === 0) msg = "반 평균이 모두 같으면 SStr = 0이라 어느 쪽으로 분석해도 F = 0이에요.";
      else if (d === 5 && Math.abs(b - 1) < 0.01) msg = "위 그림의 자료예요. 반으로만 나누면 SSE에 조 사이 실력 차이가 섞여서 F = 1.67로 기각하지 못하지만, 조로 묶어 SSB를 빼면 F = 35.16으로 기각돼요.";
      else if (rej1 && !rej2) msg = "조 사이 차이가 작으면 SSB가 작아서 SSE는 거의 안 줄고, 잔차 자유도만 15에서 10으로 줄어요. 그래서 이 경우에는 블록으로 묶는 게 오히려 손해예요.";
      else if (!rej1 && rej2) msg = "조 사이 실력 차이를 SSE에서 빼낸 덕분에, 반으로만 볼 때는 못 찾던 처리 차이를 찾아냈어요.";
      else if (rej1 && rej2) msg = F1 >= F1w ? "둘 다 기각돼요. 조 사이 차이를 빼낸 쪽의 F가 더 커요." : "둘 다 기각되지만, 조 사이 차이가 작아서 오히려 반으로만 본 쪽의 F가 더 커요. 블록 검정도 확인해 보세요.";
      else msg = "두 분석 모두 기각하지 못해요. 반 평균 간격이 너무 작아요. 간격을 1.5 정도로, 조 사이 차이를 0으로 해 보면 블록이 손해가 되는 경우를 볼 수 있어요.";
      note.textContent = msg;
    }
    sd.addEventListener("input", render); sb.addEventListener("input", render);
    render();
  })();

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
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 4. 조 효과를 빼면 반 안 흩어짐이 줄어든다 ---------- */
  (function(){
    var svg = document.getElementById("bs11-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("bs11-out"), note = document.getElementById("bs11-note");
    /* 슬라이드 17과 같은 제곱합이 나오는 18명: 반 평균 60, 65, 70 + 조 효과 + 남은 오차 */
    var BT = Math.sqrt(3904 / 252), S = Math.sqrt(32 / 9);
    var BLK = [-3, -2, -1, 1, 2, 3].map(function(v){ return v * BT; });
    var M = [[1, -1, 0], [-1, 1, 0], [0, 1, -1], [0, -1, 1], [1, 0, -1], [-1, 0, 1]];
    var MEANS = [60, 65, 70], NAMES = ["A반", "B반", "C반"];
    var OFF = [-0.2, -0.12, -0.04, 0.04, 0.12, 0.2];
    var L = 44, R = 486, T = 14, B = 232, y0 = 40, y1 = 90;
    function X(g, o){ return L + (g + 0.5 + o) / 3 * (R - L); }
    function Y(v){ return B - (v - y0) / (y1 - y0) * (B - T); }
    [40, 50, 60, 70, 80, 90].forEach(function(t){
      el("line", {x1: L, x2: R, y1: Y(t), y2: Y(t), "class": "grid-l"}, svg);
      txt(svg, L - 8, Y(t) + 4, "svg-t", String(t), "text-anchor:end");
    });
    el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
    el("line", {x1: L, x2: R, y1: Y(65), y2: Y(65), style: "stroke:var(--ink);stroke-width:1;stroke-dasharray:5 4"}, svg);
    txt(svg, R + 6, Y(65) - 4, "w4-leg", "전체", "text-anchor:start");
    txt(svg, R + 6, Y(65) + 12, "w4-leg", "평균 65", "text-anchor:start");
    var groups = [];
    for (var i = 0; i < 6; i++){
      var g = el("g", {}, svg);
      if (!REDUCED) g.style.transition = "transform .7s ease";
      var pts = [];
      for (var j = 0; j < 3; j++) pts.push(X(j, OFF[i]) + "," + Y(MEANS[j] + BLK[i] + S * M[i][j]));
      el("polyline", {points: pts.join(" "), style: "fill:none;stroke:var(--blue);stroke-opacity:.3;stroke-width:1.5"}, g);
      for (j = 0; j < 3; j++)
        el("circle", {cx: X(j, OFF[i]), cy: Y(MEANS[j] + BLK[i] + S * M[i][j]), r: 5.5,
          style: "fill:var(--blue);fill-opacity:" + (0.3 + 0.14 * i) + ";stroke:var(--blue);stroke-width:1"}, g);
      groups.push(g);
    }
    for (j = 0; j < 3; j++){
      el("line", {x1: X(j, -0.3), x2: X(j, 0.3), y1: Y(MEANS[j]), y2: Y(MEANS[j]), style: "stroke:var(--ink);stroke-width:3"}, svg);
      txt(svg, X(j, 0), B + 20, "svg-t", NAMES[j]);
    }
    txt(svg, L + 8, T + 14, "w4-leg", "진한 점일수록 실력이 높은 조, 같은 조끼리 선으로 이었어요", "text-anchor:start;font-size:12px");
    var adj = false;
    function render(){
      var pxPerPt = (B - T) / (y1 - y0);
      groups.forEach(function(g, i){ g.style.transform = adj ? "translateY(" + (BLK[i] * pxPerPt).toFixed(2) + "px)" : "translateY(0px)"; });
      var sstr = 150 * 2, ssb = 3904 / 3, sse0 = 128 / 3;
      if (!adj){
        var mse = (ssb + sse0) / 15, F = 150 / mse;
        out.innerHTML =
          "<p>반 안 흩어짐 SSE = <span class=\"n\">" + f1(ssb + sse0) + "</span> (자유도 15)</p>" +
          "<p>MSE = <span class=\"n\">" + f2(mse) + "</span></p>" +
          "<p>MStr = " + f1(sstr) + " ÷ 2 = <span class=\"n\">150.00</span></p>" +
          "<p>F = <span class=\"n\">" + f2(F) + "</span> vs 3.68 " + pill(F > 3.68, "기각", "기각 못 함") + "</p>";
        note.textContent = "반 안에서 점들이 넓게 퍼져 있어요. 그런데 같은 반 안에서도 진한 점(실력 높은 조)은 위에, 연한 점은 아래에 몰려 있죠. 이 퍼짐의 대부분은 수업 방식이 아니라 조 사이 실력 차이예요. 위 버튼으로 조 효과를 빼 보세요.";
      } else {
        var mse2 = sse0 / 10, F2 = 150 / mse2;
        out.innerHTML =
          "<p>빠져나간 조 사이 차이 SSB = <span class=\"n\">" + f1(ssb) + "</span> (자유도 5)</p>" +
          "<p>남은 SSE = <span class=\"n\">" + f1(sse0) + "</span> (자유도 10)</p>" +
          "<p>MSE = " + f1(sse0) + " ÷ 10 = <span class=\"n\">" + f2(mse2) + "</span></p>" +
          "<p>F = <span class=\"n\">" + f2(F2) + "</span> vs 4.10 " + pill(F2 > 4.10, "기각", "기각 못 함") + "</p>";
        note.textContent = "조마다 조 평균이 전체 평균과 얼마나 다른지(조 효과)를 빼면, 점들이 반 평균 막대 근처로 모여요. 반 평균 막대는 그대로라서 SStr과 MStr은 안 변하고, SSE만 1344에서 42.7로 줄었어요. 대신 자유도가 15에서 10으로 줄어서 임계값은 3.68에서 4.10으로 올라가요.";
      }
    }
    segWire(document.querySelectorAll("#bs11-mode button"), function(b){ adj = b.getAttribute("data-m") === "adj"; render(); });
    render();
  })();

  /* ---------- 5. 반복 없는 이원배치: 숨은 교호작용은 SSE로 들어간다 ---------- */
  (function(){
    var tab = document.getElementById("tw11-tab");
    if (!tab) return;
    var svg = document.getElementById("tw11-svg");
    svgBox(svg);
    var out = document.getElementById("tw11-out"), note = document.getElementById("tw11-note");
    var sa = document.getElementById("tw11-a"), sb = document.getElementById("tw11-b"), sg = document.getElementById("tw11-g");
    var va = document.getElementById("tw11-a-v"), vb = document.getElementById("tw11-b-v"), vg = document.getElementById("tw11-g-v");
    var AL = [-1, 0, 1], BE = [-1.5, -0.5, 0.5, 1.5];
    var GA = [[1.5, 0.5, -0.5, -1.5], [0, 0, 0, 0], [-1.5, -0.5, 0.5, 1.5]];
    var E = [[0.9, -1.3, 0.5, 0.1], [-0.6, 1.0, -1.1, 0.8], [0.2, -0.4, 1.2, -0.9]];
    var CA = 5.14, CB = 4.76;   /* F0.05(2,6), F0.05(3,6) */
    function render(){
      var a = parseFloat(sa.value), b = parseFloat(sb.value), g = parseFloat(sg.value);
      va.textContent = f1(a); vb.textContent = f1(b); vg.textContent = f1(g);
      var y = [], i, j, G = 0, rm = [0, 0, 0], cm = [0, 0, 0, 0];
      for (i = 0; i < 3; i++){ y.push([]); for (j = 0; j < 4; j++){
        var v = 60 + a * AL[i] + b * BE[j] + g * GA[i][j] + E[i][j];
        y[i].push(v); G += v / 12; rm[i] += v / 4; cm[j] += v / 3;
      } }
      var ssa = 0, ssb = 0, sst = 0;
      for (i = 0; i < 3; i++) ssa += 4 * (rm[i] - G) * (rm[i] - G);
      for (j = 0; j < 4; j++) ssb += 3 * (cm[j] - G) * (cm[j] - G);
      for (i = 0; i < 3; i++) for (j = 0; j < 4; j++) sst += (y[i][j] - G) * (y[i][j] - G);
      var sse = Math.max(sst - ssa - ssb, 1e-9), mse = sse / 6;
      var FA = (ssa / 2) / mse, FB = (ssb / 3) / mse;
      var h = "<thead><tr><th></th><th>B<sub>1</sub></th><th>B<sub>2</sub></th><th>B<sub>3</sub></th><th>B<sub>4</sub></th><th>평균</th></tr></thead><tbody>";
      for (i = 0; i < 3; i++){
        h += "<tr><th scope=\"row\">A<sub>" + (i + 1) + "</sub></th>";
        for (j = 0; j < 4; j++) h += "<td>" + f1(y[i][j]) + "</td>";
        h += "<td><b>" + f1(rm[i]) + "</b></td></tr>";
      }
      h += "<tr><th scope=\"row\">평균</th>";
      for (j = 0; j < 4; j++) h += "<td><b>" + f1(cm[j]) + "</b></td>";
      tab.innerHTML = h + "<td><b>" + f1(G) + "</b></td></tr></tbody>";
      clear(svg);
      txt(svg, 10, 20, "w4-leg", "SST = " + f1(sst) + "을 쪼개면", "text-anchor:start");
      stackBar(svg, 32, 34, [
        {v: ssa, c: "var(--blue)", label: "SSA"},
        {v: ssb, c: "var(--green)", label: "SSB"},
        {v: sse, c: "var(--orange)", label: "SSE"}], sst, 10, 550);
      txt(svg, 10, 88, "w4-leg", "파랑 SSA(행 평균 차이) · 초록 SSB(열 평균 차이) · 주황 SSE(나머지)", "text-anchor:start;font-size:12px");
      out.innerHTML =
        "<p>SSA = <span class=\"n\">" + f1(ssa) + "</span>, SSB = <span class=\"n\">" + f1(ssb) + "</span></p>" +
        "<p>SSE = <span class=\"n\">" + f1(sse) + "</span>, MSE = SSE ÷ 6 = <span class=\"n\">" + f2(mse) + "</span></p>" +
        "<p>F<sub>A</sub> = <span class=\"n\">" + f2(FA) + "</span> vs 5.14 " + pill(FA > CA, "기각", "기각 못 함") + "</p>" +
        "<p>F<sub>B</sub> = <span class=\"n\">" + f2(FB) + "</span> vs 4.76 " + pill(FB > CB, "기각", "기각 못 함") + "</p>";
      var msg;
      if (g === 0) msg = "지금은 교호작용이 없는 자료라서 SSE에는 작은 잡음만 들어 있어요. A 효과나 B 효과를 줄여 보면서 F가 언제 임계값 아래로 내려가는지 확인해 보세요.";
      else if (FA <= CA || FB <= CB) msg = "실제로는 칸마다 추가로 생기는 효과(교호작용)가 있는데, 칸에 값이 하나뿐이라 이걸 오차와 구분할 수 없어서 전부 SSE로 들어갔어요. 그래서 MSE가 커지고, A, B 효과는 그대로인데도 F가 작아져서 기각하지 못하게 됐어요. 교호작용을 따로 보려면 반복이 필요한 이유예요.";
      else msg = "교호작용을 키우면 행 평균과 열 평균(SSA, SSB)은 거의 그대로인데 SSE만 커져요. 칸마다 값이 하나뿐이라 교호작용이 오차와 섞여 SSE로 들어가기 때문이에요. 더 키워 보면 F가 기각 기준 아래로 내려가요.";
      note.textContent = msg;
    }
    [sa, sb, sg].forEach(function(s){ s.addEventListener("input", render); });
    render();
  })();

  /* ---------- 6. 반복 있는 이원배치: 교호작용 그림과 검정 순서 ---------- */
  (function(){
    var svg = document.getElementById("ip11-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("ip11-out"), note = document.getElementById("ip11-note");
    var ids = ["t", "s", "g", "e"], S = {}, V = {};
    ids.forEach(function(k){ S[k] = document.getElementById("ip11-" + k); V[k] = document.getElementById("ip11-" + k + "-v"); });
    var PRE = {par: [6, 10, 0], wide: [6, 10, 10], cross: [0, 10, 16]};
    /* 칸마다 4명분의 고정된 잡음 (칸 순서: 교재 A의 적음, 보통, 많음, 교재 B의 적음, 보통, 많음) */
    var NZ = [[0.8, -1.2, 0.3, -0.4], [-0.9, 0.5, 1.4, -0.2], [0.2, -0.7, -1.1, 0.9],
              [1.1, -0.3, -0.8, 0.6], [-0.5, 1.3, 0.1, -1.0], [0.4, -0.6, 0.9, -1.4]];
    var XJ = [-0.5, 0, 0.5], LV = ["복습 적음", "보통", "많음"], COL = ["var(--blue)", "var(--orange)"], BK = ["교재 A", "교재 B"];
    var CA = 4.41, CB = 3.55, CAB = 3.55;   /* F0.05(1,18), F0.05(2,18), F0.05(2,18) */
    function render(){
      var t = parseFloat(S.t.value), s = parseFloat(S.s.value), g = parseFloat(S.g.value), e = parseFloat(S.e.value);
      V.t.textContent = f1(t); V.s.textContent = f1(s); V.g.textContent = (g > 0 ? "+" : "") + f1(g); V.e.textContent = f1(e);
      var y = [[], []], m = [[0, 0, 0], [0, 0, 0]], i, j, k, G = 0, Am = [0, 0], Bm = [0, 0, 0];
      for (i = 0; i < 2; i++) for (j = 0; j < 3; j++){
        var mu = 70 + t * (i - 0.5) + s * XJ[j] + g * (i - 0.5) * XJ[j];
        y[i].push(NZ[i * 3 + j].map(function(z){ return mu + e * z; }));
        m[i][j] = y[i][j].reduce(function(a, b){ return a + b; }, 0) / 4;
        G += m[i][j] / 6; Am[i] += m[i][j] / 3; Bm[j] += m[i][j] / 2;
      }
      var ssa = 0, ssb = 0, ssab = 0, sse = 0;
      for (i = 0; i < 2; i++) ssa += 12 * (Am[i] - G) * (Am[i] - G);
      for (j = 0; j < 3; j++) ssb += 8 * (Bm[j] - G) * (Bm[j] - G);
      for (i = 0; i < 2; i++) for (j = 0; j < 3; j++){
        var d = m[i][j] - Am[i] - Bm[j] + G; ssab += 4 * d * d;
        for (k = 0; k < 4; k++) sse += (y[i][j][k] - m[i][j]) * (y[i][j][k] - m[i][j]);
      }
      var mse = sse / 18, FA = ssa / mse, FB = (ssb / 2) / mse, FAB = (ssab / 2) / mse;
      clear(svg);
      var L = 44, R = 450, T = 14, B = 232, y0 = 40, y1 = 100;
      function X(j){ return L + (j + 0.5) / 3 * (R - L); }
      function Y(v){ return B - (v - y0) / (y1 - y0) * (B - T); }
      el("clipPath", {id: "ip11-clip"}, svg);
      el("rect", {x: L, y: T, width: R - L, height: B - T}, svg.lastChild);
      [40, 50, 60, 70, 80, 90, 100].forEach(function(v){
        el("line", {x1: L, x2: R, y1: Y(v), y2: Y(v), "class": "grid-l"}, svg);
        txt(svg, L - 8, Y(v) + 4, "svg-t", String(v), "text-anchor:end");
      });
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      var gc = el("g", {"clip-path": "url(#ip11-clip)"}, svg);
      for (i = 0; i < 2; i++){
        for (j = 0; j < 3; j++) for (k = 0; k < 4; k++)
          el("circle", {cx: X(j) + (i ? 9 : -9) + (k - 1.5) * 2.5, cy: Y(y[i][j][k]), r: 2.8, style: "fill:" + COL[i] + ";fill-opacity:.35"}, gc);
        el("polyline", {points: [0, 1, 2].map(function(j){ return X(j) + "," + Y(m[i][j]); }).join(" "), style: "fill:none;stroke:" + COL[i] + ";stroke-width:3"}, gc);
        for (j = 0; j < 3; j++) el("circle", {cx: X(j), cy: Y(m[i][j]), r: 6, style: "fill:" + COL[i] + ";stroke:var(--ground);stroke-width:2"}, gc);
        txt(svg, R + 8, Y(m[i][2]) + 5, "w4-leg " + (i ? "o" : "b"), BK[i], "text-anchor:start");
      }
      for (j = 0; j < 3; j++) txt(svg, X(j), B + 20, "svg-t", LV[j]);
      txt(svg, L + 8, T + 14, "w4-leg", "큰 점 = 칸 평균, 작은 점 = 칸 안의 4명", "text-anchor:start;font-size:12px");
      var rejAB = FAB > CAB;
      var h = "<p>MSE = SSE ÷ 18 = <span class=\"n\">" + f2(mse) + "</span></p>" +
        "<p><b>①</b> 교호작용 F = <span class=\"n\">" + f2(FAB) + "</span> vs 3.55 " + pill(!rejAB, "유의하지 않음", "유의함") + "</p>";
      if (!rejAB){
        h += "<p><b>②</b> 교재 F<sub>A</sub> = <span class=\"n\">" + f2(FA) + "</span> vs 4.41 " + pill(FA > CA, "기각", "기각 못 함") + "</p>" +
             "<p><b>②</b> 복습 F<sub>B</sub> = <span class=\"n\">" + f2(FB) + "</span> vs 3.55 " + pill(FB > CB, "기각", "기각 못 함") + "</p>";
      } else {
        h += "<p class=\"w-full\" style=\"grid-column:1/-1\"><b>②</b> 주효과 검정은 하지 않아요 <span class=\"pill neutral\">교재 효과가 복습량에 따라 달라짐</span></p>";
      }
      out.innerHTML = h;
      var msg;
      if (g === 0 && !rejAB) msg = "실제 칸 평균은 두 선이 평행하게 만들어 두었는데, 표본평균으로 그린 선은 잡음 때문에 완전히 평행하지는 않아요. 그래도 교호작용 F가 작아서 유의하지 않으니, 그다음에 교재와 복습량의 주효과를 각각 검정해요.";
      else if (!rejAB) msg = "선이 조금 평행하지 않아 보여도, 칸 안 흩어짐에 비해 크지 않으면 교호작용은 유의하지 않아요. 그림은 감을 잡는 용도이고 판단은 F검정으로 해요. 흩어짐을 줄이면 같은 기울기 차이로도 유의해져요.";
      else if (Math.sign(t - g / 2) !== Math.sign(t + g / 2) && t - g / 2 !== 0) msg = "두 선이 교차해요. 복습이 적을 때와 많을 때 어느 교재가 나은지가 뒤집혀서, '교재 A와 B 중 뭐가 나은가'에 한마디로 답할 수 없어요. 그래서 교호작용이 유의하면 주효과 검정은 하지 않아요.";
      else msg = "교차하지는 않지만 간격이 복습량에 따라 달라져요. 교호작용의 기준은 교차가 아니라 평행하지 않음이에요. 교호작용이 유의하니 주효과 검정은 하지 않아요.";
      note.textContent = msg;
    }
    ids.forEach(function(k){ S[k].addEventListener("input", function(){
      Array.prototype.forEach.call(document.querySelectorAll("#ip11-pre button"), function(o){ o.classList.remove("on"); o.setAttribute("aria-pressed", "false"); });
      render();
    }); });
    segWire(document.querySelectorAll("#ip11-pre button"), function(b){
      var p = PRE[b.getAttribute("data-p")];
      S.t.value = p[0]; S.s.value = p[1]; S.g.value = p[2];
      render();
    });
    render();
  })();
})();
