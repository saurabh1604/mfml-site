/* Build a throwaway test page for one cinema fragment: node mk-cin-test.js a|b|c  →  src/_cin-a.html (then: node build.js _cin-a.html → site/_cin-a.html)
   The page = the Unit 11 chrome + hero markup + ONLY the fragment's widget blocks (as bare sections) + shared runtime + cinema kit + the fragment's js. */
const fs = require('fs');
const x = process.argv[2]; if (!['a', 'b', 'c'].includes(x)) { console.error('usage: node mk-cin-test.js a|b|c'); process.exit(1); }
const u = fs.readFileSync('src/unit-11.html', 'utf8');
const head = u.slice(0, u.indexOf('</head>') + 7);
const top = u.slice(u.indexOf('<body>'), u.indexOf('<section class="hero-stage">'));
const hero = x === 'a' ? u.slice(u.indexOf('<section class="hero-stage">'), u.indexOf('<main id="main-content"')) : '';
const frag = fs.readFileSync(`tpl/u11-cin-${x}.html`, 'utf8');
const blocks = frag.split(/<!--@(W\d+)-->/).slice(1).filter((_, i) => i % 2 === 1).map(b => b.trim());
const main = '<main id="main-content" tabindex="-1">\n' + blocks.map((b, i) => `<section class="unit" id="t${i}">\n${b}\n</section>`).join('\n') + '\n</main>';
const ux = u.slice(u.lastIndexOf('/* ================= MBM-UX-V2'), u.lastIndexOf('</script>\n</body>'));
const script = '<!--@cinema-js-->\n<script>\n(function(){\n"use strict";\n' + fs.readFileSync('tpl/u11-shared.js', 'utf8').trimEnd() + '\n\n' + fs.readFileSync('tpl/u11-cinema.js', 'utf8').trimEnd() + '\n\n' + fs.readFileSync(`tpl/u11-cin-${x}.js`, 'utf8').trimEnd() + '\n\n})();\n' + ux + '</script>\n</body>\n</html>\n';
const out = head + '\n' + top + hero + main + '\n' + script;
fs.writeFileSync(`src/_cin-${x}.html`, out);
console.log(`src/_cin-${x}.html written: ${blocks.length} widget blocks${hero ? ' + hero' : ''}; now: node build.js _cin-${x}.html`);
