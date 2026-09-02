const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const p = 'unit-03';
  fs.mkdirSync(`shots-after/${p}`, { recursive: true });
  for (const [tag,w,h] of [['d',1440,900],['m',390,844]]) {
    const pg = await b.newPage({ viewport: { width: w, height: h } });
    await pg.goto('file://' + __dirname + `/site/${p}.html`);
    await pg.waitForTimeout(800);
    const secs = await pg.$$('main section, header.hero');
    let i = 0;
    for (const s of secs) {
      const box = await s.boundingBox(); if (!box || box.height < 40) continue;
      await s.scrollIntoViewIfNeeded(); await pg.waitForTimeout(250);
      const id = (await s.getAttribute('id')) || `sec${i}`;
      try { await s.screenshot({ path: `shots-after/${p}/${tag}-${String(i).padStart(2,'0')}-${id}.png` }); } catch(e){ console.log(p,id,e.message.slice(0,80)); }
      i++;
    }
    console.log(p, tag, i, 'sections');
    await pg.close();
  }
  await b.close();
})();
