// Escribe dist/version.json con un id de build único.
// El front lo consulta cada tanto; si cambia respecto al de carga, ofrece recargar.
import { writeFileSync } from 'node:fs';

const version = String(Date.now());
writeFileSync('dist/version.json', JSON.stringify({ v: version }) + '\n');
console.log('[version] dist/version.json →', version);
