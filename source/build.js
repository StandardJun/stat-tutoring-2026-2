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
const katex = require('/home/claude/ws/node_modules/katex');
const KDIR = '/home/claude/ws/node_modules/katex/dist/';
const FDIR = '/home/claude/fonts/package/src/';
const conf = JSON.parse(fs.readFileSync('weeks.json', 'utf8'));
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
    execSync(`pyftsubset ${FDIR}${file}.ttf --text-file=.chars.txt --flavor=woff2 --layout-features='*' --no-hinting --output-file=${o}`);
    css += `@font-face{font-family:"NBG";font-weight:${w};font-style:normal;font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(o).toString('base64')}) format("woff2")}`;
    fs.unlinkSync(o);
  }
  fs.unlinkSync('.chars.txt');
  return css;
}
function weekBar(current){
  const items = conf.weeks.map(w => {
    const label = w.n + '회차';
    if (!w.ready) return `<span class="wk off" aria-disabled="true">${label}</span>`;
    if (w.n === current) return `<span class="wk on" aria-current="page">${label}</span>`;
    return `<a class="wk" href="${w.file}">${label}</a>`;
  }).join('');
  return `<nav class="weekbar" aria-label="회차">
  <a class="wk home" href="index.html">전체 목록</a>
  ${items}
</nav>`;
}
function page({ title, desc, style, body, script }){
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<style>${style}</style>
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
    title: `${w.title} · ${w.n}회차`,
    desc: `${conf.course} ${w.n}회차 (${w.date}) — ${w.summary}`,
    style, body, script: js
  }));
  console.log(w.file, (fs.statSync(path.join(out, w.file)).size / 1024).toFixed(0) + 'KB');
}

/* ---- 회차 목록(홈) ---- */
const cards = conf.weeks.map(w => {
  const inner = `<p class="card-no">${w.n}회차 <span class="card-date">${w.date}</span></p>
    <p class="card-title">${w.ready ? w.title : '준비 중'}</p>
    <p class="card-sum">${w.summary}</p>
    <p class="card-slides">${w.slides}</p>`;
  return w.ready ? `<a class="card" href="${w.file}">${inner}</a>` : `<div class="card off">${inner}</div>`;
}).join('\n');
const hubBody = `<header class="hero">
  <p class="eyebrow">${conf.term} · ${conf.course}</p>
  <h1>${conf.hubTitle}</h1>
  <p class="lede">${conf.hubLede}</p>
</header>
<div class="cards">
${cards}
</div>
<footer class="foot"><p>${conf.term} ${conf.course} · 회차가 끝날 때마다 하나씩 올라와요.</p></footer>`;
const hubStyle = fontFaces(hubBody, 'hub') + baseCss;
fs.writeFileSync(path.join(out, 'index.html'), page({
  title: conf.hubTitle, desc: `${conf.course} 회차별 학습 노트`, style: hubStyle, body: hubBody, script: ''
}));
console.log('index.html', (fs.statSync(path.join(out, 'index.html')).size / 1024).toFixed(0) + 'KB');
