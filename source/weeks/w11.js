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
})();
