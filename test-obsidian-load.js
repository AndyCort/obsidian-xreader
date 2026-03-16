const fs = require('fs');
const code = fs.readFileSync('main.js', 'utf8');

const _module = { exports: {} };
const fn = new Function('module', 'exports', 'require', code);
fn(_module, _module.exports, function(req) {
  if (req === 'obsidian') return { Plugin: class {}, ItemView: class {}, PluginSettingTab: class {}, Setting: class {} };
  return require(req);
});

console.log(_module.exports);
if (typeof _module.exports === 'function' || typeof _module.exports.default === 'function') {
   console.log("Looks good to Obsidian");
} else {
   console.log("NOT GOOD");
}
