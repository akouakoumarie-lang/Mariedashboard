import sys
sp=sys.argv[1]
EMB='<path d="M30 4C37 13 37 24 30 31 23 24 23 13 30 4Z"/><path d="M29 31C21 30 13 22 11 11 21 12 28 21 29 31Z"/><path d="M31 31C39 30 47 22 49 11 39 12 32 21 31 31Z"/><path d="M29 37C21 40 11 38 5 29 15 26 24 30 29 37Z"/><path d="M31 37C39 40 49 38 55 29 45 26 36 30 31 37Z"/><path d="M28.6 30h2.8v24h-2.8z"/><path d="M30 54c-4-5-9-6-13-4 4 3 9 4 13 4zm0 0c4-5 9-6 13-4-4 3-9 4-13 4z"/>'
SCHEMES={
 'rose':  dict(a='#f3cdc8',b='#d99a96',c='#b97470',side='#c4807c',lidA='#f7d9d4',lidB='#e2aaa5',rib='#fbf3e6',ribS='#e6d3b5',gold='#c9a65c',ink='#8a4a4a'),
 'bordeaux':dict(a='#8e1f3a',b='#5e1023',c='#3a0814',side='#4c0c1c',lidA='#9c2643',lidB='#6a1328',rib='#e9cf8c',ribS='#b8924a',gold='#e2c27a',ink='#f1dca4'),
 'vert':  dict(a='#1e6a52',b='#11463a',c='#0a2a21',side='#0c3329',lidA='#22765b',lidB='#145240',rib='#e9cf8c',ribS='#b8924a',gold='#e2c27a',ink='#f1dca4'),
}
def page(scheme,W,H,D,lift):
    s=SCHEMES[scheme]; L=10  # débord du couvercle
    LW,LD,LH=W+2*L,D+2*L,int(H*0.28)
    rw=max(26,W*0.085)
    grain="url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .4 0 0 0 0 .3 0 0 0 1.1 -.25'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")"
    bow=f'''<svg viewBox="0 0 200 120" width="{rw*7.6:.0f}" height="{rw*4.5:.0f}">
<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{s['rib']}"/><stop offset="1" stop-color="{s['ribS']}"/></linearGradient></defs>
<path d="M100 70 C70 20 18 18 22 52 C25 78 70 82 100 70Z" fill="url(#rb)"/>
<path d="M100 70 C130 20 182 18 178 52 C175 78 130 82 100 70Z" fill="url(#rb)"/>
<path d="M100 70 C80 38 46 36 46 54 C47 66 74 70 100 70Z" fill="#000" opacity=".12"/>
<path d="M100 70 C120 38 154 36 154 54 C153 66 126 70 100 70Z" fill="#000" opacity=".12"/>
<path d="M92 72 L70 118 L84 112 L92 120 L100 76Z" fill="url(#rb)"/><path d="M108 72 L130 118 L116 112 L108 120 L100 76Z" fill="url(#rb)"/>
<ellipse cx="100" cy="70" rx="15" ry="13" fill="url(#rb)"/><ellipse cx="96" cy="66" rx="6" ry="4" fill="#fff" opacity=".35"/></svg>'''
    seal=f'''<svg viewBox="0 0 100 100" width="{rw*2.3:.0f}" height="{rw*2.3:.0f}"><defs><radialGradient id="sg" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#f7e4ad"/><stop offset=".5" stop-color="#d6b46a"/><stop offset="1" stop-color="#8a6526"/></radialGradient></defs>
<path d="M50 4 C62 3 70 9 78 14 C88 20 97 30 96 45 C98 58 92 70 84 79 C75 90 62 97 49 96 C35 97 22 90 14 80 C5 70 2 57 4 45 C4 30 12 18 23 11 C31 6 40 4 50 4Z" fill="url(#sg)"/>
<circle cx="50" cy="50" r="36" fill="none" stroke="#7a5718" stroke-width="1.6" opacity=".7"/>
<path d="M50 70 C36 60 28 52 28 43 A10 10 0 0 1 50 38 A10 10 0 0 1 72 43 C72 52 64 60 50 70Z" fill="#7a5718" opacity=".85"/></svg>'''
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:CG;font-weight:300 700;src:url(file://{sp}/fonts/Cormorant.ttf)}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1000px;height:1000px;background:transparent}}
.stage{{position:absolute;left:500px;top:560px;perspective:2200px;perspective-origin:50% 20%}}
.rig{{position:absolute;transform-style:preserve-3d;transform:rotateX(-24deg) rotateY(-34deg)}}
.f{{position:absolute;backface-visibility:hidden}}
.g::after{{content:"";position:absolute;inset:0;background-image:{grain};background-size:160px;opacity:.13;mix-blend-mode:multiply}}
/* base */
.base{{position:absolute;transform-style:preserve-3d}}
.front{{left:{-W/2}px;top:{-H}px;width:{W}px;height:{H}px;transform:translateZ({D/2}px);background:linear-gradient(170deg,{s['a']},{s['b']} 60%,{s['c']})}}
.back{{left:{-W/2}px;top:{-H}px;width:{W}px;height:{H}px;transform:rotateY(180deg) translateZ({D/2}px);background:{s['c']}}}
.right{{left:{-D/2}px;top:{-H}px;width:{D}px;height:{H}px;transform:rotateY(90deg) translateZ({W/2}px);background:linear-gradient(170deg,{s['side']},{s['c']})}}
.left{{left:{-D/2}px;top:{-H}px;width:{D}px;height:{H}px;transform:rotateY(-90deg) translateZ({W/2}px);background:{s['c']}}}
.inner{{left:{-W/2}px;top:{-D/2}px;width:{W}px;height:{D}px;transform:translateY({-H+8}px) rotateX(90deg);background:radial-gradient(60% 70% at 50% 50%,#fff3cf 0%,#f0c66e 30%,#b9802e 60%,{s['c']} 100%)}}
.rib{{position:absolute;background:linear-gradient(90deg,{s['ribS']},{s['rib']} 40%,{s['rib']} 60%,{s['ribS']})}}
/* couvercle */
.lid{{position:absolute;transform-style:preserve-3d;transform:translateY({-H-lift}px) rotateZ(-4deg) rotateX(6deg)}}
.ltop{{left:{-LW/2}px;top:{-LD/2}px;width:{LW}px;height:{LD}px;transform:translateY({-LH}px) rotateX(90deg);background:linear-gradient(135deg,{s['lidA']},{s['lidB']})}}
.lfront{{left:{-LW/2}px;top:{-LH}px;width:{LW}px;height:{LH}px;transform:translateZ({LD/2}px);background:linear-gradient(180deg,{s['lidA']},{s['lidB']})}}
.lright{{left:{-LD/2}px;top:{-LH}px;width:{LD}px;height:{LH}px;transform:rotateY(90deg) translateZ({LW/2}px);background:{s['side']}}}
.lleft{{left:{-LD/2}px;top:{-LH}px;width:{LD}px;height:{LH}px;transform:rotateY(-90deg) translateZ({LW/2}px);background:{s['c']}}}
.lback{{left:{-LW/2}px;top:{-LH}px;width:{LW}px;height:{LH}px;transform:rotateY(180deg) translateZ({LD/2}px);background:{s['c']}}}
.lunder{{left:{-LW/2}px;top:{-LD/2}px;width:{LW}px;height:{LD}px;transform:rotateX(-90deg);background:{s['c']}}}
.mark{{position:absolute;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:4px;color:{s['ink']}}}
.mark svg{{fill:{s['gold']}}}
.mark b{{font:600 {max(11,W*0.042):.0f}px/1 CG;letter-spacing:.3em;padding-left:.3em;color:{s['gold']}}}
.bow{{position:absolute;left:{-rw*3.8:.0f}px;top:{-rw*4.5:.0f}px;transform:translateY({-LH-1}px)}}
.seal{{position:absolute;left:{-rw*1.15:.0f}px;top:{-H*0.62:.0f}px;transform:translateZ({D/2+2}px)}}
.glow{{position:absolute;left:-360px;top:-360px;width:720px;height:720px;transform:translateY({-H-lift*0.4}px);background:radial-gradient(circle,rgba(255,228,160,.55),rgba(255,210,140,0) 60%);pointer-events:none}}
.shadow{{position:absolute;left:{-W*0.95:.0f}px;top:{-30}px;width:{W*1.9:.0f}px;height:{D*0.9:.0f}px;background:radial-gradient(closest-side,rgba(20,0,6,.55),rgba(20,0,6,0));transform:rotateX(90deg) translateZ(-2px)}}
</style></head><body><div class="stage"><div class="rig">
<div class="shadow"></div>
<div class="base">
 <div class="f back"></div><div class="f left"></div><div class="f inner"></div>
 <div class="f right g"><div class="rib" style="left:{D/2-rw/2}px;top:0;width:{rw}px;height:100%"></div></div>
 <div class="f front g"><div class="rib" style="left:{W/2-rw/2}px;top:0;width:{rw}px;height:100%"></div><div class="seal" style="transform:none;left:{W/2-rw*1.15:.0f}px;top:{H*0.38-rw*1.15:.0f}px">{seal}</div></div>
</div>
<div class="lid">
 <div class="f lunder"></div><div class="f lback"></div><div class="f lleft"></div>
 <div class="f lright g"><div class="rib" style="left:{LD/2-rw/2}px;top:0;width:{rw}px;height:100%"></div></div>
 <div class="f lfront g"><div class="rib" style="left:{LW/2-rw/2}px;top:0;width:{rw}px;height:100%"></div></div>
 <div class="f ltop g"><div class="rib" style="left:{LW/2-rw/2}px;top:0;width:{rw}px;height:100%"></div><div class="rib" style="top:{LD/2-rw/2}px;left:0;height:{rw}px;width:100%;background:linear-gradient(180deg,{s['ribS']},{s['rib']} 40%,{s['rib']} 60%,{s['ribS']})"></div>
  <div class="mark" style="top:{LD*0.66:.0f}px"><svg viewBox="0 0 60 60" width="{max(18,W*0.07):.0f}" height="{max(18,W*0.07):.0f}">{EMB}</svg><b>COTONOU BOX</b></div></div>
 <div class="bow">{bow}</div>
</div>
</div></div></body></html>'''
for name,(sc,W,H,D,lift) in {'petite':('rose',250,130,190,58),'amour':('bordeaux',320,170,240,70),'prestige':('vert',400,210,290,82)}.items():
    open(f'{sp}/val/box-{name}.html','w').write(page(sc,W,H,D,lift))
print('ok')
