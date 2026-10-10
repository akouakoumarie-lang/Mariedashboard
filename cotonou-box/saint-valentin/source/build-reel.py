import sys, re, types
sp,F=sys.argv[1],sys.argv[2]
src=open(f'{sp}/val/box.py').read().split("for name,(sc,W,H,D,lift)")[0]
mod={}; exec(src.replace("sp=sys.argv[1]",f"sp={sp!r}"),mod)
page=mod['page']
SPECS={'petite':('rose',250,130,190,58),'amour':('bordeaux',320,170,240,70),'prestige':('vert',400,210,290,82)}
css_all=''; boxes={}
for name,(sc,W,H,D,lift) in SPECS.items():
    h=page(sc,W,H,D,lift)
    css=re.search(r'<style>(.*)</style>',h,re.S).group(1)
    body=re.search(r'<body>(.*)</body>',h,re.S).group(1)
    css=css.replace(f'translateY({-H-lift}px) rotateZ(-4deg) rotateX(6deg)',
                    f'translateY(calc({-H}px - var(--lift)*{lift}px)) rotateZ(calc(var(--op)*-4deg)) rotateX(calc(var(--op)*6deg))')
    assert 'var(--lift)' in css
    out=''
    for m in re.finditer(r'(@font-face\s*\{[^{}]*\})|([^{}@]+)\{([^{}]*)\}',css):
        if m.group(1): continue
        sel,decl=m.group(2).strip(),m.group(3)
        if sel.startswith('*') or sel.startswith('html'): continue
        sel=', '.join(f'.b-{name} {x.strip()}' for x in sel.split(','))
        out+=f'{sel}{{{decl}}}\n'
    css_all+=out
    body=body.replace('id="rb"',f'id="rb-{name}"').replace('url(#rb)',f'url(#rb-{name})').replace('id="sg"',f'id="sg-{name}"').replace('url(#sg)',f'url(#sg-{name})')
    boxes[name]=body.replace('<div class="stage">','<div class="stage" style="left:0;top:0">',1)
