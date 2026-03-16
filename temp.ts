
import ePub from "epubjs";
console.log("EPUB IS:", typeof ePub);
if (typeof ePub !== 'function') console.log("EPUB KEYS:", Object.keys(ePub || {}));
