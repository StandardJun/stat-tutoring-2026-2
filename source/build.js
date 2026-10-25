/* 기초통계학 피어튜터링 학습 노트 — 사이트 빌드
 * 사용법: node build.js
 *  - weeks.json       회차 목록(제목·요약·파일명·공개 여부)
 *  - weeks/wN.html    회차 본문 조각 (KaTeX는 \( \), \[ \]로 작성)
 *  - weeks/wN.js      (선택) 그 회차에서 쓰는 위젯 스크립트
 *  - img/*.png        본문에서 {{IMG:파일명}}으로 참조
 *  - base.css         공통 스타일
 * 결과: out/index.html (회차 목록) + out/weekN.html (회차별 자료)
 *       각 파일은 이미지·폰트·수식까지 모두 품은 단독 파일
 */
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const katex = require('katex');
const KDIR = path.dirname(require.resolve('katex/package.json')) + '/dist/';
const FDIR = path.dirname(require.resolve('@kfonts/nanum-barun-gothic/package.json')) + '/src/';
const conf = JSON.parse(fs.readFileSync('weeks.json', 'utf8'));
// 보충 페이지(시험 범위 밖 읽을거리) — weeks.json과 분리해 둔다
const extras = fs.existsSync('extras.json') ? JSON.parse(fs.readFileSync('extras.json', 'utf8')) : [];
const baseCss = fs.readFileSync('base.css', 'utf8');
const out = 'out';
fs.mkdirSync(out, { recursive: true });

