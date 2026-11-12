(function(){
  "use strict";
  function pill(ok, yes, no){ return "<span class=\"pill " + (ok ? "yes\">" + yes : "no\">" + no) + "</span>"; }
  function f2(v){ return (Math.round(v * 100) / 100).toFixed(2); }
  function f1(v){ return (Math.round(v * 10) / 10).toFixed(1); }

  /* ---------- 1. 자유도: 2×3 표에서 두 칸을 정하면 나머지는 저절로 ---------- */
  (function(){
    var tab = document.getElementById("df9-tab");
    if (!tab) return;
    var out = document.getElementById("df9-out"), note = document.getElementById("df9-note");
    var sa = document.getElementById("df9-a"), sb = document.getElementById("df9-b");
    var va = document.getElementById("df9-a-v"), vb = document.getElementById("df9-b-v");
    var R = [100, 100], Cc = [60, 50, 90];
    function cell(v, free, bad){
      var st = free ? "color:var(--blue);font-weight:700;background:var(--blue-tint)" : (bad ? "color:var(--red);font-weight:700" : "color:var(--muted)");
      return "<td style=\"" + st + "\">" + v + "</td>";
    }
    function render(){
      var a = parseInt(sa.value, 10), b = parseInt(sb.value, 10);
      va.textContent = a; vb.textContent = b;
      var c = R[0] - a - b;                 /* 1행 범주 3: 행 합에서 결정 */
      var d = Cc[0] - a, e = Cc[1] - b, f = Cc[2] - c;  /* 2행: 열 합에서 결정 */
      var bad = [c, d, e, f].some(function(v){ return v < 0; });
      tab.innerHTML =
        "<thead><tr><th></th><th>범주 1</th><th>범주 2</th><th>범주 3</th><th>합</th></tr></thead><tbody>" +
        "<tr><th scope=\"row\">모집단 1</th>" + cell(a, true) + cell(b, true) + cell(c, false, c < 0) + "<td><b>100</b></td></tr>" +
        "<tr><th scope=\"row\">모집단 2</th>" + cell(d, false, d < 0) + cell(e, false, e < 0) + cell(f, false, f < 0) + "<td><b>100</b></td></tr>" +
        "<tr><th scope=\"row\">합</th><td><b>60</b></td><td><b>50</b></td><td><b>90</b></td><td><b>200</b></td></tr></tbody>";
      out.innerHTML =
        "<p>직접 정한 칸: <span class=\"n\">2개</span> <span class=\"muted\">(파랑)</span> · 저절로 정해진 칸: <span class=\"n\">4개</span> <span class=\"muted\">(회색)</span></p>" +
        "<p>자유도 = (2 − 1) × (3 − 1) = <span class=\"n\">2</span></p>";
      note.textContent = bad
        ? "합을 맞추다 보니 음수가 나온 칸(빨강)이 생겼어요. 개수는 음수일 수 없으니 이 조합은 불가능해요. 그래도 두 칸만 정하면 나머지가 모두 계산된다는 건 똑같아요."
        : "1행의 세 번째 칸은 행 합 100에서, 2행의 세 칸은 각 열 합에서 저절로 정해져요. 행 쪽에서 1개, 열 쪽에서 1개씩 빠져서 자유롭게 정할 수 있는 칸은 (2 − 1)(3 − 1) = 2개예요.";
    }
    sa.addEventListener("input", render); sb.addEventListener("input", render);
    render();
  })();

  /* ---------- 2. 2×2 표: χ²와 Z²는 항상 같다 ---------- */
  (function(){
    var tab = document.getElementById("zz9-tab");
    if (!tab) return;
    var out = document.getElementById("zz9-out"), note = document.getElementById("zz9-note");
    var sa = document.getElementById("zz9-a"), sb = document.getElementById("zz9-b");
    var va = document.getElementById("zz9-a-v"), vb = document.getElementById("zz9-b-v");
    var n1 = 300, n2 = 300, n = n1 + n2;
    function render(){
      var a = parseInt(sa.value, 10), b = parseInt(sb.value, 10);
      va.textContent = a; vb.textContent = b;
      var O = [[a, n1 - a], [b, n2 - b]];
      var col = [a + b, n - a - b], row = [n1, n2];
      var chi = 0, E = [[0, 0], [0, 0]];
      for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++){
        E[i][j] = row[i] * col[j] / n;
        chi += Math.pow(O[i][j] - E[i][j], 2) / E[i][j];
      }
      var p1 = a / n1, p2 = b / n2, ph = col[0] / n;
      var se = Math.sqrt(ph * (1 - ph) * (1 / n1 + 1 / n2));
      var z = se > 0 ? (p1 - p2) / se : 0;
      function td(i, j){ return "<td>" + O[i][j] + " <span style=\"color:var(--muted)\">(" + f1(E[i][j]) + ")</span></td>"; }
      tab.innerHTML =
        "<thead><tr><th></th><th>가입</th><th>미가입</th><th>합</th></tr></thead><tbody>" +
        "<tr><th scope=\"row\">남</th>" + td(0, 0) + td(0, 1) + "<td>300</td></tr>" +
        "<tr><th scope=\"row\">여</th>" + td(1, 0) + td(1, 1) + "<td>300</td></tr>" +
        "<tr><th scope=\"row\">합</th><td>" + col[0] + "</td><td>" + col[1] + "</td><td>600</td></tr></tbody>";
      var rej = chi >= 3.841;
      out.innerHTML =
        "<p>카이제곱 값 = <span class=\"n\">" + f2(chi) + "</span> " + pill(rej, "기각", "기각 못 함") + " <span class=\"muted\">(기준 3.841)</span></p>" +
        "<p>합동비율 = " + f2(ph) + ", Z = <span class=\"n\">" + f2(z) + "</span> <span class=\"muted\">(양측 기준 ±1.96)</span></p>" +
        "<p>Z² = <span class=\"n\">" + f2(z * z) + "</span> <span class=\"muted\">(카이제곱 값과 같음)</span></p>" +
        "<p>네 칸의 |O − E| = <span class=\"n\">" + f1(Math.abs(O[0][0] - E[0][0])) + "</span> <span class=\"muted\">(모두 같음)</span></p>";
      var msg;
      if (a === b) msg = "두 집단의 가입 인원이 같으면 관측도수와 기대도수가 똑같아서 카이제곱 값도 Z도 0이에요.";
      else msg = "가입 인원을 어떻게 바꿔도 카이제곱 값과 Z²가 같아요. 다만 Z는 " + (z > 0 ? "양수(남 쪽이 큼)" : "음수(여 쪽이 큼)") + "로 방향이 남아 있고, 카이제곱은 제곱이라 방향이 사라져요. 그래서 카이제곱으로는 양측검정만 할 수 있어요.";
      note.textContent = msg;
    }
    sa.addEventListener("input", render); sb.addEventListener("input", render);
    render();
  })();
})();
