const fs = require('fs');
const ePub = require('epubjs').default;

const buf = fs.readFileSync('sample.epub');
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const book = ePub(arrayBuffer);
book.ready.then(() => {
   console.log("EPUB loaded successfully in Node!");
   console.log("Title:", book.packaging.metadata.title);
}).catch(e => {
   console.error("Failed:", e);
});
