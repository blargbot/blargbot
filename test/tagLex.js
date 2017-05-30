const TagLexer = require('../Core/TagLexer');

const tagLexer = new TagLexer();
let tokens = tagLexer.parse(`one {two;three} {four; \n five;six {seven;eight {nine}}}`);


console.dir(tokens, { depth: 10 });
console.log(tokens[3].serialize());