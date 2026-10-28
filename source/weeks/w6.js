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
  /* 표준정규 누적확률 (오차 1e-7 이하) */
  function Phi(z){
    var a = Math.abs(z), t = 1 / (1 + 0.2316419 * a);
    var poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    var up = Math.exp(-0.5 * a * a) / Math.sqrt(2 * Math.PI) * poly;
    return z >= 0 ? 1 - up : up;
  }
  var C = {
    blue: "var(--blue)", orange: "var(--orange)", red: "var(--red)", ink: "var(--ink)", muted: "var(--muted)", rule: "var(--rule)"
  };
  function pill(ok, yes, no){ return "<span class=\"pill " + (ok ? "yes\">" + yes : "no\">" + no) + "</span>"; }

  /* ---------- 1. 동전 100번: 관측값을 바꾸면 p value와 판단이 어떻게 바뀌나 ---------- */
  (function(){
    var svg = document.getElementById("cn6-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("cn6-out"), note = document.getElementById("cn6-note");
    var slider = document.getElementById("cn6-x"), sv = document.getElementById("cn6-x-v");
    var N = 100, pmf = [Math.pow(0.5, N)], sf = [];
    for (var k = 0; k < N; k++) pmf[k + 1] = pmf[k] * (N - k) / (k + 1);
    sf[N + 1] = 0;
    for (k = N; k >= 0; k--) sf[k] = sf[k + 1] + pmf[k];
    /* 기각역의 시작: P(X ≥ c) ≤ α인 가장 작은 c */
    function cut(alpha){ for (var c = 0; c <= N; c++) if (sf[c] <= alpha) return c; return N + 1; }
    function fmtP(p){ return p < 0.0001 ? "0.0001보다 작음" : p.toFixed(4); }
    var a = "0.05", x = 65;
    function render(){
      var alpha = parseFloat(a), c = cut(alpha), p = sf[x];
      var rejRR = x >= c, rejP = p <= alpha;
      clear(svg);
      var L = 20, R = 540, T = 16, B = 192, lo = 30, hi = 75, nb = hi - lo + 1, ymax = 0.085;
      var gw = (R - L) / nb;
      function CX(v){ return L + gw * (v - lo + 0.5); }
      function Y(v){ return B - v / ymax * (B - T); }
      for (var v = lo; v <= hi; v++){
        var on = v >= x;
        el("rect", {x: CX(v) - gw * 0.4, y: Y(pmf[v]), width: gw * 0.8, height: Math.max(0, B - Y(pmf[v])),
          style: "fill:" + (on ? C.orange : C.blue) + ";opacity:" + (on ? 0.9 : 0.35)}, svg);
      }
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      if (c <= hi){
        el("line", {x1: CX(c) - gw / 2, x2: R, y1: B + 0.5, y2: B + 0.5, style: "stroke:" + C.red + ";stroke-width:6;opacity:.8"}, svg);
        txt(svg, R - 2, B - 10, "w4-cut-t", "기각역 (" + c + "번 이상)", "text-anchor:end");
      }
      [30, 40, 50, 60, 70].forEach(function(t){ txt(svg, CX(t), B + 18, "svg-t", String(t)); });
      var tx = CX(x);
      el("line", {x1: tx, x2: tx, y1: B - 6, y2: B + 6, style: "stroke:" + C.orange + ";stroke-width:3"}, svg);
      el("circle", {cx: tx, cy: B, r: 5.5, style: "fill:" + C.orange + ";stroke:var(--ground);stroke-width:1.5"}, svg);
      txt(svg, Math.min(tx, R - 60), B + 38, "svg-t", "관측값 " + x + "번", "fill:var(--orange);font-weight:700");
      txt(svg, L + 4, T + 12, "w4-leg", "주황 막대의 넓이 합 = p value", "text-anchor:start;fill:var(--orange)");
      out.innerHTML =
        "<p>검정통계량 (앞면 횟수) = <span class=\"n\">" + x + "번</span></p>" +
        "<p>p value = P(앞면 ≥ " + x + ") = <span class=\"n\">" + fmtP(p) + "</span></p>" +
        "<p>기각역 " + c + "번 이상 → " + pill(rejRR, "귀무가설 기각", "기각 못 함") + "</p>" +
        "<p>" + (rejP ? "p value ≤ " + a : "p value가 " + a + "보다 큼") + " → " + pill(rejP, "귀무가설 기각", "기각 못 함") + "</p>";
      var msg;
      if (x === c) msg = "기각역이 시작되는 값이에요. 한 번만 덜 나와서 " + (x - 1) + "번이면 p value가 α보다 커져서(" + sf[x - 1].toFixed(4) + ") 기각하지 못해요.";
      else if (x <= 55) msg = "50번 근처는 공정한 동전에서도 흔하게 나오는 값이에요. 주황 넓이(p value)가 커서 귀무가설을 버릴 근거가 없어요.";
      else if (!rejP) msg = "조금 많이 나오긴 했지만, 공정한 동전에서도 " + x + "번 이상은 " + (100 * p).toFixed(1) + "% 확률로 나와요. 유의수준 " + a + "보다 커서 기각하지 못해요.";
      else msg = "공정한 동전이라면 " + x + "번 이상 나올 확률이 " + (p < 0.0001 ? "0.01%도 안 돼요" : (100 * p).toFixed(2) + "%밖에 안 돼요") + ". 이렇게 희박하면 귀무가설을 버려요. 관측값이 기각역 안에 있으면 p value도 항상 α 이하라서 두 방법의 판단이 같아요.";
      note.textContent = msg;
    }
    segWire(document.querySelectorAll("#cn6-a button"), function(b){ a = b.getAttribute("data-a"); render(); });
    slider.addEventListener("input", function(){ x = parseInt(slider.value, 10); sv.textContent = x; render(); });
    render();
  })();

  /* ---------- 2. χ² 적합도: 판매량을 바꾸면 χ²와 p value가 어떻게 바뀌나 ---------- */
  (function(){
    var svg = document.getElementById("gf6-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("gf6-out"), note = document.getElementById("gf6-note");
    var ids = ["a", "b", "c", "d"], names = ["A", "B", "C", "D"], start = [62, 41, 55, 42];
    var sl = ids.map(function(i){ return document.getElementById("gf6-" + i); });
    var vs = ids.map(function(i){ return document.getElementById("gf6-" + i + "-v"); });
    var CRIT = 7.815;
    /* 자유도 3인 χ²의 오른쪽 꼬리 넓이 */
    function sf3(x){ if (x <= 0) return 1; return 2 * (1 - Phi(Math.sqrt(x))) + Math.sqrt(2 * x / Math.PI) * Math.exp(-x / 2); }
    function f1(v){ return Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(1); }
    function render(){
      var O = sl.map(function(s){ return parseInt(s.value, 10); });
      O.forEach(function(o, i){ vs[i].textContent = o; });
      var n = O.reduce(function(s, v){ return s + v; }, 0), E = n / 4;
      var part = O.map(function(o){ return (o - E) * (o - E) / E; });
      var chi = part.reduce(function(s, v){ return s + v; }, 0), p = sf3(chi), rej = chi >= CRIT;
      clear(svg);
      var L = 40, R = 540, T = 30, B = 196, ymax = 105;
      function Y(v){ return B - v / ymax * (B - T); }
      [0, 25, 50, 75, 100].forEach(function(t){
        el("line", {x1: L, x2: R, y1: Y(t), y2: Y(t), "class": "grid-l"}, svg);
        txt(svg, L - 8, Y(t) + 4, "svg-t", String(t), "text-anchor:end");
      });
      var gw = (R - L) / 4, bw = gw * 0.3;
      O.forEach(function(o, i){
        var cx = L + gw * (i + 0.5);
        el("rect", {x: cx - bw - 2, y: Y(o), width: bw, height: B - Y(o), style: "fill:" + C.orange}, svg);
        el("rect", {x: cx + 2, y: Y(E), width: bw, height: B - Y(E), style: "fill:" + C.blue + ";opacity:.35"}, svg);
        txt(svg, cx - bw / 2 - 2, Y(o) - 6, "svg-v", String(o), "font-size:13px");
        txt(svg, cx, B + 18, "svg-t", "메뉴 " + names[i]);
      });
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      el("rect", {x: R - 196, y: 8, width: 12, height: 12, style: "fill:" + C.orange}, svg);
      txt(svg, R - 180, 18, "w4-leg", "실제 (관측)", "text-anchor:start");
      el("rect", {x: R - 96, y: 8, width: 12, height: 12, style: "fill:" + C.blue + ";opacity:.35"}, svg);
      txt(svg, R - 80, 18, "w4-leg", "기대 " + f1(E), "text-anchor:start");
      var rows = O.map(function(o, i){
        return "<p>" + names[i] + ": (" + o + " − " + f1(E) + ")² ÷ " + f1(E) + " = <span class=\"n\">" + part[i].toFixed(2) + "</span></p>";
      }).join("");
      out.innerHTML = rows +
        "<p>χ² = <span class=\"n\">" + chi.toFixed(2) + "</span> <span class=\"muted\">(전체 " + n + "개)</span></p>" +
        "<p>p value = <span class=\"n\">" + (p < 0.0001 ? "0.0001보다 작음" : p.toFixed(4)) + "</span></p>" +
        "<p class=\"w-full\">유의수준 0.05의 임계값 7.815 → " + pill(rej, "귀무가설 기각", "기각 못 함") + "</p>";
      var big = 0; part.forEach(function(v, i){ if (v > part[big]) big = i; });
      var msg;
      if (chi < 1) msg = "네 메뉴가 거의 고르게 팔렸어요. 관측과 기대가 비슷해서 χ²가 작아요.";
      else if (!rej) msg = "기대와 조금 어긋나지만, 고르게 팔린다고 해도 이 정도 어긋남은 " + (100 * p).toFixed(0) + "% 확률로 나와요. 우연으로도 충분히 나올 수 있어서 기각하지 못해요. 지금 χ²에 가장 많이 보탠 건 메뉴 " + names[big] + "예요.";
      else msg = "기대와 많이 어긋나서 χ²가 커졌어요. 고르게 팔린다면 이만큼 어긋날 확률(p value)이 0.05보다 작아서 귀무가설을 기각해요. 가장 많이 보탠 건 메뉴 " + names[big] + "예요.";
      note.textContent = msg;
    }
    sl.forEach(function(s){ s.addEventListener("input", render); });
    document.getElementById("gf6-reset").addEventListener("click", function(){
      sl.forEach(function(s, i){ s.value = start[i]; }); render();
    });
    render();
  })();

  /* ---------- 3. 최소제곱법: 기울기를 바꾸면 잔차 제곱합이 어떻게 바뀌나 ---------- */
  (function(){
    var svg = document.getElementById("ls6-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("ls6-out"), note = document.getElementById("ls6-note");
    var slider = document.getElementById("ls6-b"), sv = document.getElementById("ls6-b-v");
    var xs = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    var ys = [45, 52, 50, 61, 58, 55, 69, 62, 73, 66, 80, 74];
    var n = xs.length;
    var xb = xs.reduce(function(s, v){ return s + v; }, 0) / n;
    var yb = ys.reduce(function(s, v){ return s + v; }, 0) / n;
    var sxx = 0, sxy = 0, sst = 0;
    for (var i = 0; i < n; i++){ sxx += (xs[i] - xb) * (xs[i] - xb); sxy += (xs[i] - xb) * (ys[i] - yb); sst += (ys[i] - yb) * (ys[i] - yb); }
    var bhat = sxy / sxx;
    function sse(b){ var s = 0; for (var i = 0; i < n; i++){ var r = ys[i] - (yb + b * (xs[i] - xb)); s += r * r; } return s; }
    var smin = sse(bhat), b = 1.5;
    function render(){
      var s = sse(b), best = Math.abs(b - bhat) <= 0.03;
      clear(svg);
      var L = 44, R = 540, T = 14, B = 238, x0 = 1, x1 = 14, y0 = 38, y1 = 86;
      function X(v){ return L + (v - x0) / (x1 - x0) * (R - L); }
      function Y(v){ return B - (Math.max(y0, Math.min(y1, v)) - y0) / (y1 - y0) * (B - T); }
      [40, 50, 60, 70, 80].forEach(function(t){
        el("line", {x1: L, x2: R, y1: Y(t), y2: Y(t), "class": "grid-l"}, svg);
        txt(svg, L - 8, Y(t) + 4, "svg-t", String(t), "text-anchor:end");
      });
      [2, 4, 6, 8, 10, 12, 14].forEach(function(t){ txt(svg, X(t), B + 18, "svg-t", String(t)); });
      txt(svg, (L + R) / 2, B + 36, "svg-t", "주당 공부 시간 (시간)");
      el("line", {x1: L, x2: R, y1: B, y2: B, "class": "ax"}, svg);
      for (var i = 0; i < n; i++){
        var fit = yb + b * (xs[i] - xb);
        el("line", {x1: X(xs[i]), x2: X(xs[i]), y1: Y(ys[i]), y2: Y(fit), style: "stroke:" + C.red + ";stroke-width:1.8;stroke-dasharray:4 3"}, svg);
      }
      el("line", {x1: X(x0), x2: X(x1), y1: Y(yb + b * (x0 - xb)), y2: Y(yb + b * (x1 - xb)),
        style: "stroke:" + C.ink + ";stroke-width:" + (best ? 3 : 2.2)}, svg);
      for (i = 0; i < n; i++) el("circle", {cx: X(xs[i]), cy: Y(ys[i]), r: 5, style: "fill:" + C.orange}, svg);
      el("circle", {cx: X(xb), cy: Y(yb), r: 6, style: "fill:var(--ground);stroke:" + C.blue + ";stroke-width:2.5"}, svg);
      txt(svg, X(xb) + 10, Y(yb) + 20, "w4-leg b", "평균점", "text-anchor:start");
      txt(svg, L + 8, T + 14, "w4-leg", "빨간 점선 = 잔차", "text-anchor:start;fill:var(--red)");
      out.innerHTML =
        "<p>기울기 = <span class=\"n\">" + (best ? bhat.toFixed(2) : b.toFixed(2)) + "</span></p>" +
        "<p>잔차 제곱합 = <span class=\"n\">" + (best ? smin : s).toFixed(1) + "</span></p>" +
        "<p>최소제곱 직선의 기울기 = <span class=\"n\">" + bhat.toFixed(2) + "</span></p>" +
        "<p>그때의 잔차 제곱합 = <span class=\"n\">" + smin.toFixed(1) + "</span> <span class=\"muted\">(가장 작은 값)</span></p>";
      var msg;
      if (best) msg = "지금이 최소제곱 직선이에요. 기울기를 어느 쪽으로 움직여도 잔차 제곱합이 커져요. 이때 점수 전체 흩어짐 " + sst.toFixed(1) + " 중 잔차가 " + smin.toFixed(1) + "로 약 " + (100 * smin / sst).toFixed(0) + "%라서, 설명력은 100% − " + (100 * smin / sst).toFixed(0) + "% = 약 " + (100 * (1 - smin / sst)).toFixed(0) + "%예요.";
      else if (b < bhat) msg = "직선이 점들보다 완만해서 왼쪽 아래와 오른쪽 위 점들의 잔차가 커요. 기울기를 키워 보세요.";
      else msg = "직선이 점들보다 가팔라서 양 끝 점들의 잔차가 커요. 기울기를 줄여 보세요.";
      note.textContent = msg;
    }
    slider.addEventListener("input", function(){ b = parseFloat(slider.value); sv.textContent = b.toFixed(2); render(); });
    document.getElementById("ls6-best").addEventListener("click", function(){
      b = bhat; slider.value = bhat.toFixed(2); sv.textContent = bhat.toFixed(2); render();
    });
    render();
  })();
})();
