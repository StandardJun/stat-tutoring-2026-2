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
  function npdf(x, m, s){ var z = (x - m) / s; return Math.exp(-0.5 * z * z) / (s * Math.sqrt(2 * Math.PI)); }
  function path(pts){ return pts.map(function(p, i){ return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(""); }
  function area(pts, base){
    if (!pts.length) return "";
    return path(pts) + "L" + pts[pts.length - 1][0].toFixed(1) + " " + base + "L" + pts[0][0].toFixed(1) + " " + base + "Z";
  }
  function logChoose(n, k){
    var s = 0;
    for (var i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
    return s;
  }
  /* θ^k (1-θ)^(n-k) × C(n,k) — 0^0 = 1 처리 */
  function binLik(t, n, k){
    var a = k > 0 ? k * Math.log(t) : 0, b = (n - k) > 0 ? (n - k) * Math.log(1 - t) : 0;
    return Math.exp(logChoose(n, k) + a + b);
  }
  /* 유효숫자 3자리, 아주 작으면 ×10^ 표기 */
  function fmt(v){
    if (v === 0) return "0";
    if (v >= 0.001) return String(Number(v.toPrecision(3)));
    var e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e);
    var sup = String(e).replace(/-/g, "⁻").replace(/\d/g, function(d){ return "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]; });
    return m.toFixed(2) + "×10" + sup;
  }
  function sup(x){ return String(x).replace(/\d/g, function(d){ return "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]; }); }
  function likStr(n, k){
    if (k === n) return "θ" + sup(n);
    if (k === 0) return "(1−θ)" + sup(n);
    return "C(" + n + "," + k + ")·θ" + sup(k) + "·(1−θ)" + sup(n - k);
  }
  function pct(v){ return v >= 0.9995 ? "100%" : v < 0.0005 ? "0%" : (v * 100).toFixed(1) + "%"; }
  function C(name){ return "var(--" + name + ")"; }
  /* k 슬라이더: n이 바뀌면 최댓값을 맞추고, 원래 k = n이었으면 계속 k = n으로 둔다 */
  function linkNK(nIn, kIn, onChange){
    var lastN = +nIn.value;
    nIn.addEventListener("input", function(){
      var n = +nIn.value, k = +kIn.value;
      kIn.max = n;
      if (k === lastN || k > n) kIn.value = Math.min(n, k === lastN ? n : k);
      lastN = n; onChange();
    });
    kIn.addEventListener("input", onChange);
  }

  /* ---------- 1. 동전 예시: prior, likelihood, 곱, posterior ---------- */
  (function(){
    var root = document.getElementById("cn-w");
    if (!root) return;
    var pIn = document.getElementById("cn-p"), nIn = document.getElementById("cn-n"), kIn = document.getElementById("cn-k");
    var rows = document.getElementById("cn-rows"), pills = document.getElementById("cn-pills"), note = document.getElementById("cn-note");
    var PRIORS = [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5];
    var TH = [0.5, 0.8], NAME = ["공정 θ=0.5", "조작 θ=0.8"];
    function group(title, cls, vals, scaleMax, show){
      var h = '<p class="bx-gh"><b class="' + cls.t + '">' + title[0] + '</b> ' + title[1] + '</p><div class="bars">';
      vals.forEach(function(v, i){
        var w = scaleMax > 0 ? Math.max(v / scaleMax * 100, v > 0 ? 0.6 : 0) : 0;
        h += '<div class="bar-row"><span>' + NAME[i] + '</span><div class="bar-track"><div class="bar-fill ' + cls.f + '" style="width:' + w.toFixed(2) + '%"></div></div><span class="bar-num">' + show(v) + '</span></div>';
      });
      return h + '</div>';
    }
    function render(){
      var p = PRIORS[+pIn.value], n = +nIn.value, k = +kIn.value;
      document.getElementById("cn-pv").textContent = (p * 100) + "%";
      document.getElementById("cn-nv").textContent = n + "번";
      document.getElementById("cn-kv").textContent = k + "번";
      var pr = [1 - p, p];
      var lk = TH.map(function(t){ return binLik(t, n, k); });
      var jt = [lk[0] * pr[0], lk[1] * pr[1]];
      var ev = jt[0] + jt[1];
      var po = [jt[0] / ev, jt[1] / ev];
      var mx = function(a){ return Math.max(a[0], a[1]); };
      rows.innerHTML =
        group(["prior", "P(θ)"], {t: "c-pr", f: "bf-pr"}, pr, mx(pr), fmt) +
        group(["likelihood", "P(D|θ) = " + likStr(n, k)], {t: "c-lk", f: "bf-lk"}, lk, mx(lk), fmt) +
        group(["likelihood × prior", "합 = P(D) = " + fmt(ev)], {t: "", f: "bf-jt"}, jt, mx(jt), fmt) +
        group(["posterior", "P(θ|D) = (likelihood × prior) ÷ P(D)"], {t: "c-po", f: "bf-po"}, po, 1, pct);
      function pick(a){ var r = a[1] / a[0]; return Math.abs(r - 1) < 1e-9 ? -1 : (r > 1 ? 1 : 0); }
      var mle = pick(lk), map = pick(po), lab = ["공정 동전", "조작 동전"];
      pills.innerHTML =
        '<span class="pill bx-mle">MLE → ' + (mle < 0 ? "동점" : lab[mle]) + '</span>' +
        '<span class="pill bx-map">MAP → ' + (map < 0 ? "동점" : lab[map]) + '</span>';
      var LR = lk[1] / lk[0], PR = pr[0] / pr[1];
      var s = LR >= 1 ? "likelihood로는 조작 동전이 " + fmtR(LR) + "배 더 잘 설명해요. "
                      : "likelihood로도 공정 동전이 " + fmtR(1 / LR) + "배 더 잘 설명해요. ";
      s += PR > 1.0000001 ? "그런데 prior로는 공정 동전이 " + fmtR(PR) + "배 흔해요. " : "prior는 두 동전이 똑같이 흔해요. ";
      s += "둘을 곱해 비교하면 조작일 posterior는 " + pct(po[1]) + "예요.";
      note.textContent = s;
    }
    function fmtR(r){ return r >= 100 ? Math.round(r).toLocaleString() : String(Number(r.toPrecision(3))); }
    pIn.addEventListener("input", render);
    linkNK(nIn, kIn, render);
    kIn.max = nIn.value;
    render();
  })();

  /* ---------- 2. 연속 θ: prior × likelihood → posterior ---------- */
  (function(){
    var svg = document.getElementById("bt-svg");
    if (!svg) return;
    svgBox(svg);
    var nIn = document.getElementById("bt-n"), kIn = document.getElementById("bt-k");
    var out = document.getElementById("bt-out"), note = document.getElementById("bt-note");
    var step = 1, A = 1, B = 1, M = 600;
    var xs = [];
    for (var i = 0; i <= M; i++) xs.push(i / M);
    function trap(ys){ var s = 0; for (var i = 1; i <= M; i++) s += (ys[i] + ys[i - 1]) / 2 / M; return s; }
    function render(){
      var n = +nIn.value, k = +kIn.value;
      document.getElementById("bt-nv").textContent = n + "번";
      document.getElementById("bt-kv").textContent = k + "번";
      var praw = xs.map(function(t){ return Math.pow(t, A - 1) * Math.pow(1 - t, B - 1); });
      var Z = trap(praw);
      var prior = praw.map(function(v){ return v / Z; });
      var lik = xs.map(function(t){ return binLik(t, n, k); });
      var joint = xs.map(function(t, i){ return lik[i] * prior[i]; });
      var ev = trap(joint);
      var post = joint.map(function(v){ return v / ev; });
      var main = step === 1 ? joint : post;
      var top = Math.max.apply(null, main) * 1.18;
      var mle = k / n, map = (k + A - 1) / (n + A + B - 2);

      clear(svg);
      var L = 62, R = 540, T = 22, Bt = 242;
      function X(t){ return L + t * (R - L); }
      function Y(v){ return Bt - Math.min(v / top, 1.05) * (Bt - T); }
      /* 세로축 눈금: 0, 중간, 위 */
      [0, 0.5, 1].forEach(function(f){
        var v = top / 1.18 * f, y = Y(v);
        el("line", {x1: L, x2: R, y1: y, y2: y, "class": "grid-l"}, svg);
        txt(svg, L - 6, y + 4, "svg-t bx-tick", fmt(v));
      });
      el("line", {x1: L, x2: R, y1: Bt, y2: Bt, "class": "ax"}, svg);
      [0, 0.25, 0.5, 0.75, 1].forEach(function(t){ txt(svg, X(t), Bt + 17, "svg-t", String(t)); });
      txt(svg, R, Bt + 34, "svg-t", "θ", "text-anchor:end;font-style:italic");
      /* 모양만 보여 주는 prior, likelihood */
      function shape(arr, cls){
        var m = Math.max.apply(null, arr); if (!(m > 0)) return;
        var h = top / 1.18 * 0.82;
        el("path", {d: path(xs.map(function(t, i){ return [X(t), Y(arr[i] / m * h)]; })), "class": cls}, svg);
      }
      shape(prior, "bx-prior");
      shape(lik, "bx-lik");
      var pts = xs.map(function(t, i){ return [X(t), Y(main[i])]; });
      el("path", {d: area(pts, Bt), "class": "bx-area"}, svg);
      el("path", {d: path(pts), "class": "bx-post"}, svg);
      el("line", {x1: X(mle), x2: X(mle), y1: T, y2: Bt, "class": "bx-v lk"}, svg);
      el("line", {x1: X(map), x2: X(map), y1: T, y2: Bt, "class": "bx-v po"}, svg);
      var close = Math.abs(mle - map) < 0.09;
      var lx = function(t){ return Math.min(Math.max(X(t), L + 30), R - 30); };
      txt(svg, lx(mle), T - 6, "bx-lab lk", "MLE");
      txt(svg, lx(map), close ? T + 10 : T - 6, "bx-lab po", "MAP");
      txt(svg, L + 6, Bt - 8, "bx-cap", step === 1 ? "넓이 = P(D) = " + fmt(ev) : "넓이 = 1", "text-anchor:start");

      out.innerHTML =
        '<p><span class="c-lk"><b>MLE</b></span> = ' + k + '/' + n + ' = <span class="n">' + mle.toFixed(3) + '</span></p>' +
        '<p><span class="c-po"><b>MAP</b></span> = <span class="n">' + map.toFixed(3) + '</span></p>' +
        '<p>P(D) = <span class="n">' + fmt(ev) + '</span> <span class="muted">(초록 곡선 아래 넓이, ①에서)</span></p>' +
        '<p>점선: <span class="c-pr">prior</span>, 실선: <span class="c-lk">likelihood</span> <span class="muted">(둘은 모양만 보이게 높이를 맞췄어요)</span></p>';
      note.textContent = step === 1
        ? "지금 초록 곡선은 likelihood × prior예요. 아직 넓이가 1이 아니라 P(D)예요. ②를 눌러 보세요."
        : "지금 초록 곡선은 posterior = (likelihood × prior) ÷ P(D)예요. 모양과 꼭대기 위치는 ①과 같고, 세로축 숫자만 1/P(D)배가 됐어요.";
    }
    segWire(document.querySelectorAll("#bt-step button"), function(b){ step = +b.getAttribute("data-s"); render(); });
    segWire(document.querySelectorAll("#bt-prior button"), function(b){ A = +b.getAttribute("data-a"); B = +b.getAttribute("data-b"); render(); });
    linkNK(nIn, kIn, render);
    kIn.max = nIn.value;
    render();
  })();

  /* ---------- 3. 정규분포: 수율 예시 ---------- */
  (function(){
    var svg = document.getElementById("nm-svg");
    if (!svg) return;
    svgBox(svg);
    var nIn = document.getElementById("nm-n"), xIn = document.getElementById("nm-x"), tIn = document.getElementById("nm-t");
    var out = document.getElementById("nm-out");
    var MU0 = 65, SIG = 5, LO = 45, HI = 95;
    function render(){
      var N = +nIn.value, xb = +xIn.value, tau = +tIn.value;
      document.getElementById("nm-nv").textContent = N + "번";
      document.getElementById("nm-xv").textContent = xb.toFixed(1) + "%";
      document.getElementById("nm-tv").textContent = tau.toFixed(1);
      var se = SIG / Math.sqrt(N), prec = N / (SIG * SIG) + 1 / (tau * tau);
      var mp = (N * xb / (SIG * SIG) + MU0 / (tau * tau)) / prec, sp = 1 / Math.sqrt(prec);
      var m = SIG * SIG / (tau * tau);
      var top = Math.max(npdf(0, 0, se), npdf(0, 0, tau), npdf(0, 0, sp)) * 1.12;
      clear(svg);
      var L = 20, R = 540, T = 26, Bt = 214;
      function X(v){ return L + (v - LO) / (HI - LO) * (R - L); }
      function Y(d){ return Bt - d / top * (Bt - T); }
      el("line", {x1: L, x2: R, y1: Bt, y2: Bt, "class": "ax"}, svg);
      for (var v = 50; v <= 90; v += 10) txt(svg, X(v), Bt + 18, "svg-t", v + "%");
      function curve(m0, s0, cls, fill){
        var pts = [];
        for (var i = 0; i <= 400; i++){ var x = LO + (HI - LO) * i / 400; pts.push([X(x), Y(npdf(x, m0, s0))]); }
        if (fill) el("path", {d: area(pts, Bt), "class": "bx-area"}, svg);
        el("path", {d: path(pts), "class": cls}, svg);
      }
      curve(MU0, tau, "bx-prior");
      curve(xb, se, "bx-lik");
      curve(mp, sp, "bx-post", true);
      el("line", {x1: X(xb), x2: X(xb), y1: T, y2: Bt, "class": "bx-v lk"}, svg);
      el("line", {x1: X(mp), x2: X(mp), y1: T, y2: Bt, "class": "bx-v po"}, svg);
      var close = Math.abs(X(xb) - X(mp)) < 44;
      txt(svg, X(xb), T - 8, "bx-lab lk", "MLE");
      txt(svg, X(mp), close ? T + 8 : T - 8, "bx-lab po", "MAP");
      txt(svg, X(MU0), Bt - 6, "bx-lab pr", "μ₀");
      out.innerHTML =
        '<p><span class="c-lk"><b>MLE</b></span> = x̄ = <span class="n">' + xb.toFixed(1) + '%</span></p>' +
        '<p><span class="c-po"><b>MAP</b></span> = <span class="n">' + mp.toFixed(2) + '%</span></p>' +
        '<p>prior = 가상의 측정값 m = σ²/τ² = <span class="n">' + Number(m.toPrecision(3)) + '개</span></p>' +
        '<p>MAP에서 prior의 무게 m/(N+m) = <span class="n">' + pct(m / (N + m)) + '</span></p>' +
        '<p class="w-full">점선: <span class="c-pr">prior</span> · 실선: <span class="c-lk">likelihood</span>(폭 σ/√N = ' + se.toFixed(2) + ') · 칠한 곡선: <span class="c-po">posterior</span></p>';
    }
    [nIn, xIn, tIn].forEach(function(e){ e.addEventListener("input", render); });
    render();
  })();

  /* ---------- 4. 측정값 두 개 합치기 ---------- */
  (function(){
    var svg = document.getElementById("fu-svg");
    if (!svg) return;
    svgBox(svg);
    var ids = ["xa", "sa", "xb", "sb"], inp = {};
    ids.forEach(function(id){ inp[id] = document.getElementById("fu-" + id); });
    var out = document.getElementById("fu-out"), LO = 23, HI = 27;
    function render(){
      var xa = +inp.xa.value, sa = +inp.sa.value, xb = +inp.xb.value, sb = +inp.sb.value;
      document.getElementById("fu-xav").textContent = xa.toFixed(2) + "℃";
      document.getElementById("fu-sav").textContent = sa.toFixed(2);
      document.getElementById("fu-xbv").textContent = xb.toFixed(2) + "℃";
      document.getElementById("fu-sbv").textContent = sb.toFixed(2);
      var wa = 1 / (sa * sa), wb = 1 / (sb * sb), xc = (wa * xa + wb * xb) / (wa + wb), sc = 1 / Math.sqrt(wa + wb);
      var top = npdf(0, 0, sc) * 1.12;
      clear(svg);
      var L = 20, R = 540, T = 26, Bt = 196;
      function X(v){ return L + (v - LO) / (HI - LO) * (R - L); }
      function Y(d){ return Bt - d / top * (Bt - T); }
      el("line", {x1: L, x2: R, y1: Bt, y2: Bt, "class": "ax"}, svg);
      for (var v = 23; v <= 27; v += 0.5) txt(svg, X(v), Bt + 18, "svg-t", v.toFixed(1));
      function curve(m0, s0, cls, fill){
        var pts = [];
        for (var i = 0; i <= 500; i++){ var x = LO + (HI - LO) * i / 500; pts.push([X(x), Y(npdf(x, m0, s0))]); }
        if (fill) el("path", {d: area(pts, Bt), "class": "bx-area"}, svg);
        el("path", {d: path(pts), "class": cls}, svg);
      }
      curve(xa, sa, "bx-fa");
      curve(xb, sb, "bx-fb");
      curve(xc, sc, "bx-post", true);
      el("line", {x1: X(xc), x2: X(xc), y1: T, y2: Bt, "class": "bx-v po"}, svg);
      txt(svg, X(xc), T - 8, "bx-lab po", "합친 값");
      var single = Math.min(sa, sb);
      out.innerHTML =
        '<p>그냥 평균 = <span class="n">' + ((xa + xb) / 2).toFixed(3) + '℃</span></p>' +
        '<p><span class="c-po"><b>역분산 가중평균</b></span> = <span class="n">' + xc.toFixed(3) + '℃</span></p>' +
        '<p>가중치 A : B = <span class="n">' + pct(wa / (wa + wb)) + ' : ' + pct(wb / (wa + wb)) + '</span></p>' +
        '<p>합친 σ = <span class="n">' + sc.toFixed(3) + '</span> <span class="muted">(더 정밀한 하나만 쓰면 ' + single.toFixed(2) + ')</span></p>';
    }
    ids.forEach(function(id){ inp[id].addEventListener("input", render); });
    render();
  })();
})();
