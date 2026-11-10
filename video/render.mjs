// Genera el tutorial en sus dos formatos y lo deja listo en ../public/video.
// Uso: npm run render   (requiere ffmpeg en el PATH)
//   horizontal 1920×1080 → tutorial.mp4          + tutorial-poster.jpg
//   vertical   1080×1920 → tutorial-vertical.mp4 + tutorial-vertical-poster.jpg
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// La caché de Hyperframes (su Chrome, ~300 MB, y las fuentes) se queda dentro del proyecto, no en el perfil de usuario.
const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: "1", HYPERFRAMES_CACHE_DIR: fileURLToPath(new URL("./.cache", import.meta.url)) };
const run = (cmd) => execSync(cmd, { stdio: "inherit", env });
const must = (html, from, to) => {
  if (!html.includes(from)) throw new Error(`index.html ya no contiene: ${from}`);
  return html.replace(from, to);
};

run("node make-audio.mjs");

// vertical.html = index.html con el lienzo girado; el resto lo hacen las reglas .portrait
let v = readFileSync("index.html", "utf8");
v = must(v, '<html lang="es">', '<html lang="es" class="portrait">');
v = must(v, 'content="width=1920, height=1080"', 'content="width=1080, height=1920"');
v = must(v, 'data-width="1920" data-height="1080"', 'data-width="1080" data-height="1920"');
writeFileSync("vertical.html", v);

const OUT = "../public/video";
for (const [comp, name] of [[".", "tutorial"], ["vertical.html", "tutorial-vertical"]]) {
  run(`hyperframes render -c ${comp} -o renders/${name}.mp4 --fps 30 --crf 20 --quiet`);
  // recodificado ligero para web, con el índice al principio para que empiece a reproducir antes
  run(`ffmpeg -hide_banner -loglevel error -y -i renders/${name}.mp4 -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart ${OUT}/${name}.mp4`);
  run(`ffmpeg -hide_banner -loglevel error -y -ss 9.2 -i renders/${name}.mp4 -frames:v 1 -q:v 3 ${OUT}/${name}-poster.jpg`);
}
