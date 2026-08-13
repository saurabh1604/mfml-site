/* MFML site build: pre-render KaTeX server-side, inline fonts → fully offline pages. */
const fs = require('fs'), path = require('path');
const katex = require('katex');
const ROOT = __dirname, SRC = path.join(ROOT, 'src'), OUT = path.join(ROOT, 'site');
const KDIST = path.join(ROOT, 'node_modules/katex/dist');

/* ---- font subset → data-URI @font-face css ---- */
const FACES = [
  ['KaTeX_Main', 'KaTeX_Main-Regular', 400, 'normal'],
  ['KaTeX_Main', 'KaTeX_Main-Bold', 700, 'normal'],
  ['KaTeX_Main', 'KaTeX_Main-Italic', 400, 'italic'],
  ['KaTeX_Main', 'KaTeX_Main-BoldItalic', 700, 'italic'],
  ['KaTeX_Math', 'KaTeX_Math-Italic', 400, 'italic'],
  ['KaTeX_Math', 'KaTeX_Math-BoldItalic', 700, 'italic'],
  ['KaTeX_AMS', 'KaTeX_AMS-Regular', 400, 'normal'],
  ['KaTeX_Caligraphic', 'KaTeX_Caligraphic-Regular', 400, 'normal'],
  ['KaTeX_Size1', 'KaTeX_Size1-Regular', 400, 'normal'],
  ['KaTeX_Size2', 'KaTeX_Size2-Regular', 400, 'normal'],
  ['KaTeX_Size3', 'KaTeX_Size3-Regular', 400, 'normal'],
  ['KaTeX_Size4', 'KaTeX_Size4-Regular', 400, 'normal'],
];
function fontCss() {
  return FACES.map(([fam, file, w, style]) => {
    const b64 = fs.readFileSync(path.join(KDIST, 'fonts', file + '.woff2')).toString('base64');
    return `@font-face{font-family:'${fam}';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:${w};font-style:${style}}`;
  }).join('\n');
}
function katexCss() {
  return fs.readFileSync(path.join(KDIST, 'katex.min.css'), 'utf8').replace(/@font-face\{[^}]*\}/g, '');
}

/* ---- math replacement (outside <script> only) ---- */
const unesc = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
let nDisp = 0, nInline = 0, errs = [];
function render(tex, display) {
  try {
    if (display) nDisp++; else nInline++;
    return katex.renderToString(unesc(tex), { displayMode: display, throwOnError: true, strict: false });
  } catch (e) { errs.push((display ? 'DISPLAY: ' : 'INLINE: ') + tex.slice(0, 60) + ' → ' + String(e.message).slice(0, 120)); return tex; }
}
function transform(html) {
  const cut = html.indexOf('<script>');
  let head = cut === -1 ? html : html.slice(0, cut);
  const tail = cut === -1 ? '' : html.slice(cut);
  head = head.split('\n').filter(l => !l.includes('cdnjs.cloudflare.com/ajax/libs/KaTeX')).join('\n');
  head = head.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => render(tex, true));
  head = head.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => render(tex, false));
  const style = '<style id="katex-inline">' + katexCss() + '\n' + fontCss() + '</style>';
  head = head.replace('</title>', '</title>\n' + style);
  return head + tail;
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(SRC).filter(f => f.endsWith('.html'))) {
  const src = fs.readFileSync(path.join(SRC, f), 'utf8');
  nDisp = 0; nInline = 0;
  const out = src.includes('\\(') || src.includes('\\[') ? transform(src) : src;
  fs.writeFileSync(path.join(OUT, f), out);
  console.log(`${f}: display=${nDisp} inline=${nInline} bytes=${out.length}`);
}
if (errs.length) { console.log('\nKATEX ERRORS:'); errs.forEach(e => console.log(' ', e)); process.exit(1); }
console.log('build ok');
