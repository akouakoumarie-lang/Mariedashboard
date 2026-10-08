import sys, re, math, random, urllib.parse
sp, F = sys.argv[1], sys.argv[2]
pat = open(sp+'/poster/patterns.svg').read()
tiles = {}
for m in re.finditer(r'<pattern id="cb-wax(\w)" width="(\d+)" height="(\d+)"[^>]*>(.*?)</pattern>', pat, re.S):
    k, w, h, inner = m.groups()
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}">{inner}</svg>'
    tiles[k] = (urllib.parse.quote(svg), int(w))
def waxbg(k, scale=1.0):
    q, w = tiles[k]
    return f"background-image:url('data:image/svg+xml,{q}');background-size:{w*scale}px {w*scale}px"

EMB = '<path d="M30 4C37 13 37 24 30 31 23 24 23 13 30 4Z"/><path d="M29 31C21 30 13 22 11 11 21 12 28 21 29 31Z"/><path d="M31 31C39 30 47 22 49 11 39 12 32 21 31 31Z"/><path d="M29 37C21 40 11 38 5 29 15 26 24 30 29 37Z"/><path d="M31 37C39 40 49 38 55 29 45 26 36 30 31 37Z"/><path d="M28.6 30h2.8v24h-2.8z"/><path d="M30 54c-4-5-9-6-13-4 4 3 9 4 13 4zm0 0c4-5 9-6 13-4-4 3-9 4-13 4z"/>'

# --- Boîte ---
W, H, D = 540, 664, 110
PADX, PADT, PADB, GAP = 28, 92, 26, 10
cols, rows = 4, 6
dw = (W - 2*PADX - (cols-1)*GAP) / cols
dh = (H - PADT - PADB - (rows-1)*GAP) / rows
order = [7,14,3,21, 10,18,1,16, 23,5,12,8, 20,11,2,15, 22,6,9,19, 13,4,17,24]
waxmap = {14:'A', 5:'C', 2:'B', 19:'D'}
solid = ['#efe6d4', '#b5553a', '#5a1a2b', '#efe6d4', '#14533f']
doors = ''
ICONS = [
 '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
 '<path d="M7 9h10v9a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3z"/><path d="M6 6h12v3H6z"/><path d="M10 13h4"/>',
 '<path d="M5 19C5 10 11 5 19 4c0 9-5 14-14 15z"/><path d="M5 19l8-8"/>',
 '<path d="M12 20s-7-4.4-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.6 12 20 12 20z"/>',
 '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
 '<rect x="4" y="10" width="16" height="10"/><path d="M3 7h18v3H3zM12 7v13M12 7c-1.5-4-6-4-5.5-1 .4 1.6 3.5 1 5.5 1zm0 0c1.5-4 6-4 5.5-1-.4 1.6-3.5 1-5.5 1z"/>',
 '<path d="M10 3h4v3l2 2v12H8V8l2-2z"/><path d="M8 13h8"/>',
]
for i, n in enumerate(order):
    c, r = i % cols, i // cols
    x = PADX + c*(dw+GAP); y = PADT + r*(dh+GAP)
    if n == 24:
        face = 'background:linear-gradient(135deg,#f6e3a8,#d2b06a 45%,#a07b35);'
        ink = '#4a1424'
    elif n in waxmap:
        face = waxbg(waxmap[n], .9) + ';'
        ink = '#efe2c6'
    else:
        col = solid[(i*2 + r) % len(solid)]
        face = f'background:{col};'
        ink = '#14533f' if col == '#efe6d4' else '#e9d39b'
    foil = (n != 24 and n not in waxmap and ink != '#14533f')
    badge = (f'<span class="num foil">{n}</span>' if foil else f'<span class="num" style="color:{ink}">{n}</span>') if n not in waxmap else f'<span class="num wx">{n}</span>'
    icon = ICONS[(i*3) % len(ICONS)] if n != 24 else ICONS[5]
    doors += (f'<div class="cell" style="left:{x:.1f}px;top:{y:.1f}px;width:{dw:.1f}px;height:{dh:.1f}px" data-n="{n}">'
              f'<div class="glow"></div><svg class="ico" viewBox="0 0 24 24">{icon}</svg>'
              f'<div class="door" data-n="{n}"><div class="df" style="{face}">{badge}<i class="notch"></i></div><div class="db"></div></div></div>')