EMB=mod['EMB']
html=f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:GV;src:url(file://{sp}/fonts/GreatVibes-Regular.ttf)}}
@font-face{{font-family:CG;font-weight:300 700;src:url(file://{sp}/fonts/Cormorant.ttf)}}
@font-face{{font-family:IS;font-style:italic;src:url(file://{F}/InstrumentSerif-Italic.ttf)}}
@font-face{{font-family:SANS;src:url(file://{F}/InstrumentSans-Regular.ttf)}}
@font-face{{font-family:SANS;font-weight:700;src:url(file://{F}/InstrumentSans-Bold.ttf)}}
*{{box-sizing:border-box;margin:0;padding:0;font-variant-numeric:lining-nums!important;font-feature-settings:'lnum' 1!important}}
html,body{{width:1080px;height:1920px;overflow:hidden;background:#2c0812}}
#s{{position:relative;width:1080px;height:1920px;overflow:hidden;color:#fff;text-align:center}}
#bg{{position:absolute;inset:-6%;background:radial-gradient(65% 45% at 50% 52%,#7a1a33 0%,#521024 45%,#2c0812 100%)}}
#halo{{position:absolute;left:50%;top:560px;width:1300px;height:1300px;margin-left:-650px;border-radius:50%;background:radial-gradient(circle,rgba(255,196,190,.32),rgba(255,160,170,.08) 40%,rgba(0,0,0,0) 65%);opacity:0}}
canvas{{position:absolute;inset:0}}
#frame{{position:absolute;inset:0}}
.t{{position:absolute;left:0;right:0;opacity:0}}
#hook{{top:780px;left:80px;right:80px;font:italic 70px/1.2 IS;text-shadow:0 6px 30px rgba(0,0,0,.4)}}
#hook b{{display:block;font:400 54px/1 CG;color:#e2c27a;margin-top:22px}}
#emb{{top:150px}} #emb svg{{width:56px;height:56px;fill:#e2c27a}}
#brand{{top:226px;font:600 25px/1 CG;letter-spacing:.36em;padding-left:.36em}}
#kick{{top:292px;display:flex;justify-content:center;align-items:center;gap:20px;font:700 19px/1 SANS;letter-spacing:.3em}}
#kick i{{width:70px;height:1px;background:rgba(226,194,122,.7)}}
#t1{{top:338px;font:400 168px/1.1 GV;color:#fbe9e4;text-shadow:0 6px 34px rgba(0,0,0,.45)}}
#t2{{top:552px;font:600 38px/1 CG;letter-spacing:.32em;padding-left:.32em}}
.bwrap{{position:absolute;width:0;height:0;opacity:0}}
.bglow{{position:absolute;left:-330px;top:-560px;width:660px;height:660px;border-radius:50%;background:radial-gradient(circle,rgba(255,228,160,.6),rgba(255,210,140,0) 62%);opacity:0}}
.lab{{position:absolute;width:330px;margin-left:-165px;top:1300px;opacity:0}}
.lab b{{display:block;font:700 25px/1.2 SANS;letter-spacing:.12em}}
.lab em{{display:block;margin-top:8px;font:italic 30px/1.1 IS;color:#f6dcd6}}
.lab strong{{display:block;margin-top:14px;font:500 64px/1 CG}} .lab strong small{{font:700 19px/1 SANS;letter-spacing:.2em;margin-left:6px;vertical-align:16px}}
#perks{{top:1530px;display:flex;flex-direction:column;align-items:center;gap:14px;opacity:1}}
#perks span{{opacity:0;padding:14px 26px;border:1px solid rgba(226,194,122,.7);border-radius:40px;font:700 22px/1 SANS;letter-spacing:.06em;background:rgba(30,4,10,.4)}}
#cta{{top:1530px;left:50%;right:auto;width:760px;margin-left:-380px;padding:26px 0 24px;border:1px solid rgba(226,194,122,.85);background:rgba(25,3,9,.5)}}
#cta b{{display:block;font:700 22px/1 SANS;letter-spacing:.12em;text-transform:uppercase}}
#cta span{{display:block;margin-top:14px;font:500 48px/1 CG;letter-spacing:.06em}}
#soon{{top:1700px;font:italic 34px/1 IS;color:#f6dcd6}}
{css_all}
</style></head><body><div id="s">
<div id="bg"></div><div id="halo"></div><canvas id="petals" width="1080" height="1920"></canvas>
<svg id="frame" viewBox="0 0 1080 1920"><rect id="fr1" x="38" y="38" width="1004" height="1844" fill="none" stroke="#e2c27a" stroke-opacity=".6" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/><rect id="fr2" x="47" y="47" width="986" height="1826" fill="none" stroke="#e2c27a" stroke-opacity=".3" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>
<p class="t" id="hook">Et si cette Saint-Valentin<br>avait le goût du Bénin&nbsp;?<b>♥</b></p>
<div class="t" id="emb"><svg viewBox="0 0 60 60">{EMB}</svg></div>
<div class="t" id="brand">COTONOU BOX</div>
<p class="t" id="kick"><i></i>14 FÉVRIER 2027<i></i></p>
<div class="t" id="t1">Saint-Valentin</div>
<div class="t" id="t2">LES COFFRETS D’AMOUR</div>
<div class="bwrap b-petite" id="w-petite" style="left:205px;top:1170px"><div class="bglow"></div>{boxes['petite']}</div>
<div class="bwrap b-prestige" id="w-prestige" style="left:850px;top:1190px"><div class="bglow"></div>{boxes['prestige']}</div>
<div class="bwrap b-amour" id="w-amour" style="left:540px;top:1200px"><div class="bglow"></div>{boxes['amour']}</div>
<canvas id="fx" width="1080" height="1920"></canvas>
<div class="lab" id="l-petite" style="left:205px"><b>PETITE ATTENTION</b><em>Pour dire « je pense à toi »</em><strong>15 000<small>FCFA</small></strong></div>
<div class="lab" id="l-amour" style="left:540px"><b>COFFRET AMOUR</b><em>Pour elle ou pour lui</em><strong>25 000<small>FCFA</small></strong></div>
<div class="lab" id="l-prestige" style="left:858px"><b>COFFRET PRESTIGE</b><em>Le grand geste</em><strong>45 000<small>FCFA</small></strong></div>
<div class="t" id="perks"><span>♥ Carte écrite à la main offerte</span><span>♥ Livraison le 14 février à Cotonou</span><span>♥ Commande possible depuis l’étranger</span></div>
<div class="t" id="cta"><b>Commandez sur WhatsApp</b><span>+229 01 97 17 64 59</span></div>
<p class="t" id="soon">Commandes ouvertes ♥</p>
</div>
<script>
const $=id=>document.getElementById(id);
const cl=x=>Math.max(0,Math.min(1,x)),p=(t,a,b)=>cl((t-a)/(b-a)),eo=x=>1-Math.pow(1-x,3),eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const back=x=>{{const c1=1.7,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);}};
let seed=9;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const PT=Array.from({{length:46}},()=>({{x:rnd()*1080,y:rnd()*1920,s:.5+rnd()*1.2,v:40+rnd()*70,sw:20+rnd()*40,ph:rnd()*6.28,rs:(rnd()-.5)*1.4,c:['#c9283f','#a3172f','#e04a5f','#8e1027','#d33a52'][Math.floor(rnd()*5)],o:.45+rnd()*.5}}));
const DU=Array.from({{length:60}},()=>({{x:rnd()*1080,y:rnd()*1920,r:.8+rnd()*2.2,v:8+rnd()*20,ph:rnd()*6.28}}));
const pc=$('petals').getContext('2d'),fx=$('fx').getContext('2d');
const SP=Array.from({{length:70}},()=>({{a:rnd()*6.283,v:120+rnd()*360,r:1+rnd()*2.6,life:.8+rnd()}}));
function petal(x,y,s,rot,c,o){{pc.save();pc.translate(x,y);pc.rotate(rot);pc.scale(s,s);pc.globalAlpha=o;pc.fillStyle=c;pc.beginPath();pc.moveTo(-26,4);pc.bezierCurveTo(-24,-16,0,-26,16,-20);pc.bezierCurveTo(28,-15,28,4,16,14);pc.bezierCurveTo(4,24,-20,20,-26,4);pc.fill();pc.restore();}}
function txt(id,t,a,b,out,dy=22){{const e=$(id),k=eo(p(t,a,b))*(out?1-eio(p(t,out,out+.6)):1);e.style.opacity=k;e.style.transform=`translateY(${{(1-eo(p(t,a,b)))*dy}}px)`;}}
const BX=[['petite',4.6,7.6],['amour',5.1,8.4],['prestige',5.6,9.2]];
window.setT=function(t){{
 $('bg').style.transform=`scale(${{1+.03*Math.sin(t*.25)}})`;
 pc.clearRect(0,0,1080,1920);
 for(const q of DU){{const y=((q.y-q.v*t)%1920+1920)%1920;pc.globalAlpha=(.35+.35*Math.sin(q.ph+t*1.6))*cl(t/1.2);pc.fillStyle='#f3d79a';pc.beginPath();pc.arc(q.x,y,q.r,0,6.283);pc.fill();}}
 for(const q of PT){{const y=((q.y+q.v*t)%2040+2040)%2040-60;petal(q.x+Math.sin(q.ph+t*.8)*q.sw,y,q.s,q.ph+t*q.rs,q.c,q.o*cl(t/1.0));}}
 pc.globalAlpha=1;
 $('fr1').style.strokeDashoffset=1-eio(p(t,.2,1.8));$('fr2').style.strokeDashoffset=1-eio(p(t,.5,2.1));
 txt('hook',t,.3,1.1,3.0,26);
 txt('emb',t,3.4,4.0,null,12);txt('brand',t,3.6,4.3,null,10);txt('kick',t,3.9,4.6,null,10);
 const k1=eio(p(t,4.1,5.4));$('t1').style.opacity=k1>0?1:0;$('t1').style.clipPath=`inset(-30% ${{(1-k1)*100}}% -30% 0)`;
 txt('t2',t,5.0,5.8,null,10);
 $('halo').style.opacity=eo(p(t,4.4,6.5))*(.85+.15*Math.sin(t*1.2));
 fx.clearRect(0,0,1080,1920);
 for(const [n,ain,aop] of BX){{
   const w=$('w-'+n),k=p(t,ain,ain+1.1),e=k>0?back(k):0;
   const sc={{petite:.78,amour:.8,prestige:.72}}[n];
   w.style.opacity=cl(k*2.2);
   w.style.transform=`translateY(${{(1-Math.min(e,1.05))*260+6*Math.sin(t*1.1+ain)}}px) scale(${{sc*(.85+.15*Math.min(e,1.04))}})`;
   const o=eo(p(t,aop,aop+1.0));
   w.style.setProperty('--lift',(o*1.0).toFixed(3));w.style.setProperty('--op',o.toFixed(3));
   w.querySelector('.rig').style.transform=`rotateX(-24deg) rotateY(${{-34+6*Math.sin(t*.35+ain)}}deg)`;
   w.querySelector('.bglow').style.opacity=o*(.85+.15*Math.sin(t*2+ain));
   const bt=t-aop-.25;
   if(bt>0&&bt<2.2){{const r=w.getBoundingClientRect();const cx=r.left,cy=r.top-120*sc;
     for(const q of SP){{if(bt>q.life)continue;const kk=bt/q.life;const d=q.v*eo(Math.min(1,bt/1.1));fx.fillStyle=`rgba(255,226,150,${{(1-kk)*.9}})`;fx.beginPath();fx.arc(cx+Math.cos(q.a)*d*.8,cy+Math.sin(q.a)*d*.6-bt*40,q.r*(1-kk*.5),0,6.283);fx.fill();}}}}
   txt('l-'+n,t,aop+1.4,aop+2.2,null,16);
 }}
 const ps=document.querySelectorAll('#perks span');
 ps.forEach((s,j)=>{{const a=12.6+j*.7;const k=eo(p(t,a,a+.6))*(1-eio(p(t,18.2,18.8)));s.style.opacity=k;s.style.transform=`translateY(${{(1-eo(p(t,a,a+.6)))*14}}px)`;}});
 txt('cta',t,19.0,19.8,null,16);
 const pul=t>19.8?(.5+.5*Math.sin((t-19.8)*3)):0;$('cta').style.boxShadow=`0 0 ${{20+24*pul}}px rgba(240,190,170,${{.2+.25*pul}})`;
 txt('soon',t,20.2,21.0,null,10);
}};
</script></body></html>'''
open(f'{sp}/vreel/reel.html','w').write(html); print('ok', len(css_all))