const kopts = { strict: 'ignore', trust: c => c.command === '\\htmlClass', throwOnError: true };
function math(s){
  return s.replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => katex.renderToString(t, { ...kopts, displayMode: true }))
          .replace(/\\\(([\s\S]+?)\\\)/g, (_, t) => katex.renderToString(t, { ...kopts, displayMode: false }));
}
function images(s){
  return s.replace(/\{\{IMG:([\w.-]+)\}\}/g, (_, n) => {
    const f = fs.existsSync(path.join('img', n)) ? path.join('img', n) : path.join('img', n + '.png');
    return 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
  });
}
let katexCss = null;
function getKatexCss(){
  if (katexCss) return katexCss;
  katexCss = fs.readFileSync(KDIR + 'katex.min.css', 'utf8').replace(
    /src:url\(fonts\/([\w-]+)\.woff2\) format\("woff2"\)(,url\([^)]+\) format\("[^"]+"\))*/g,
    (_, f) => 'src:url(data:font/woff2;base64,' + fs.readFileSync(KDIR + 'fonts/' + f + '.woff2').toString('base64') + ') format("woff2")');
  return katexCss;
}
/* 페이지에 실제로 쓰인 글자만 담은 나눔바른고딕 서브셋 */
function fontFaces(text, tag){
  const chars = new Set([...text].filter(c => c.charCodeAt(0) >= 32));
  for (let i = 32; i < 127; i++) chars.add(String.fromCharCode(i));
  fs.writeFileSync('.chars.txt', [...chars].join(''));
  let css = '';
  for (const [file, w] of [['NanumBarunGothic', 400], ['NanumBarunGothicBold', 700]]){
    const o = `.${tag}-${w}.woff2`;
    execSync(`pyftsubset "${FDIR}${file}.ttf" --text-file=.chars.txt --flavor=woff2 --layout-features='*' --no-hinting --output-file="${o}"`);
    css += `@font-face{font-family:"NBG";font-weight:${w};font-style:normal;font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(o).toString('base64')}) format("woff2")}`;
    fs.unlinkSync(o);
  }
  fs.unlinkSync('.chars.txt');
  return css;
}
function weekBar(current){
  const items = conf.weeks.map(w => {
    const label = w.label || w.n + '회차';
    if (!w.ready) return `<span class="wk off" aria-disabled="true">${label}</span>`;
    if (w.n === current) return `<span class="wk on" aria-current="page">${label}</span>`;
    return `<a class="wk" href="${w.file}">${label}</a>`;
  }).join('') + extras.map(x => x.id === current
    ? `<span class="wk extra on" aria-current="page">${x.menu}</span>`
    : `<a class="wk extra" href="${x.file}">${x.menu}</a>`).join('');
  return `<nav class="weekbar" aria-label="회차">
  <a class="wk home" href="index.html">전체 목록</a>
  ${items}
</nav>`;
}
function page({ title, desc, style, body, script, robots }){
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
${robots ? `<meta name="robots" content="${robots}">\n` : ''}<style>${style}</style>
</head>
<body>
<div class="wrap">
${body}
</div>
${script ? '<script>' + script + '</script>' : ''}
</body>
</html>
`;
}

/* ---- 회차별 페이지 ---- */
for (const w of conf.weeks){
  if (!w.ready) continue;
  const frag = math(images(fs.readFileSync(`weeks/w${w.n}.html`, 'utf8')));
  const jsPath = `weeks/w${w.n}.js`;
  const js = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : '';
  const hero = `<header class="hero">
  <p class="eyebrow">${w.eyebrow}</p>
  <h1>${w.title}</h1>
  ${w.lede ? `<p class="lede">${w.lede}</p>` : ''}
</header>`;
  const foot = `<footer class="foot"><p>${w.foot || `${conf.term} ${conf.course} · ${w.n}주차 자료`}</p></footer>`;
  const body = weekBar(w.n) + '\n' + hero + '\n' + frag + '\n' + foot;
  const style = fontFaces(body + js, 'w' + w.n) + getKatexCss() + baseCss;
  fs.writeFileSync(path.join(out, w.file), page({
    title: `${w.title} · ${w.label || w.n + '회차'}`,
    desc: `${conf.course} ${w.n}회차 (${w.date}) — ${w.summary}`,
    style, body, script: js
  }));
  console.log(w.file, (fs.statSync(path.join(out, w.file)).size / 1024).toFixed(0) + 'KB');
}

/* ---- 보충 페이지 ---- */
for (const x of extras){
  const frag = math(images(fs.readFileSync(x.frag, 'utf8')));
  const js = x.js && fs.existsSync(x.js) ? fs.readFileSync(x.js, 'utf8') : '';
  const hero = `<header class="hero">
  <p class="eyebrow">${x.eyebrow}</p>
  <h1>${x.title}</h1>
  ${x.lede ? `<p class="lede">${x.lede}</p>` : ''}
</header>`;
  const body = weekBar(x.id) + '\n' + hero + '\n' + frag + '\n' + `<footer class="foot"><p>${x.foot}</p></footer>`;
  fs.writeFileSync(path.join(out, x.file), page({
    title: `${x.title} · ${x.kicker}`, desc: `${conf.course} ${x.kicker} — ${x.summary}`,
    style: fontFaces(body + js, 'x-' + x.id) + getKatexCss() + baseCss, body, script: js
  }));
  console.log(x.file, (fs.statSync(path.join(out, x.file)).size / 1024).toFixed(0) + 'KB');
}

/* ---- 회차 목록(홈) ---- */
const cards = conf.weeks.map(w => {
  const inner = `<p class="card-no">${w.label || w.n + '회차'} <span class="card-date">${w.date}</span></p>
    <p class="card-title">${w.ready ? w.title : '준비 중'}</p>
    <p class="card-sum">${w.summary}</p>
    <p class="card-slides">${w.slides}</p>`;
  return w.ready ? `<a class="card${w.kind ? ' ' + w.kind : ''}" href="${w.file}">${inner}</a>` : `<div class="card off">${inner}</div>`;
}).join('\n');
const ready = {};
conf.weeks.forEach(function(w){ if (w.ready) ready[w.n] = w; });
const planRows = (conf.plan || []).map(r => {
  if (r.exam) return `<tr class="exam"><th scope="row">${r.exam}</th><td class="pd">${r.date}</td><td></td></tr>`;
  // week: 연결할 회차 페이지 번호 (기본은 n, null이면 연결 안 함) · link: 직접 지정한 주소
  // label: '5회차' 대신 쓸 이름 · kind: 행에 붙일 클래스(skip 등) · done: 페이지 없이 수업 완료 표시
  const w = ready['week' in r ? r.week : r.n];
  const href = r.link || (w && w.file);
  const text = r.label || `${r.n}회차`;
  const label = href ? `<a href="${href}">${text}</a>` : text;
  const cls = [(w || r.done) && 'done', r.kind].filter(Boolean).join(' ');
  return `<tr${cls ? ` class="${cls}"` : ''}><th scope="row">${label}</th><td class="pd">${r.date}</td><td>${r.topic}</td></tr>`;
}).join('\n');
const planBlock = (conf.plan || []).length ? `<section class="plan">
  <div class="sec-head"><h2>${conf.planTitle}</h2></div>
  <div class="table-scroll"><table class="sched">
  <thead><tr><th scope="col">회차</th><th scope="col">날짜</th><th scope="col">다룰 내용</th></tr></thead>
  <tbody>
${planRows}
  </tbody></table></div>
  <p class="plan-note">${conf.planNote || ''}</p>
</section>` : '';

/* ---- 자료실 설정 (library.json — weeks.json과 분리해 둔다) ---- */
const lib = fs.existsSync('library.json') ? JSON.parse(fs.readFileSync('library.json', 'utf8')) : null;
function kb(f){ const b = fs.statSync(f).size; return b >= 1048576 ? (b / 1048576).toFixed(1) + 'MB' : Math.round(b / 1024) + 'KB'; }
const libCard = lib ? `<a class="card lib-card" href="library.html">
  <p class="card-no">${lib.title}</p>
  <p class="card-title">${lib.sections.map(x => x.title).join(' · ')}</p>
  <p class="card-sum">PDF로 바로 내려받을 수 있어요.</p>
</a>` : '';

const hubBody = `<header class="hero">
  <p class="eyebrow">${conf.term} · ${conf.course}</p>
  <h1>${conf.hubTitle}</h1>
  <p class="lede">${conf.hubLede}</p>
</header>
${libCard ? `<div class="cards lib-top">\n${libCard}\n</div>` : ''}
${extras.length ? `<div class="cards extra-top">\n${extras.map(x => `<a class="card extra-card" href="${x.file}">
  <p class="card-no">${x.kicker}</p>
  <p class="card-title">${x.title}</p>
  <p class="card-sum">${x.summary}</p>
  ${x.note ? `<p class="card-slides">${x.note}</p>` : ''}
</a>`).join('\n')}\n</div>` : ''}
<div class="cards">
${cards}
</div>
${planBlock}
<footer class="foot"><p>${conf.term} ${conf.course} · 회차가 끝날 때마다 하나씩 올라와요.</p></footer>`;
const hubStyle = fontFaces(hubBody, 'hub') + baseCss;
fs.writeFileSync(path.join(out, 'index.html'), page({
  title: conf.hubTitle, desc: `${conf.course} 회차별 학습 노트`, style: hubStyle, body: hubBody, script: ''
}));
console.log('index.html', (fs.statSync(path.join(out, 'index.html')).size / 1024).toFixed(0) + 'KB');

/* ---- 자료실 페이지 ---- */
if (lib){
  const btn = f => `<div class="dl-wrap"><a class="dl" href="${f.path}" download="${f.save}" rel="nofollow">${f.label}<span class="dl-meta">${f.pages}쪽 · ${kb(f.path)}</span></a>${f.updated ? `<span class="dl-upd">${f.updated}</span>` : ''}</div>`;
  const item = it => `<li class="lib-item">
      <div class="lib-text"><p class="lib-name">${it.name}</p>${it.meta ? `<p class="lib-meta">${it.meta}</p>` : ''}</div>
      <div class="lib-btns">${it.files.map(btn).join('')}</div>
    </li>`;
  const group = g => `${g.title ? `<h3 class="lib-group">${g.title}</h3>` : ''}${g.note ? `<p class="lib-note">${g.note}</p>` : ''}
  <ul class="lib-list">
    ${g.items.map(item).join('\n    ')}
  </ul>`;
  const sections = lib.sections.map(sec => `<section id="${sec.id}">
  <div class="sec-head"><h2>${sec.title}</h2></div>
  ${sec.note ? `<p>${sec.note}</p>` : ''}
  ${sec.groups.map(group).join('\n  ')}
  ${sec.figure ? `<figure class="lib-fig"><a href="${sec.figure.src}" target="_blank" rel="nofollow"><img src="${sec.figure.src}" alt="${sec.figure.alt}" loading="lazy"></a><figcaption>${sec.figure.caption}</figcaption></figure>` : ''}
</section>`).join('\n');
  const libBody = `${weekBar(0)}
<header class="hero">
  <p class="eyebrow">${conf.term} · ${conf.course}</p>
  <h1>${lib.title}</h1>
  <p class="lede">${lib.lede}</p>
</header>
${lib.notice ? `<p class="caution"><span class="caution-label">부탁</span>${lib.notice}</p>` : ''}
${sections}
<footer class="foot"><p>${conf.term} ${conf.course} · 자료실</p></footer>`;
  fs.writeFileSync(path.join(out, 'library.html'), page({
    title: `${lib.title} · ${conf.hubTitle}`, desc: `${conf.course} 자료실`,
    style: fontFaces(libBody, 'lib') + baseCss, body: libBody, script: '', robots: 'noindex, nofollow'
  }));
  console.log('library.html', (fs.statSync(path.join(out, 'library.html')).size / 1024).toFixed(0) + 'KB');
  fs.cpSync('files', path.join(out, 'files'), { recursive: true });
  console.log('files/ 복사', lib.sections.flatMap(x => x.groups.flatMap(g => g.items.flatMap(i => i.files))).length + '개');
}
