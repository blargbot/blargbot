global._dep = require('../Dependencies');

const TagLexer = require('../Core/TagLexer');

const tagLexer = new TagLexer();
let tokens = tagLexer.parse('Hi!{hello;{meow}}         Bye, felicia. {goodbye;meow}');
console.dir(tokens);

for (const token of tokens) {
    console.log(`${token.name} - ${token.image}`);
}