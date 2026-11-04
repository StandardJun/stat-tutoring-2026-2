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
  function fv(v){ return Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(1); }

  /* ---------- 1. 합동표본분산: 자유도로 가중한 평균은 어디에 놓이나 ---------- */
  (function(){
    var svg = document.getElementById("pw7-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("pw7-out"), note = document.getElementById("pw7-note");
    var ids = ["n1", "s1", "n2", "s2"];
    var sl = {}, vs = {};
    ids.forEach(function(i){ sl[i] = document.getElementById("pw7-" + i); vs[i] = document.getElementById("pw7-" + i + "-v"); });
    function render(){
      var n1 = parseInt(sl.n1.value, 10), n2 = parseInt(sl.n2.value, 10);
      var s1 = parseFloat(sl.s1.value), s2 = parseFloat(sl.s2.value);
      vs.n1.textContent = n1; vs.n2.textContent = n2; vs.s1.textContent = fv(s1); vs.s2.textContent = fv(s2);
      var w1 = n1 - 1, w2 = n2 - 1, sp = (w1 * s1 + w2 * s2) / (w1 + w2), avg = (s1 + s2) / 2;
      clear(svg);
      var L = 40, R = 520, Yl = 92, lo = 0, hi = 20;
      function X(v){ return L + (v - lo) / (hi - lo) * (R - L); }
      el("line", {x1: L, x2: R, y1: Yl, y2: Yl, "class": "ax"}, svg);
      [0, 5, 10, 15, 20].forEach(function(t){
        el("line", {x1: X(t), x2: X(t), y1: Yl - 4, y2: Yl + 4, "class": "ax"}, svg);
        txt(svg, X(t), Yl + 22, "svg-t", String(t));
      });
      /* 두 표본분산: 점 크기 = 자유도 비중 */
      var r1 = 5 + 12 * Math.sqrt(w1 / (w1 + w2)), r2 = 5 + 12 * Math.sqrt(w2 / (w1 + w2));
      el("circle", {cx: X(s1), cy: Yl, r: r1, style: "fill:" + C.blue + ";opacity:.55"}, svg);
      el("circle", {cx: X(s2), cy: Yl, r: r2, style: "fill:" + C.orange + ";opacity:.55"}, svg);
      txt(svg, X(s1), Yl - r1 - 6, "svg-t", "s₁²", "fill:var(--blue);font-weight:700");
      txt(svg, X(s2), Yl - r2 - 6, "svg-t", "s₂²", "fill:var(--orange);font-weight:700");
      /* 단순평균과 합동표본분산 */
      el("line", {x1: X(avg), x2: X(avg), y1: Yl + 30, y2: Yl + 44, style: "stroke:" + C.muted + ";stroke-width:2;stroke-dasharray:3 3"}, svg);
      txt(svg, X(avg), Yl + 56, "svg-t", "단순평균", "font-size:12px");
      el("path", {d: "M" + X(sp) + " " + (Yl - 34) + " l-7 -12 h14 z", style: "fill:" + C.red}, svg);
      txt(svg, X(sp), Yl - 52, "svg-t", "Sₚ²", "fill:var(--red);font-weight:700");
      out.innerHTML =
        "<p>비중: " + "<span class=\"c-mu\">" + w1 + "</span> : <span class=\"c-xb\">" + w2 + "</span> <span class=\"muted\">(n₁ − 1 : n₂ − 1)</span></p>" +
        "<p>Sₚ² = (" + w1 + "×" + fv(s1) + " + " + w2 + "×" + fv(s2) + ") ÷ " + (w1 + w2) + " = <span class=\"n\">" + f2(sp) + "</span></p>" +
        "<p>단순평균 = <span class=\"n\">" + f2(avg) + "</span></p>" +
        "<p>자유도 n₁ + n₂ − 2 = <span class=\"n\">" + (w1 + w2) + "</span></p>";
      var msg;
      if (Math.abs(s1 - s2) < 1e-9) msg = "두 표본분산이 같으면 비중과 상관없이 합동표본분산도 같은 값이에요.";
      else if (w1 === w2) msg = "두 표본 크기가 같으면 비중이 같아서 합동표본분산이 단순평균과 같아져요.";
      else msg = "표본이 더 큰 " + (w1 > w2 ? "첫 번째(파랑)" : "두 번째(주황)") + " 쪽 말을 더 믿어서, 합동표본분산이 단순평균보다 그쪽으로 끌려가요.";
      note.textContent = msg;
    }
    ids.forEach(function(i){ sl[i].addEventListener("input", render); });
    render();
  })();

  /* ---------- 2. 대응비교: 개인차를 바꾸면 두 방법의 t가 어떻게 바뀌나 ---------- */
  (function(){
    var svg = document.getElementById("pd7-svg");
    if (!svg) return;
    svgBox(svg);
    var out = document.getElementById("pd7-out"), note = document.getElementById("pd7-note");
    var slider = document.getElementById("pd7-k"), sv = document.getElementById("pd7-k-v");
    var base = [48, 55, 63, 70, 77, 86], d = [5, 3, 6, 4, 7, 5], n = 6;
    var bm = base.reduce(function(s, v){ return s + v; }, 0) / n;
    function mean(a){ return a.reduce(function(s, v){ return s + v; }, 0) / a.length; }
    function svar(a){ var m = mean(a); return a.reduce(function(s, v){ return s + (v - m) * (v - m); }, 0) / (a.length - 1); }
    var dbar = mean(d), sd = Math.sqrt(svar(d)), tPair = dbar / (sd / Math.sqrt(n));
    function render(){
      var k = parseInt(slider.value, 10) / 100;
      sv.textContent = Math.round(k * 100) + "%";
      var pre = base.map(function(v){ return bm + k * (v - bm); });
      var post = pre.map(function(v, i){ return v + d[i]; });
      var sp2 = (svar(pre) + svar(post)) / 2, se = Math.sqrt(sp2 * (2 / n)), tInd = (mean(post) - mean(pre)) / se;
      clear(svg);
      var L = 50, R = 540, y1 = 40, y2 = 110, lo = 30, hi = 105;
      function X(v){ return L + (v - lo) / (hi - lo) * (R - L); }
      txt(svg, L - 10, y1 + 5, "svg-t", "전", "text-anchor:end");
      txt(svg, L - 10, y2 + 5, "svg-t", "후", "text-anchor:end");
      for (var i = 0; i < n; i++){
        el("line", {x1: X(pre[i]), x2: X(post[i]), y1: y1, y2: y2, style: "stroke:" + C.muted + ";stroke-width:1;stroke-dasharray:3 3"}, svg);
      }
      el("line", {x1: X(mean(pre)), x2: X(mean(pre)), y1: y1 - 18, y2: y1 + 18, style: "stroke:" + C.blue + ";stroke-width:3"}, svg);
      el("line", {x1: X(mean(post)), x2: X(mean(post)), y1: y2 - 18, y2: y2 + 18, style: "stroke:" + C.orange + ";stroke-width:3"}, svg);
      pre.forEach(function(v){ el("circle", {cx: X(v), cy: y1, r: 6.5, style: "fill:" + C.blue}, svg); });
      post.forEach(function(v){ el("circle", {cx: X(v), cy: y2, r: 6.5, style: "fill:" + C.orange}, svg); });
      el("line", {x1: L, x2: R, y1: 145, y2: 145, "class": "ax"}, svg);
      [40, 60, 80, 100].forEach(function(t){ txt(svg, X(t), 162, "svg-t", String(t)); });
      var rejI = Math.abs(tInd) >= 2.228, rejP = tPair >= 2.571;
      out.innerHTML =
        "<p>평균 차이 (후 − 전) = <span class=\"n\">" + f2(mean(post) - mean(pre)) + "</span> <span class=\"muted\">(두 방법 같음)</span></p>" +
        "<p>독립으로 본 표준오차 = <span class=\"n\">" + f2(se) + "</span></p>" +
        "<p>독립 이표본 t = <span class=\"n\">" + f2(tInd) + "</span> " + pill(rejI, "기각", "기각 못 함") + " <span class=\"muted\">(기준 2.228)</span></p>" +
        "<p>대응비교 t = <span class=\"n\">" + f2(tPair) + "</span> " + pill(rejP, "기각", "기각 못 함") + " <span class=\"muted\">(기준 2.571)</span></p>";
      var msg;
      if (k === 0) msg = "모든 사람의 원래 점수가 같으면 독립으로 봐도 흩어짐이 차이(후 − 전)의 흩어짐밖에 없어서, 두 방법 모두 차이를 잘 잡아요.";
      else if (!rejI) msg = "평균 차이는 그대로 5점인데, 사람끼리 원래 점수가 흩어져 있어서 독립으로 보면 표준오차가 커지고 차이가 묻혀요. 짝지어 빼면 사람마다의 원래 점수가 지워져서 대응비교 t는 그대로예요.";
      else msg = "사람끼리 원래 점수 차이가 작아서 독립으로 봐도 5점 차이가 보여요. 그래도 대응비교 t가 더 커요. 개인차를 키워 보세요.";
      note.textContent = msg;
    }
    slider.addEventListener("input", render);
    render();
  })();
})();
