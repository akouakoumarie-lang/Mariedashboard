/**
 * Construit la version web AUTONOME (sans serveur ni compte) dans `dist-web/`.
 *   npm run build:web -w @nutriplan/mobile
 *
 * L'export Expo écrit des chemins absolus (/_expo/…, /assets/…). Pour que le site fonctionne
 * quel que soit son emplacement (racine, sous-dossier GitHub Pages, lecteur claude.ai), on construit
 * avec un préfixe factice, puis on le remplace par le dossier réel de la page, calculé au chargement.
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] ?? 'dist-web';
const MARK = '/__NPBASE__';

rmSync(OUT, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir ${OUT} --clear`, {
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_DATA_MODE: 'local', EXPO_PUBLIC_BASE_URL: MARK, EXPO_OFFLINE: '1' },
});

// Noms de fichiers portables : pas de dossier commençant par « _ » (ignoré par Jekyll/GitHub Pages,
// réservé par certains hébergeurs) ni de crochets dans les noms de morceaux de code.
renameSync(join(OUT, '_expo'), join(OUT, 'np-static'));
renameSync(join(OUT, 'assets/__node_modules'), join(OUT, 'assets/nm'));
const renames = [];
for (const f of readdirSync(join(OUT, 'np-static/static/js/web'))) {
  const clean = f.replace(/[\[\]]/g, '').replace(/^_+/, 'x');
  if (clean !== f) {
    renameSync(join(OUT, 'np-static/static/js/web', f), join(OUT, 'np-static/static/js/web', clean));
    renames.push([f, clean]);
  }
}
const portable = (text) => renames.reduce((t, [a, b]) => t.split(`/static/js/web/${a}`).join(`/static/js/web/${b}`), text.split('/_expo/').join('/np-static/').split('/assets/__node_modules/').join('/assets/nm/'));

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
let replaced = 0;
for (const file of walk(OUT).filter((f) => f.endsWith('.js'))) {
  const src = portable(readFileSync(file, 'utf8'));
  const out = src
    // Dans une chaîne JSON échappée (configuration Expo embarquée) : concaténation dans la chaîne englobante.
    .replace(/\\"\/__NPBASE__([^"\\]*)\\"/g, (_, rest) => (replaced++, `\\""+window.__NPBASE__+"${rest}\\"`))
    // Littéral de chaîne ordinaire : remplacé par une expression.
    .replace(/(?<!\\)"\/__NPBASE__([^"\\]*)"/g, (_, rest) => (replaced++, `(window.__NPBASE__+"${rest}")`));
  if (out.includes(MARK)) throw new Error(`Préfixe non remplacé dans ${file}`);
  writeFileSync(file, out);
  execSync(`node --check ${JSON.stringify(file)}`); // échoue si une substitution a cassé la syntaxe
}

const htmlPath = join(OUT, 'index.html');
let html = portable(readFileSync(htmlPath, 'utf8'));
const scripts = [...html.matchAll(/<script src="\/__NPBASE__([^"]+)" defer><\/script>/g)].map((m) => m[1]);
html = html.replace(/<script src="\/__NPBASE__[^"]+" defer><\/script>/g, '');
if (html.includes(MARK)) throw new Error('Préfixe non remplacé dans index.html');
const loader = `<script>(function(){
  var base = new URL('.', location.href).pathname.replace(/\\/$/, '');
  window.__NPBASE__ = base;
  if (location.pathname !== base + '/') { try { history.replaceState(null, '', base + '/'); } catch (e) {} }
  var files = ${JSON.stringify(scripts)};
  (function next(i){ if (i >= files.length) return; var s = document.createElement('script'); s.src = base + files[i]; s.onload = function(){ next(i + 1); }; document.body.appendChild(s); })(0);
})();</script>`;
html = html.replace('</body>', `${loader}\n</body>`).replace('<html lang="en">', '<html lang="fr">');
writeFileSync(htmlPath, html);
console.log(`Version web prête dans ${OUT}/ (${replaced} chemins rendus relatifs, ${scripts.length} scripts).`);