# --- Sceau de cire (bord irrégulier) ---
random.seed(4)
pts = []
N = 28
for k in range(N):
    a = 2*math.pi*k/N
    rr = 128 + random.uniform(-7, 7) + (10 if k % 7 == 3 else 0)
    pts.append((150 + rr*math.cos(a), 150 + rr*math.sin(a)))
def catmull(p):
    d = f'M{p[0][0]:.1f},{p[0][1]:.1f}'
    n = len(p)
    for i in range(n):
        p0, p1, p2, p3 = p[i-1], p[i], p[(i+1) % n], p[(i+2) % n]
        c1 = (p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6)
        c2 = (p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6)
        d += f' C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}'
    return d + 'Z'
blob = catmull(pts)
seal = f'''<svg viewBox="0 0 300 300" width="300" height="300">
<defs>
<radialGradient id="wax" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#f7e4ad"/><stop offset=".45" stop-color="#d6b46a"/><stop offset=".85" stop-color="#a98235"/><stop offset="1" stop-color="#7d5c22"/></radialGradient>
<filter id="emb" x="-10%" y="-10%" width="120%" height="120%">
 <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="b"/>
 <feSpecularLighting in="b" surfaceScale="3.2" specularConstant=".9" specularExponent="22" lighting-color="#fff6dc" result="s"><feDistantLight azimuth="225" elevation="42"/></feSpecularLighting>
 <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
 <feComposite in="SourceGraphic" in2="s2" operator="arithmetic" k1="0" k2="1" k3=".55" k4="0"/>
</filter>
<filter id="drop" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#1a0408" flood-opacity=".6"/></filter>
<path id="ring" d="M150,150 m-99,0 a99,99 0 1,1 198,0 a99,99 0 1,1 -198,0"/>
</defs>
<g filter="url(#drop)"><path d="{blob}" fill="url(#wax)" filter="url(#emb)"/></g>
<g filter="url(#emb)">
 <circle cx="150" cy="150" r="114" fill="none" stroke="#9c7630" stroke-width="3"/>
 <circle cx="150" cy="150" r="84" fill="none" stroke="#9c7630" stroke-width="1.6"/>
 <text font-family="CG" font-weight="600" font-size="15.5" letter-spacing="4.2" fill="#87631f"><textPath href="#ring" startOffset="0">COTONOU BOX ✦ NOËL 2026 ✦ COTONOU BOX ✦ NOËL 2026 ✦</textPath></text>
 <g transform="translate(135 92) scale(.5)" fill="#8f6a25">{EMB}</g>
 <text x="150" y="168" text-anchor="middle" font-family="GV" font-size="50" fill="#7a5718">Coming</text>
 <text x="150" y="196" text-anchor="middle" font-family="CG" font-weight="700" font-size="21" letter-spacing="7" fill="#7a5718">SOON</text>
</g></svg>'''

