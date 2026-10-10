import sys, random, math
sp,F=sys.argv[1],sys.argv[2]
EMB='<svg viewBox="0 0 60 60"><path d="M30 4C37 13 37 24 30 31 23 24 23 13 30 4Z"/><path d="M29 31C21 30 13 22 11 11 21 12 28 21 29 31Z"/><path d="M31 31C39 30 47 22 49 11 39 12 32 21 31 31Z"/><path d="M29 37C21 40 11 38 5 29 15 26 24 30 29 37Z"/><path d="M31 37C39 40 49 38 55 29 45 26 36 30 31 37Z"/><path d="M28.6 30h2.8v24h-2.8z"/><path d="M30 54c-4-5-9-6-13-4 4 3 9 4 13 4zm0 0c4-5 9-6 13-4-4 3-9 4-13 4z"/></svg>'
BOX={k:f'file://{sp}/val/box-{k}-c.png' for k in ['petite','amour','prestige']}
WA='<div class="cta"><b>Commandez sur WhatsApp</b><span>+229 01 97 17 64 59</span></div>'
def petals(W,H,seed,n=26,avoid=None):
    r=random.Random(seed); out=''
    for i in range(n):
        x=r.uniform(-20,W+20); y=r.uniform(-20,H+20)
        s=r.uniform(.5,1.6); rot=r.uniform(0,360); blur=r.choice([0,0,0,1.5,3]); op=r.uniform(.55,.95)
        if 150<x<W-150 and 130<y<H-130:
            s*=.55; blur=4; op*=.35
        col=r.choice(['#c9283f','#a3172f','#e04a5f','#8e1027','#d33a52'])
        out+=(f'<svg class="pt" style="left:{x:.0f}px;top:{y:.0f}px;width:{60*s:.0f}px;height:{50*s:.0f}px;transform:rotate({rot:.0f}deg);filter:blur({blur}px);opacity:{op:.2f}" viewBox="0 0 60 50">'
              f'<path d="M4 30 C6 10 30 0 46 6 C58 11 58 30 46 40 C34 50 10 46 4 30Z" fill="{col}"/>'
              f'<path d="M10 28 C16 14 32 8 44 12" stroke="#fff" stroke-opacity=".18" stroke-width="2" fill="none"/></svg>')
    return out
def dust(W,H,seed,n=70):
    r=random.Random(seed); return ''.join(f'<i class="du" style="left:{r.uniform(0,W):.0f}px;top:{r.uniform(0,H):.0f}px;width:{r.uniform(2,5):.1f}px;height:{r.uniform(2,5):.1f}px;opacity:{r.uniform(.25,.8):.2f}"></i>' for _ in range(n))
