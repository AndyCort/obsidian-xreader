const { build } = require('esbuild');
const fs = require('fs');
fs.writeFileSync('temp.ts', `
import ePub from "epubjs";
console.log("EPUB IS:", typeof ePub);
if (typeof ePub !== 'function') console.log("EPUB KEYS:", Object.keys(ePub || {}));
`);

build({
  entryPoints: ['temp.ts'],
  bundle: true,
  format: 'cjs',
  outfile: 'temp.js'
}).then(() => {
  require('./temp.js');
});