GRAINSVG = urllib.parse.quote('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .4  0 0 0 0 .3  0 0 0 1.2 -.2"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>')
GRAINCSS = ":root{--grain:url('data:image/svg+xml," + GRAINSVG + "')}"
html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:GV;src:url(file://{sp}/fonts/GreatVibes-Regular.ttf)}}
@font-face{{font-family:CG;font-weight:300 700;src:url(file://{sp}/fonts/Cormorant.ttf)}}
@font-face{{font-family:IS;font-style:italic;src:url(file://{F}/InstrumentSerif-Italic.ttf)}}
@font-face{{font-family:SANS;src:url(file://{F}/InstrumentSans-Regular.ttf)}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:var(--w);height:var(--h);overflow:hidden;background:#2a0a13}}
body.reel{{--bs:1.04;--w:1080px;--h:1920px}} body.poster{{--w:1080px;--h:1350px}}
#s{{position:relative;width:var(--w);height:var(--h);overflow:hidden;color:#f5ede2;text-align:center}}
#bg{{position:absolute;inset:-8%;background:radial-gradient(55% 42% at 50% 52%,#6a2034 0%,#4a1424 50%,#2a0a13 100%)}}
#rays{{position:absolute;left:50%;top:var(--boxY);width:1800px;height:1800px;margin:-900px 0 0 -900px;opacity:0;
 background:repeating-conic-gradient(from 0deg,rgba(255,226,160,.10) 0deg 4deg,rgba(255,226,160,0) 4deg 15deg);
 -webkit-mask:radial-gradient(circle,#000 0,transparent 60%);mask:radial-gradient(circle,#000 0,transparent 60%)}}
canvas{{position:absolute;inset:0}}
#frame{{position:absolute;inset:0;pointer-events:none}}
.stage{{position:absolute;left:50%;top:var(--boxY);width:0;height:0;perspective:2300px;perspective-origin:50% 40%}}
.cam{{position:absolute;transform-style:preserve-3d}}
.box{{position:absolute;left:{-W/2}px;top:{-H/2}px;width:{W}px;height:{H}px;transform-style:preserve-3d}}
.f{{position:absolute;backface-visibility:hidden}}
.front{{inset:0;transform:translateZ({D/2}px);background:linear-gradient(160deg,#1c6a51 0%,#11463a 55%,#0b3127 100%);transform-style:preserve-3d;box-shadow:inset 0 0 0 2px #c9a65c, inset 0 0 0 9px #11463a, inset 0 0 0 10px rgba(201,166,92,.7)}}
.back{{inset:0;transform:rotateY(180deg) translateZ({D/2}px);background:#0b3127}}
.right{{top:0;left:{(W-D)/2}px;width:{D}px;height:{H}px;transform:rotateY(90deg) translateZ({W/2}px);background:linear-gradient(90deg,#0d3a2e,#072219);box-shadow:inset 0 0 0 1px rgba(201,166,92,.5)}}
.left{{top:0;left:{(W-D)/2}px;width:{D}px;height:{H}px;transform:rotateY(-90deg) translateZ({W/2}px);background:linear-gradient(90deg,#072219,#0d3a2e);box-shadow:inset 0 0 0 1px rgba(201,166,92,.5)}}
.top{{left:0;top:{(H-D)/2}px;width:{W}px;height:{D}px;transform:rotateX(90deg) translateZ({H/2}px);background:linear-gradient(180deg,#1f735a,#145440);box-shadow:inset 0 0 0 1px rgba(201,166,92,.6)}}
.bottom{{left:0;top:{(H-D)/2}px;width:{W}px;height:{D}px;transform:rotateX(-90deg) translateZ({H/2}px);background:#061a14}}
.shade{{position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,240,210,.16),rgba(0,0,0,0) 40%,rgba(0,0,0,.28));pointer-events:none;transform:translateZ(1px)}}
.head{{position:absolute;left:0;right:0;top:20px;display:flex;flex-direction:column;align-items:center;gap:6px;transform:translateZ(1px)}}
.head svg{{width:30px;height:30px;fill:#d6b46a}}
.head b{{font:600 15px/1 CG;letter-spacing:.34em;padding-left:.34em;color:#e9d39b}}
.cell{{position:absolute;transform-style:preserve-3d;background:#06190f;box-shadow:inset 0 3px 8px rgba(0,0,0,.7)}}
{GRAINCSS}
.ico{{position:absolute;left:50%;top:50%;width:46%;height:62%;transform:translate(-50%,-50%);fill:none;stroke:#6b4510;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;opacity:0}}
.cell[data-n="24"] .ico{{stroke:#5a3a0c;stroke-width:1.4}}
.foil{{color:#ecd497!important;text-shadow:0 -1px 0 rgba(255,246,214,.55),0 1px 1px rgba(0,0,0,.55)}}
.front::after,.df::after{{content:"";position:absolute;inset:0;pointer-events:none;opacity:.10;mix-blend-mode:multiply;background-image:var(--grain);background-size:160px 160px}}
#hook{{position:absolute;left:90px;right:90px;top:var(--hookY);font:italic var(--hookS)/1.18 IS;color:#efe2c6;opacity:0;text-shadow:0 6px 30px rgba(0,0,0,.4)}}
#hook b{{display:block;font:400 calc(var(--hookS)*.9)/1 CG;color:#e7cf93;margin-top:18px}}
#sub{{position:absolute;left:0;right:0;top:var(--subY);font:italic 26px/1 IS;color:rgba(239,226,198,.9);opacity:0;display:none}}
body.poster #sub{{display:block}}
.glow{{position:absolute;inset:0;background:radial-gradient(circle at 50% 55%,#fff1c4 0%,#f1c769 30%,rgba(190,120,30,.5) 62%,rgba(20,10,0,.0) 100%);opacity:0}}
.door{{position:absolute;inset:0;transform-origin:0 50%;transform-style:preserve-3d}}
.df,.db{{position:absolute;inset:0;backface-visibility:hidden;display:grid;place-items:center}}
.df{{box-shadow:inset 0 0 0 1px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.25)}}
.db{{transform:rotateY(180deg);background:linear-gradient(90deg,#d8c7a4,#efe3c8)}}
.num{{font:500 30px/1 CG;font-variant-numeric:lining-nums}}
.num.wx{{width:44px;height:44px;border-radius:50%;background:#4a1424;color:#efe2c6;display:grid;place-items:center;font-size:24px}}
.cell[data-n="24"] .num{{font-size:38px;font-weight:600}}
.notch{{position:absolute;right:7px;top:50%;width:5px;height:16px;margin-top:-8px;border-radius:3px;background:rgba(0,0,0,.18)}}
.ground{{position:absolute;left:-420px;top:{H/2-30}px;width:840px;height:140px;background:radial-gradient(closest-side,rgba(10,0,4,.75),rgba(10,0,4,0));transform:translateY(60px)}}
.t{{position:absolute;left:0;right:0;opacity:0}}
#emb{{top:var(--embY)}} #emb svg{{width:58px;height:58px;fill:#cdb27a}}
#brand{{top:calc(var(--embY) + 76px);font:500 22px/1 CG;letter-spacing:.36em;padding-left:.36em}}
#t1{{top:var(--t1Y);font:400 var(--t1S)/1.1 GV;color:#efe2c6;text-shadow:0 4px 30px rgba(0,0,0,.35)}}
#t2{{top:var(--t2Y);font:500 var(--t2S)/1 CG;letter-spacing:.38em;padding-left:.38em}}
#seal{{position:absolute;left:var(--sealX);top:var(--sealY);width:300px;height:300px;margin:-150px 0 0 -150px;opacity:0}}
#lead{{top:var(--leadY);left:60px;right:60px;font:italic 40px/1.3 IS;color:rgba(245,237,226,.95)}}
#brands{{top:var(--brY);display:flex;justify-content:center;align-items:center;gap:18px;font:600 23px/1 CG;letter-spacing:.2em;color:#cdb27a;opacity:1}}
#brands span{{opacity:0;display:inline-block}}
#brands i{{width:6px;height:6px;background:#cdb27a;transform:rotate(45deg);opacity:0}}
#more{{top:var(--moY);font:italic 27px/1 IS;color:rgba(239,226,198,.85)}}
#pay{{top:var(--payY);left:50%;right:auto;width:740px;margin-left:-370px}}
.payin{{position:relative;overflow:hidden;display:flex;justify-content:center;align-items:center;gap:22px;padding:18px 0 16px;background:linear-gradient(135deg,#f6e3a8 0%,#d4b06a 45%,#a8803a 100%);color:#3d0f1c;box-shadow:0 10px 30px rgba(0,0,0,.35)}}
.payin b{{font:700 30px/1 SANS;letter-spacing:.12em}}
.payin em{{font:600 30px/1 CG;font-style:normal;font-variant-numeric:lining-nums}}
.payin::after{{content:"";position:absolute;top:0;bottom:0;width:120px;left:var(--shx,-160px);background:linear-gradient(100deg,transparent,rgba(255,255,255,.7),transparent);transform:skewX(-18deg)}}
body.poster #pay,body.poster #more{{display:none}}
#mini{{position:absolute;left:520px;top:880px;width:580px;opacity:0;filter:drop-shadow(0 26px 30px rgba(0,0,0,.4))}}
#minitag{{position:absolute;left:660px;width:300px;top:828px;font:600 20px/1 CG;letter-spacing:.5em;padding-left:.5em;color:#cdb27a;opacity:0}}
.fmt{{position:absolute;top:1400px;width:420px;opacity:0;text-align:center}}
#f24{{left:120px}} #f12{{left:600px}}
.fmt b{{display:block;font:600 26px/1 CG;letter-spacing:.3em;color:#cdb27a}}
.fmt strong{{display:block;margin-top:14px;font:500 70px/1 CG;color:#efe2c6;font-variant-numeric:lining-nums}}
.fmt strong small{{font:15px/1 SANS;letter-spacing:.3em;color:#cdb27a;vertical-align:14px}}
.fmt span{{display:block;margin-top:12px;font:italic 28px/1 IS;color:rgba(239,226,198,.9);font-variant-numeric:lining-nums}}
#pay2{{top:1612px;left:50%;right:auto;width:740px;margin-left:-370px}}
body.poster #mini,body.poster #minitag,body.poster .fmt,body.poster #pay2{{display:none}}
#price{{top:var(--prY);font:500 76px/1 CG;color:#efe2c6;font-variant-numeric:lining-nums}}
#price span{{font:16px/1 SANS;letter-spacing:.32em;color:#cdb27a;margin-left:12px;vertical-align:16px}}
#cta{{top:var(--ctaY);left:50%;right:auto;width:740px;margin-left:-370px;padding:24px 0 22px;border:1px solid rgba(205,178,122,.75);background:rgba(20,4,9,.25)}}
#cta b{{display:block;font:400 17px/1 SANS;letter-spacing:.2em;text-transform:uppercase;color:#cdb27a}}
#cta span{{display:block;margin-top:12px;font:500 44px/1 CG;letter-spacing:.06em;font-variant-numeric:lining-nums}}
body.reel{{--hookY:770px;--hookS:64px;--boxY:944px;--embY:140px;--t1Y:276px;--t1S:150px;--t2Y:458px;--t2S:40px;--sealX:800px;--sealY:660px;--leadY:1392px;--brY:1452px;--moY:1494px;--prY:1538px;--payY:1632px;--ctaY:1722px}}
body.poster{{--subY:376px;--hookY:-500px;--hookS:40px;--bs:.74;--boxY:700px;--embY:50px;--t1Y:184px;--t1S:118px;--t2Y:324px;--t2S:30px;--sealX:790px;--sealY:500px;--leadY:1000px;--brY:1016px;--prY:1056px;--ctaY:1160px}}
body.poster #lead{{display:none}}
body.poster #price{{font-size:62px}} body.poster #brands{{font-size:22px}} body.poster #cta span{{font-size:38px}} body.poster #seal svg{{transform:scale(.86)}}
</style></head><body class="MODE"><div id="s">
<div id="bg"></div><div id="rays"></div><canvas id="dust"></canvas>
<svg id="frame"><rect id="fr1" fill="none" stroke="#cdb27a" stroke-opacity=".6" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/><rect id="fr2" fill="none" stroke="#cdb27a" stroke-opacity=".3" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>
<div class="t" id="emb"><svg viewBox="0 0 60 60">{EMB}</svg></div>
<div class="t" id="brand">COTONOU BOX</div>
<p id="hook">Et si Noël avait le goût<br>du Bénin&nbsp;?<b>✦</b></p>
<div class="t" id="t1">Calendrier</div>
<div class="t" id="t2">DE L’AVENT</div>
<p id="sub">Et si Noël avait le goût du Bénin&nbsp;?</p>
<div class="stage"><div class="cam" id="cam"><div class="ground" id="ground"></div><div class="box" id="box">
 <div class="f back"></div><div class="f left"></div><div class="f right"></div><div class="f top"></div><div class="f bottom"></div>
 <div class="f front"><div class="head"><svg viewBox="0 0 60 60">{EMB}</svg><b>COTONOU BOX</b></div>{doors}<div class="shade"></div></div>
</div></div></div>
<canvas id="fx"></canvas>
<div id="seal">{seal}</div>
<p class="t" id="lead">Trésors du Bénin &amp; soins de grandes maisons</p>
<p class="t" id="brands"><span>RITUALS</span><i></i><span>YVES ROCHER</span><i></i><span>SEPHORA</span><i></i><span>L’ORÉAL</span></p>
<p class="t" id="more">et bien d’autres grandes maisons…</p>
<p class="t" id="price">45 000<span>FCFA</span></p>
<div class="t" id="pay"><div class="payin"><b>PAYABLE EN 2 FOIS</b><em>25 000 + 20 000 FCFA</em></div></div>
<img id="mini" src="file://{sp}/v4/cal12.png">
<p id="minitag">MINI</p>
<div class="fmt" id="f24"><b>24 JOURS</b><strong>45 000 <small>FCFA</small></strong><span>ou 25 000 + 20 000</span></div>
<div class="fmt" id="f12"><b>12 JOURS</b><strong>25 000 <small>FCFA</small></strong><span>ou 15 000 + 10 000</span></div>
<div class="t" id="pay2"><div class="payin"><b>PAIEMENT EN 2 FOIS</b><em>sur les deux formats</em></div></div>
<div class="t" id="cta"><b>Intéressé(e)&nbsp;? Écrivez-nous sur WhatsApp</b><span>+229 01 97 17 64 59</span></div>
</div>
<script>
const $=id=>document.getElementById(id);
const Wd=innerWidth,Hd=innerHeight;
for(const c of document.querySelectorAll('canvas')){{c.width=Wd;c.height=Hd;}}
const fr1=$('fr1'),fr2=$('fr2');$('frame').setAttribute('viewBox',`0 0 ${{Wd}} ${{Hd}}`);$('frame').setAttribute('width',Wd);$('frame').setAttribute('height',Hd);
fr1.setAttribute('x',38);fr1.setAttribute('y',38);fr1.setAttribute('width',Wd-76);fr1.setAttribute('height',Hd-76);
fr2.setAttribute('x',47);fr2.setAttribute('y',47);fr2.setAttribute('width',Wd-94);fr2.setAttribute('height',Hd-94);
const cl=x=>Math.max(0,Math.min(1,x)),p=(t,a,b)=>cl((t-a)/(b-a)),eo=x=>1-Math.pow(1-x,3),eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const back=x=>{{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);}};
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const P=Array.from({{length:60}},()=>({{x:rnd()*Wd,y:rnd()*Hd,r:.8+rnd()*2.4,v:10+rnd()*30,ph:rnd()*6.28,a:.15+rnd()*.45}}));
const B=Array.from({{length:90}},()=>({{a:rnd()*6.283,v:180+rnd()*520,r:1+rnd()*3,life:.8+rnd()*1.2}}));
const dctx=$('dust').getContext('2d'),fctx=$('fx').getContext('2d');
const doors=[...document.querySelectorAll('.door')];
const cells=[...document.querySelectorAll('.cell')];
const others=doors.filter(d=>d.dataset.n!=='24');
const rank=others.map((d,i)=>i).sort((a,b)=>((a*11)%23)-((b*11)%23));
const start={{}};rank.forEach((di,k)=>start[di]=4.7+k*0.13);
const d24=doors.find(d=>d.dataset.n==='24'),c24=cells.find(c=>c.dataset.n==='24');
function txt(id,t,a,b,dy=20){{const e=$(id),k=eo(p(t,a,b));e.style.opacity=k;e.style.transform=`translateY(${{(1-k)*dy}}px)`;}}
window.setT=function(t){{
 $('bg').style.transform=`scale(${{1+.035*Math.sin(t/18*Math.PI)}})`;
 dctx.clearRect(0,0,Wd,Hd);
 for(const q of P){{const y=((q.y-q.v*t)%Hd+Hd)%Hd;const tw=.5+.5*Math.sin(q.ph+t*1.7);dctx.fillStyle=`rgba(230,200,135,${{q.a*tw*cl(t/1.5)}})`;dctx.beginPath();dctx.arc(q.x+Math.sin(q.ph+t*.5)*9,y,q.r,0,6.283);dctx.fill();}}
 fr1.style.strokeDashoffset=1-eio(p(t,0,1.6));fr2.style.strokeDashoffset=1-eio(p(t,.3,1.9));
 // caméra
 const rise=eo(p(t,2.0,3.8));
 const hk=eo(p(t,.15,.8))*(1-eio(p(t,1.8,2.4)));$('hook').style.opacity=hk;$('hook').style.transform=`translateY(${{(1-eo(p(t,.15,.9)))*24-16*eio(p(t,1.8,2.4))}}px) scale(${{1+.03*p(t,0,2.4)}})`;
 let ry=-42+20*eio(p(t,2.0,9))+6*eio(p(t,10.2,12.4)), rx=17-6*eio(p(t,2.0,9))-2*eio(p(t,10.2,12.4));
 ry+=1.2*Math.sin(t*.9);rx+=.6*Math.sin(t*.7+1);
 let shake=0;const si=p(t,12.55,13.3);if(si>0&&si<1)shake=(1-si)*9*Math.sin(si*60);
 const fl=6*Math.sin(t*1.3);
 const mv=document.body.classList.contains('reel')?eio(p(t,18.0,19.1)):0;
 $('cam').style.transform=`translate3d(${{shake-215*mv}}px,${{(1-rise)*420+fl+50*mv}}px,0) rotateX(${{rx}}deg) rotateY(${{ry+6*mv}}deg) scale3d(calc(var(--bs) * ${{1-.3*mv}}),calc(var(--bs) * ${{1-.3*mv}}),calc(var(--bs) * ${{1-.3*mv}}))`;
 $('cam').style.opacity=cl(rise*1.4);
 $('ground').style.opacity=rise;
 // portes : vague d'ouverture
 others.forEach((d,i)=>{{const s=start[i];const o=eo(p(t,s,s+.38))-eio(p(t,s+.75,s+1.15));const a=104*o;
   d.style.transform=`rotateY(${{-a}}deg)`;d.querySelector('.df').style.filter=`brightness(${{1-.38*Math.sin(a*Math.PI/180)}})`;
   d.parentElement.querySelector('.glow').style.opacity=o;d.parentElement.querySelector('.ico').style.opacity=cl(o*1.4-.25);}});
 const o24=back(p(t,8.9,9.8))*(t>8.9?1:0);const a24=118*Math.min(o24,1.08);
 d24.style.transform=`rotateY(${{-a24}}deg)`;d24.querySelector('.df').style.filter=`brightness(${{1-.35*Math.sin(Math.min(a24,90)*Math.PI/180)}})`;
 c24.querySelector('.glow').style.opacity=cl(o24*1.3)*(1+.15*Math.sin(t*6));c24.querySelector('.ico').style.opacity=cl(o24*1.4-.3);
 $('rays').style.opacity=.85*eo(p(t,9.1,10.2))*(1-.25*eio(p(t,14,16)));
 $('rays').style.transform=`rotate(${{t*4}}deg)`;
 // éclat de lumière
 fctx.clearRect(0,0,Wd,Hd);
 const bt=t-9.15;
 if(bt>0&&bt<2.4){{const r=c24.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;
   const g=fctx.createRadialGradient(cx,cy,0,cx,cy,260);const ga=.55*Math.max(0,1-bt/1.4);g.addColorStop(0,`rgba(255,240,200,${{ga}})`);g.addColorStop(1,'rgba(255,220,150,0)');fctx.fillStyle=g;fctx.fillRect(0,0,Wd,Hd);
   for(const q of B){{if(bt>q.life)continue;const k=bt/q.life;const dist=q.v*eo(Math.min(1,bt/1.2));fctx.fillStyle=`rgba(255,226,150,${{(1-k)*.9}})`;fctx.beginPath();fctx.arc(cx+Math.cos(q.a)*dist,cy+Math.sin(q.a)*dist*.8-bt*30,q.r*(1-k*.5),0,6.283);fctx.fill();}}}}
 // textes
 txt('emb',t,2.2,3.0,14);
 const kb=eo(p(t,2.5,3.4));$('brand').style.opacity=kb;$('brand').style.letterSpacing=(.8-.44*kb)+'em';
 const kt=eio(p(t,2.9,4.1));$('t1').style.opacity=kt>0?1:0;$('t1').style.clipPath=`inset(-20% ${{(1-kt)*100}}% -20% 0)`;
 const k2=eo(p(t,3.8,4.6));$('t2').style.opacity=k2;$('t2').style.letterSpacing=(.7-.32*k2)+'em';
 // sceau
 const ks=p(t,12.0,12.6);const seal=$('seal');
 if(ks>0){{const e=back(ks);seal.style.opacity=cl(ks*3);seal.style.transform=`translate(${{-255*mv}}px,${{95*mv}}px) scale(${{(2.3-1.3*Math.min(e,1.06))*1.12*(1-.32*mv)}}) rotate(${{-26+16*eo(ks)}}deg)`;}} else seal.style.opacity=0;
 txt('lead',t,13.2,14.1,18);
 const bs=document.querySelectorAll('#brands span'),bi=document.querySelectorAll('#brands i');
 bs.forEach((s,j)=>{{const k=eo(p(t,13.7+j*.25,14.3+j*.25));s.style.opacity=k;s.style.transform=`translateY(${{(1-k)*12}}px)`;}});
 bi.forEach((s,j)=>s.style.opacity=eo(p(t,13.95+j*.25,14.35+j*.25)));
 txt('more',t,14.9,15.6,10);
 txt('price',t,15.3,16.1,18);
 {{const e=$('pay'),k=p(t,16.1,16.7);e.style.opacity=cl(k*2.5);e.style.transform=`scale(${{k>0?(.6+.4*back(k)):.6}})`;e.querySelector('.payin').style.setProperty('--shx',(-160+1000*eio(p(t,16.9,17.8)))+'px');}}
 if(document.body.classList.contains('reel')){{
   const out=1-eio(p(t,17.9,18.4));['lead','brands','more','price','pay'].forEach(id=>{{const e=$(id);e.style.opacity=(+getComputedStyle(e).opacity||0)*out;}});
   const km=eo(p(t,18.5,19.3));$('mini').style.opacity=km;$('mini').style.transform=`translateY(${{(1-km)*60}}px) scale(${{.9+.1*km}})`;$('minitag').style.opacity=eo(p(t,19.0,19.6));
   ['f24','f12'].forEach((id,j)=>{{const k=eo(p(t,19.3+j*.3,20.0+j*.3));$(id).style.opacity=k;$(id).style.transform=`translateY(${{(1-k)*18}}px)`;}});
   const e2=$('pay2'),k2=p(t,20.3,20.9);e2.style.opacity=cl(k2*2.5);e2.style.transform=`scale(${{k2>0?(.6+.4*back(k2)):.6}})`;e2.querySelector('.payin').style.setProperty('--shx',(-160+1000*eio(p(t,21.0,21.9)))+'px');
 }}
 txt('cta',t,21.4,22.2,14);
 const pul=t>22.2?(.5+.5*Math.sin((t-22.2)*3.2)):0;$('cta').style.boxShadow=`0 0 ${{18+22*pul}}px rgba(231,200,120,${{.18+.25*pul}})`;
 if(document.body.classList.contains('poster')){{$('sub').style.opacity=1;$('hook').style.opacity=0;
   [1,6,13].forEach((ix,j)=>{{const d=others[ix];const a=[96,78,104][j];d.style.transform=`rotateY(${{-a}}deg)`;d.querySelector('.df').style.filter=`brightness(${{1-.38*Math.sin(a*Math.PI/180)}})`;const c=d.parentElement;c.querySelector('.glow').style.opacity=1;c.querySelector('.ico').style.opacity=1;}});
   $('cta').style.boxShadow='0 0 26px rgba(231,200,120,.28)';}}
}};
</script></body></html>'''
open(sp+'/r3d/scene.html','w').write(html)
print('ok', round(dw,1), round(dh,1))
