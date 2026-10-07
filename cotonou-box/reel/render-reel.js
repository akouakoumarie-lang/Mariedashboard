const { chromium } = require('playwright');
const { spawn } = require('child_process');
(async () => {
  const [html, out, fps, dur, stillAt, still] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1080,height:1920}});
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://'+html); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(300);
  if (still) { await p.evaluate(t=>setT(t), +stillAt); await p.screenshot({path: still}); }
  if (out==='-') { await b.close(); return; }
  const ff = spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',fps,'-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-preset','slow','-crf','17','-movflags','+faststart',out]);
  ff.stderr.on('data',d=>process.stderr.write(d));
  const N=Math.round(+fps*+dur);
  for (let f=0; f<N; f++) {
    await p.evaluate(t=>setT(t), f/+fps);
    const buf = await p.screenshot({type:'jpeg', quality:95});
    if (!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r));
  }
  ff.stdin.end(); await new Promise(r=>ff.on('close',r)); await b.close();
})();