def head(W,H):
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:GV;src:url(file://{sp}/fonts/GreatVibes-Regular.ttf)}}
@font-face{{font-family:CG;font-weight:300 700;src:url(file://{sp}/fonts/Cormorant.ttf)}}
@font-face{{font-family:IS;font-style:italic;src:url(file://{F}/InstrumentSerif-Italic.ttf)}}
@font-face{{font-family:SANS;src:url(file://{F}/InstrumentSans-Regular.ttf)}}
@font-face{{font-family:SANS;font-weight:700;src:url(file://{F}/InstrumentSans-Bold.ttf)}}
*{{box-sizing:border-box;margin:0;padding:0;font-variant-numeric:lining-nums!important;font-feature-settings:'lnum' 1!important}}
html,body{{width:{W}px;height:{H}px;overflow:hidden}}
.p{{position:relative;width:{W}px;height:{H}px;overflow:hidden;color:#fff;text-align:center;
 background:radial-gradient(70% 50% at 50% 56%,#7a1a33 0%,#521024 45%,#2c0812 100%)}}
.halo{{position:absolute;left:50%;width:1100px;height:1100px;margin-left:-550px;border-radius:50%;background:radial-gradient(circle,rgba(255,196,190,.30),rgba(255,160,170,.08) 40%,rgba(0,0,0,0) 65%)}}
.pt{{position:absolute}} .du{{position:absolute;border-radius:50%;background:#f3d79a;box-shadow:0 0 6px #f3d79a}}
.f1{{position:absolute;inset:38px;border:1px solid rgba(226,194,122,.6)}}.f2{{position:absolute;inset:47px;border:1px solid rgba(226,194,122,.3)}}
.top{{position:absolute;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:10px}}
.top svg{{width:42px;height:42px;fill:#e2c27a}} .top b{{font:600 22px/1 CG;letter-spacing:.36em;padding-left:.36em}}
.kick{{position:absolute;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:18px;font:700 17px/1 SANS;letter-spacing:.3em}}
.kick i{{width:60px;height:1px;background:rgba(226,194,122,.7)}}
.script{{position:absolute;left:0;right:0;font:400 132px/1.1 GV;color:#fbe9e4;text-shadow:0 6px 34px rgba(0,0,0,.45)}}
.caps{{position:absolute;left:0;right:0;font:600 32px/1 CG;letter-spacing:.32em;padding-left:.32em}}
.lead{{position:absolute;left:90px;right:90px;font:italic 34px/1.3 IS}}
img.bx{{position:absolute;filter:drop-shadow(0 26px 30px rgba(10,0,4,.45))}}
.lab{{position:absolute;text-align:center}}
.lab b{{display:block;font:700 22px/1.2 SANS;letter-spacing:.14em}}
.lab em{{display:block;margin-top:6px;font:italic 26px/1.1 IS;color:#f6dcd6}}
.lab strong{{display:block;margin-top:10px;font:500 52px/1 CG}} .lab strong small{{font:700 17px/1 SANS;letter-spacing:.2em;margin-left:6px;vertical-align:12px}}
.feat{{position:absolute;left:110px;right:110px;display:grid;grid-template-columns:1fr 1fr;gap:18px 30px;text-align:left}}
.feat p{{display:flex;align-items:center;gap:14px;font:600 30px/1.2 CG}} .feat p::before{{content:"♥";color:#e2c27a;font-size:22px}}
.price{{position:absolute;left:0;right:0;font:500 76px/1 CG}} .price small{{font:700 20px/1 SANS;letter-spacing:.2em;margin-left:10px;vertical-align:22px}}
.perks{{position:absolute;left:70px;right:70px;display:flex;justify-content:center;gap:16px}}
.perks span{{padding:12px 18px;border:1px solid rgba(226,194,122,.6);border-radius:40px;font:700 17px/1 SANS;letter-spacing:.06em;background:rgba(30,4,10,.35)}}
.cta{{position:absolute;left:50%;width:700px;margin-left:-350px;padding:20px 0 18px;border:1px solid rgba(226,194,122,.8);background:rgba(25,3,9,.45);box-shadow:0 0 30px rgba(240,190,170,.25)}}
.cta b{{display:block;font:700 20px/1 SANS;letter-spacing:.12em;text-transform:uppercase}}
.cta span{{display:block;margin-top:10px;font:500 40px/1 CG;letter-spacing:.06em}}
.hint{{position:absolute;left:0;right:0;font:italic 34px/1 IS}}
</style></head><body><div class="p">'''
END='<div class="f1"></div><div class="f2"></div></div></body></html>'
def top(y): return f'<div class="top" style="top:{y}px">{EMB}<b>COTONOU BOX</b></div>'

INFO={
 'petite':dict(name='Petite Attention',sub='Pour dire « je pense à toi »',price='15 000',feat=['Une douceur','Un mini soin','Une bougie','Une carte écrite à la main']),
 'amour':dict(name='Coffret Amour',sub='Pour elle ou pour lui',price='25 000',feat=['Des douceurs','Un soin de grande maison','Une création artisanale','Une carte écrite à la main']),
 'prestige':dict(name='Coffret Prestige',sub='Le grand geste',price='45 000',feat=['Un coffret de soins de luxe','Un parfum','Un bijou d’artisan','Des douceurs fines']),
}
pages={}
# ---------- Collection 4:5 ----------
W,H=1080,1350
c=head(W,H)+f'<div class="halo" style="top:420px"></div>'+petals(W,H,3,30)+dust(W,H,4)+top(80)
c+='<p class="kick" style="top:178px"><i></i>14 FÉVRIER 2027<i></i></p>'
c+='<div class="script" style="top:196px">Saint-Valentin</div>'
c+='<div class="caps" style="top:356px">LES COFFRETS D’AMOUR</div>'
c+=f'<img class="bx" src="{BOX["petite"]}" style="left:70px;top:612px;width:280px">'
c+=f'<img class="bx" src="{BOX["prestige"]}" style="left:640px;top:455px;width:390px">'
c+=f'<img class="bx" src="{BOX["amour"]}" style="left:335px;top:520px;width:370px">'
for k,x,w in [('petite',60,300),('amour',380,320),('prestige',720,300)]:
    i=INFO[k]; c+=f'<div class="lab" style="left:{x}px;width:{w}px;top:928px"><b>{i["name"].upper()}</b><em>{i["sub"]}</em><strong>{i["price"]}<small>FCFA</small></strong></div>'
c+='<div class="perks" style="top:1112px"><span>Carte manuscrite offerte</span><span>Livraison le 14 février</span><span>Commande depuis l’étranger</span></div>'
c+=WA.replace('class="cta"','class="cta" style="top:1176px"')+END
pages['collection']=c
# ---------- un coffret 4:5 ----------
def single(k,W,H,story=False):
    i=INFO[k]; o=0 if not story else 250
    c=head(W,H)+f'<div class="halo" style="top:{360+o}px"></div>'+petals(W,H,hash(k)%97,30)+dust(W,H,hash(k)%89)+top(80+o*.5)
    c+=f'<p class="kick" style="top:{176+o*.5:.0f}px"><i></i>SAINT-VALENTIN · 14 FÉVRIER<i></i></p>'
    c+=f'<div class="script" style="top:{196+o*.6:.0f}px;font-size:120px">{i["name"]}</div>'
    c+=f'<p class="lead" style="top:{350+o*.6:.0f}px">{i["sub"]}</p>'
    bw={'petite':400,'amour':470,'prestige':520}[k]
    c+=f'<img class="bx" src="{BOX[k]}" style="left:{(W-bw)/2:.0f}px;top:{420+o*.7:.0f}px;width:{bw}px">'
    fy=900+o*1.05
    c+=f'<div class="feat" style="top:{fy:.0f}px">'+''.join(f'<p>{t}</p>' for t in i['feat'])+'</div>'
    c+=f'<p class="price" style="top:{fy+112:.0f}px">{i["price"]}<small>FCFA</small></p>'
    c+=WA.replace('class="cta"',f'class="cta" style="top:{fy+214:.0f}px"')
    if story: c+=f'<p class="hint" style="top:{H-210}px">Répondez à cette story ♥</p>'
    return c+END
for k in INFO:
    pages[k]=single(k,1080,1350)

# ---------- collection story ----------
W,H=1080,1920
def storify(html,seed):
    h=html.replace('width:1080px;height:1350px','width:1080px;height:1920px').replace('html,body{width:1080px;height:1350px}','html,body{width:1080px;height:1920px}')
    h=h.replace('<div class="p">','<div class="p">'+petals(1080,1920,seed,22)+'<div style="position:absolute;left:0;top:262px;width:1080px;height:1350px;transform:scale(1.02);transform-origin:50% 0">',1)
    return h.replace('<div class="f1"></div><div class="f2"></div></div></body>','</div><p class="hint" style="top:1690px">Répondez à cette story ♥</p><div class="f1"></div><div class="f2"></div></div></body>')
for k in list(INFO):
    pages[k+'-story']=storify(pages[k],len(k)*7)
pages['collection-story']=storify(pages['collection'],5)
s=pages['collection'].replace('width:1080px;height:1350px','width:1080px;height:1920px')
_old=s.replace('<div class="p">','<div class="p"><div style="position:absolute;left:0;top:260px;width:1080px;height:1350px">',1).replace('<div class="f1"></div><div class="f2"></div></div></body>','</div><p class="hint" style="top:1700px">Répondez à cette story ♥</p><div class="f1"></div><div class="f2"></div></div></body>')
for k,v in pages.items(): open(f'{sp}/val/{k}.html','w').write(v)
print(list(pages))
