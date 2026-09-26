#!/usr/bin/env python3
"""Extract the readable text of src/unit-16.html section by section (reviewer helper).
usage: python3 audits/u16-extract.py [s1 s2 ...]   -> prints to stdout"""
import sys, re
from bs4 import BeautifulSoup, NavigableString, Tag

html = open('/home/claude/mfml-site/dev/src/unit-16.html', encoding='utf8').read()
soup = BeautifulSoup(html, 'html.parser')
want = set(sys.argv[1:])

def txt(el):
    t = el.get_text(' ', strip=True)
    return re.sub(r'\s+', ' ', t)

def walk(el, out, depth=0):
    for ch in el.children:
        if isinstance(ch, NavigableString):
            continue
        if not isinstance(ch, Tag):
            continue
        cls = ' '.join(ch.get('class', []))
        if ch.name in ('script', 'style', 'svg', 'canvas'):
            continue
        if 'widget' in cls.split() and ch.get('id', '').startswith('w-'):
            t = ch.select_one('.w-title'); s = ch.select_one('.w-sub'); tr = ch.select_one('.try')
            out.append(f"\n[WIDGET {ch.get('id')}] {txt(t) if t else ''}\n  sub: {txt(s) if s else ''}\n  {txt(tr) if tr else '(no try)'}")
            # capture any static prose inside widgets (legends / notes)
            for lg in ch.select('.legend, .w-note, .note, .caption, figcaption'):
                out.append('  legend/note: ' + txt(lg))
            continue
        if 'check' in cls.split() and ch.get('data-check'):
            q = ch.select_one('.q') or ch.find(['p', 'div'])
            out.append(f"\n[CHECK {ch.get('data-check')}] {txt(q) if q else ''}")
            for b in ch.select('.opts button'):
                mark = '*' if b.has_attr('data-correct') else '-'
                out.append(f"   {mark} {txt(b)}  || why: {b.get('data-why','')}")
            continue
        if ch.name == 'details':
            sm = ch.find('summary')
            out.append(f"\n[DRAWER] {txt(sm) if sm else ''}")
            for d in ch.select('.derive'):
                out.append('   ' + txt(d))
            continue
        if 'callout' in cls:
            out.append(f"\n[CALLOUT {cls}] {txt(ch)}")
            continue
        if ch.name in ('p', 'li', 'h2', 'h3', 'h4', 'table', 'figcaption', 'ol', 'ul') or 'sec-head' in cls:
            if ch.name in ('ol', 'ul'):
                for li in ch.find_all('li', recursive=False):
                    out.append('  • ' + txt(li))
                continue
            if ch.name == 'table':
                for tr in ch.find_all('tr'):
                    out.append('  | ' + ' | '.join(txt(c) for c in tr.find_all(['td', 'th'])))
                continue
            t = txt(ch)
            if t:
                out.append(('## ' if 'sec-head' in cls or ch.name == 'h2' else '') + t)
            continue
        walk(ch, out, depth + 1)

hero = soup.select_one('section.hero-stage')
if not want or 'hero' in want:
    print('=== HERO ===')
    print(txt(hero)[:3000])
for sec in soup.select('section.unit'):
    sid = sec.get('id')
    if want and sid not in want:
        continue
    out = []
    walk(sec, out)
    print(f'\n\n=============== {sid} ===============')
    print('\n'.join(out))
