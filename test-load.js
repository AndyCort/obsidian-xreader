const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (path) {
  if (path === 'obsidian') return { Plugin: class { }, ItemView: class { }, PluginSettingTab: class { }, Setting: class { } };
  if (path === 'electron' || path.startsWith('@codemirror') || path.startsWith('@lezer')) return {};
  return originalRequire.apply(this, arguments);
};
try {
  let m = require('./main.js');
  console.log("Loaded successfully!", Object.keys(m));
  if (m.default) {
    console.log("Has default export");
  } else {
    console.log("No default export found!");
  }
} catch (e) {
  console.error("Load failed with error:", e);
}
