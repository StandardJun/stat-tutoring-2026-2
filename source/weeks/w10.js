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
})();
