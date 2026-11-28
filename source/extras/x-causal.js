(function(){
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent){
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, attrs){
    var a = {x: x, y: y, "font-size": 12, fill: "var(--muted)"};
    for (var k in attrs) a[k] = attrs[k];
    var t = el("text", a, parent); t.textContent = s; return t;
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
  function f2(v){ var r = Math.round(v * 100) / 100; return (r < 0 ? "−" : "") + String(Math.abs(r)); }
  function sgn(v){ return v > 0 ? "+" + v : v < 0 ? "−" + Math.abs(v) : "0"; }
  function mean(a){ var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }

  /* 학생 8명: 앞 4명 상위권, 뒤 4명 하위권. ATE = 5 */
  var S = [
    {lv: "상위권", y0: 85, y1: 88}, {lv: "상위권", y0: 82, y1: 86},
    {lv: "상위권", y0: 88, y1: 90}, {lv: "상위권", y0: 80, y1: 86},
    {lv: "하위권", y0: 60, y1: 68}, {lv: "하위권", y0: 55, y1: 61},
    {lv: "하위권", y0: 62, y1: 66}, {lv: "하위권", y0: 58, y1: 65}
  ];
  var ATE = mean(S.map(function(s){ return s.y1 - s.y0; }));
  var SELF = [1, 1, 1, 1, 0, 0, 0, 0];
  function estimate(Tv, y0, y1){
    var a = [], b = [];
    for (var i = 0; i < Tv.length; i++) (Tv[i] ? a : b).push(Tv[i] ? y1[i] : y0[i]);
    return mean(a) - mean(b);
  }
  function shuffleHalf(n){
    var idx = []; for (var i = 0; i < n; i++) idx.push(i);
    for (var j = n - 1; j > 0; j--){ var r = Math.floor(Math.random() * (j + 1)); var t = idx[j]; idx[j] = idx[r]; idx[r] = t; }
    var T = new Array(n); for (var k = 0; k < n; k++) T[idx[k]] = k < n / 2 ? 1 : 0;
    return T;
  }

  /* ---------- 위젯 1: 잠재적 결과 표 ---------- */
  (function(){
    var root = document.getElementById("po-w"); if (!root) return;
    var tab = document.getElementById("po-tab"), out = document.getElementById("po-out"), note = document.getElementById("po-note");
    var re = document.getElementById("po-re");
    var view = "all", asg = "self", T = SELF.slice();
    function cell(tr, s, cls){ var td = document.createElement("td"); td.textContent = s; if (cls) td.className = cls; tr.appendChild(td); }
    function render(){
      var all = view === "all";
      clear(tab);
      var thead = document.createElement("thead"), hr = document.createElement("tr");
      ["학생", "실력", "참여", "Y(0)", "Y(1)", "효과 τ"].forEach(function(h){ var th = document.createElement("th"); th.textContent = h; hr.appendChild(th); });
      thead.appendChild(hr); tab.appendChild(thead);
      var tb = document.createElement("tbody");
      S.forEach(function(s, i){
        var tr = document.createElement("tr");
        var th = document.createElement("th"); th.scope = "row"; th.textContent = (i + 1) + "번"; tr.appendChild(th);
        cell(tr, s.lv.replace("위권", ""));
        cell(tr, T[i] ? "참여" : "불참", T[i] ? "c-xb" : "c-mu");
        if (T[i]){ cell(tr, all ? String(s.y0) : "?", "num " + (all ? "dim" : "hid")); cell(tr, String(s.y1), "num obs1"); }
        else { cell(tr, String(s.y0), "num obs0"); cell(tr, all ? String(s.y1) : "?", "num " + (all ? "dim" : "hid")); }
        cell(tr, all ? String(s.y1 - s.y0) : "?", "num " + (all ? "" : "hid"));
        tb.appendChild(tr);
      });
      tab.appendChild(tb);
      var y0 = S.map(function(s){ return s.y0; }), y1 = S.map(function(s){ return s.y1; });
      var est = estimate(T, y0, y1);
      var ta = [], ca = [];
      S.forEach(function(s, i){ (T[i] ? ta : ca).push(T[i] ? s.y1 : s.y0); });
      out.innerHTML =
        '<p>참여 집단 평균 (관찰된 Y(1)) <span class="n c-xb">' + f2(mean(ta)) + '</span></p>' +
        '<p>불참 집단 평균 (관찰된 Y(0)) <span class="n c-mu">' + f2(mean(ca)) + '</span></p>' +
        '<p>관측된 평균 차이 <span class="n">' + f2(est) + '점</span></p>' +
        '<p>진짜 ATE <span class="n c-po">' + (all ? f2(ATE) + '점' : '알 수 없음') + '</span>' + (all ? '' : ' <span class="muted">(τ 열이 전부 ?)</span>') + '</p>' +
        '<div class="verdict">' + (all
          ? (Math.abs(est - ATE) < 1e-9 ? '<span class="pill yes">ATE와 같아요</span>' : '<span class="pill no">ATE보다 ' + f2(Math.abs(est - ATE)) + '점 ' + (est > ATE ? '크게' : '작게') + ' 나왔어요</span>')
          : '<span class="pill neutral">현실에서는 이 차이가 맞는지 확인할 수 없어요</span>') + '</div>';
      var nTop = 0; for (var i = 0; i < 4; i++) nTop += T[i];
      if (asg === "self") note.textContent = all
        ? "상위권 4명이 모두 참여했어요. 이 학생들은 참여하지 않아도 평균 83.75점이라, 불참한 하위권(58.75점)과 원래 25점 차이가 나요."
        : "연구자에게는 이것만 보여요. 참여 집단이 28.75점 높다는 것만 보면 프로그램 효과가 엄청나 보이죠.";
      else note.textContent = "추첨 결과 참여자 4명 중 상위권이 " + nTop + "명이에요. " +
        (nTop === 2 ? "상위권과 하위권이 반반이라 원래 실력 차이가 거의 상쇄돼요." : nTop > 2 ? "상위권이 참여 쪽에 몰려서 추정값이 위로 빗나갔어요." : "하위권이 참여 쪽에 몰려서 추정값이 아래로 빗나갔어요.");
    }
    segWire(root.querySelectorAll("#po-view button"), function(b){ view = b.getAttribute("data-v"); render(); });
    segWire(root.querySelectorAll("#po-asg button"), function(b){
      asg = b.getAttribute("data-a");
      re.hidden = asg !== "rand";
      T = asg === "self" ? SELF.slice() : shuffleHalf(8);
      render();
    });
    re.addEventListener("click", function(){ T = shuffleHalf(8); render(); });
    render();
  })();

  /* ---------- 위젯 2: 무작위 배정 반복 ---------- */
  (function(){
    var svg = document.getElementById("ra-svg"); if (!svg) return;
    var out = document.getElementById("ra-out"), reBtn = document.getElementById("ra-re");
    var N = 8;
    var W = 640, H = 240, L = 30, R = 20, TOP = 30, B = 200;
    var XMIN = -20, XMAX = 30, BW = 1;
    function X(v){ return L + (v - XMIN) / (XMAX - XMIN) * (W - L - R); }
    function all8(){
      var res = [];
      for (var m = 0; m < 256; m++){
        var c = 0, T = []; for (var i = 0; i < 8; i++){ T.push((m >> i) & 1); c += (m >> i) & 1; }
        if (c !== 4) continue;
        res.push(estimate(T, S.map(function(s){ return s.y0; }), S.map(function(s){ return s.y1; })));
      }
      return res;
    }
    function sim(n, reps){
      var k = n / 8, y0 = [], y1 = [], res = [];
      for (var j = 0; j < k; j++) S.forEach(function(s){ y0.push(s.y0); y1.push(s.y1); });
      for (var r = 0; r < reps; r++) res.push(estimate(shuffleHalf(n), y0, y1));
      return res;
    }
    function render(){
      var est = N === 8 ? all8() : sim(N, 2000);
      var nb = Math.round((XMAX - XMIN) / BW), cnt = [];
      for (var b = 0; b < nb; b++) cnt.push(0);
      est.forEach(function(e){ var i = Math.floor((e - XMIN) / BW + 1e-9); if (i >= 0 && i < nb) cnt[i]++; });
      var mx = Math.max.apply(null, cnt);
      clear(svg);
      svg.setAttribute("style", "width:100%;height:auto;display:block;background:var(--ground);border-radius:10px;margin-top:6px");
      el("line", {x1: L, y1: B, x2: W - R, y2: B, stroke: "var(--rule)", "stroke-width": 1.5}, svg);
      for (var t = XMIN; t <= XMAX; t += 5){
        el("line", {x1: X(t), y1: B, x2: X(t), y2: B + 5, stroke: "var(--muted)"}, svg);
        txt(svg, X(t), B + 19, t < 0 ? "−" + (-t) : String(t), {"text-anchor": "middle"});
      }
      txt(svg, W - R, B + 34, "관측된 평균 차이(점)", {"text-anchor": "end", "font-size": 11});
      var bw = (W - L - R) / nb;
      cnt.forEach(function(c, i){
        if (!c) return;
        var h = c / mx * (B - TOP - 10);
        el("rect", {x: X(XMIN + i * BW) + 1, y: B - h, width: Math.max(bw - 2, 1), height: h, fill: "var(--orange)", opacity: 0.75, rx: 1.5}, svg);
      });
      function vline(v, color, label, anchor){
        el("line", {x1: X(v), y1: TOP - 8, x2: X(v), y2: B, stroke: color, "stroke-width": 2.5}, svg);
        txt(svg, X(v) + (anchor === "end" ? -5 : 5), TOP - 12, label, {fill: color, "font-weight": 700, "text-anchor": anchor || "start"});
      }
      vline(ATE, "var(--green)", "ATE 5", "end");
      vline(28.75, "var(--red)", "스스로 선택 28.75", "end");
      var m = mean(est), sd = Math.sqrt(mean(est.map(function(e){ return (e - m) * (e - m); })));
      var near = est.filter(function(e){ return Math.abs(e - ATE) <= 2.5; }).length / est.length;
      out.innerHTML =
        '<p>' + (N === 8 ? '가능한 배정 <span class="n">70</span>가지 전부' : '무작위 배정 <span class="n">2000</span>번') + '</p>' +
        '<p>추정값의 평균 <span class="n c-po">' + (N === 8 ? f2(m) : m.toFixed(2)) + '점</span></p>' +
        '<p>추정값의 표준편차 <span class="n">' + sd.toFixed(2) + '점</span></p>' +
        '<p>ATE ± 2.5점 안에 든 비율 <span class="n">' + Math.round(near * 100) + '%</span></p>';
      reBtn.hidden = N === 8;
    }
    segWire(document.querySelectorAll("#ra-n button"), function(b){ N = +b.getAttribute("data-n"); render(); });
    reBtn.addEventListener("click", render);
    render();
  })();

  /* ---------- 위젯 3: 이중차분법 ---------- */
  (function(){
    var svg = document.getElementById("dd-svg"); if (!svg) return;
    var ids = ["t", "g", "c", "d"], inp = {};
    ids.forEach(function(k){ inp[k] = document.getElementById("dd-" + k); });
    var out = document.getElementById("dd-out"), note = document.getElementById("dd-note");
    var W = 640, H = 340, L = 54, R = 150, TOP = 16, B = 300;
    var YMIN = 38, YMAX = 74;
    var X0 = L + 110, X1 = W - R - 40;
    function Y(v){ return B - (v - YMIN) / (YMAX - YMIN) * (B - TOP); }
    function dot(x, y, c){ el("circle", {cx: x, cy: y, r: 5.5, fill: c}, svg); }
    function lab(x, y, s, c){ txt(svg, x + 10, y + 4, s, {fill: c, "font-weight": 700, "font-size": 12.5}); }
    function render(){
      var tau = +inp.t.value, gap = +inp.g.value, com = +inp.c.value, dev = +inp.d.value;
      document.getElementById("dd-tv").textContent = sgn(tau) + "%p";
      document.getElementById("dd-gv").textContent = gap + "%p";
      document.getElementById("dd-cv").textContent = sgn(com) + "%p";
      document.getElementById("dd-dv").textContent = sgn(dev) + "%p";
      var C0 = 50, C1 = 50 + com, T0 = 50 + gap, CF = T0 + com + dev, T1 = CF + tau, DG = T0 + (C1 - C0);
      clear(svg);
      svg.setAttribute("style", "width:100%;height:auto;display:block;background:var(--ground);border-radius:10px;margin-top:6px");
      for (var v = 40; v <= 70; v += 5){
        el("line", {x1: L, y1: Y(v), x2: W - R + 20, y2: Y(v), stroke: "var(--rule)", "stroke-width": 1}, svg);
        txt(svg, L - 8, Y(v) + 4, v + "%", {"text-anchor": "end"});
      }
      txt(svg, X0, B + 24, "정책 전", {"text-anchor": "middle", fill: "var(--ink)", "font-size": 13});
      txt(svg, X1, B + 24, "정책 후", {"text-anchor": "middle", fill: "var(--ink)", "font-size": 13});
      /* DiD가 가정하는 경로(회색) */
      el("line", {x1: X0, y1: Y(T0), x2: X1, y2: Y(DG), stroke: "var(--muted)", "stroke-width": 2, "stroke-dasharray": "3 4"}, svg);
      /* 진짜 반사실(주황 점선) */
      el("line", {x1: X0, y1: Y(T0), x2: X1, y2: Y(CF), stroke: "var(--orange)", "stroke-width": 2, "stroke-dasharray": "7 5", opacity: 0.8}, svg);
      /* 실제 경로 */
      el("line", {x1: X0, y1: Y(C0), x2: X1, y2: Y(C1), stroke: "var(--blue)", "stroke-width": 3}, svg);
      el("line", {x1: X0, y1: Y(T0), x2: X1, y2: Y(T1), stroke: "var(--orange)", "stroke-width": 3}, svg);
      dot(X0, Y(C0), "var(--blue)"); dot(X1, Y(C1), "var(--blue)");
      dot(X0, Y(T0), "var(--orange)"); dot(X1, Y(T1), "var(--orange)");
      el("circle", {cx: X1, cy: Y(CF), r: 5, fill: "var(--ground)", stroke: "var(--orange)", "stroke-width": 2}, svg);
      if (dev !== 0) el("circle", {cx: X1, cy: Y(DG), r: 4.5, fill: "var(--ground)", stroke: "var(--muted)", "stroke-width": 2}, svg);
      /* 진짜 효과 화살표 */
      if (tau !== 0){
        var xa = X1 + 26, ya = Y(CF), yb = Y(T1), dir = yb < ya ? 1 : -1;
        if (Math.abs(yb - ya) > 9) el("line", {x1: xa, y1: ya, x2: xa, y2: yb + dir * 7, stroke: "var(--green)", "stroke-width": 2.5}, svg);
        el("polygon", {points: (xa - 5) + "," + (yb + dir * 8) + " " + (xa + 5) + "," + (yb + dir * 8) + " " + xa + "," + yb, fill: "var(--green)"}, svg);
        txt(svg, xa + 8, (ya + yb) / 2 + 4, "진짜 효과 " + sgn(tau), {fill: "var(--green)", "font-weight": 700, "font-size": 12.5});
      }
      lab(X0 - 92, Y(T0), "A " + T0, "var(--orange)");
      lab(X0 - 92, Y(C0), "B " + C0, "var(--blue)");
      var yT = Y(T1), yC = Y(C1);
      if (Math.abs(yT - yC) < 16){ if (T1 >= C1){ yT -= 8; yC += 8; } else { yT += 8; yC -= 8; } }
      lab(X1 + (tau !== 0 ? 120 : 4), yT, "A " + T1, "var(--orange)");
      lab(X1 + (tau !== 0 ? 120 : 4), yC, "B " + C1, "var(--blue)");
      var between = T1 - C1, ba = T1 - T0, did = (T1 - T0) - (C1 - C0);
      function row(name, formula, v){
        var ok = v === tau;
        return '<p>' + name + ' <span class="muted">' + formula + '</span> <span class="n">' + sgn(v) + '%p</span> ' +
          (ok ? '<span class="pill yes">맞음</span>' : '<span class="pill no">' + (v > tau ? '+' : '−') + Math.abs(v - tau) + '%p 빗나감</span>') + '</p>';
      }
      out.innerHTML =
        row("집단 간 비교", "(" + T1 + " − " + C1 + ")", between) +
        row("전후 비교", "(" + T1 + " − " + T0 + ")", ba) +
        row("이중차분법", "(" + T1 + " − " + T0 + ") − (" + C1 + " − " + C0 + ")", did) +
        '<p>진짜 효과 <span class="n c-po">' + sgn(tau) + '%p</span></p>';
      var msg = [];
      if (between !== tau) msg.push("집단 간 비교에는 원래 격차 " + gap + "%p" + (dev ? "와 추세 차이 " + sgn(dev) + "%p" : "") + "가 섞였어요.");
      if (ba !== tau) msg.push("전후 비교에는 시간 변화 " + sgn(com + dev) + "%p가 섞였어요.");
      if (did !== tau) msg.push("평행추세가 깨져서 이중차분법에도 추세 차이 " + sgn(dev) + "%p가 섞였어요. 회색 점선(가정한 경로)과 주황 점선(진짜 경로)이 벌어진 만큼이에요.");
      else msg.push("이중차분법은 회색 점선(B시와 같은 폭으로 변한다는 가정)이 진짜 반사실과 겹쳐서 맞았어요.");
      note.textContent = msg.join(" ");
    }
    ids.forEach(function(k){ inp[k].addEventListener("input", render); });
    render();
  })();
})();
