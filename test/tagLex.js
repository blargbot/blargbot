const TagLexer = require('../Core/TagLexer');

const tagLexer = new TagLexer();
try {
//let tokens = tagLexer.parse(`one {two;three} {four; \n five;six {seven;eight {nine}}}`);
let tokens = tagLexer.parse(`\\{me\\ow\\}`);

console.dir(tokens, { depth: 10 });
console.log(tokens[3].serialize());

} catch (err) {
    console.error(err.key);
}