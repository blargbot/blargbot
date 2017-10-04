const TagLexer = require('../Core/Tag/TagLexer');
const TagArray = require('../Core/Tag/TagArray');

const tagLexer = new TagLexer();

function LexInput(input) {
    try {
        let tokens = tagLexer.parse(input);

        console.dir(tokens, { depth: 15 });
        console.log('Serialized: ', tokens.join(''));

    } catch (err) {
        if (err.key)
            console.error(err.key);
        else console.error(err);
    }

}

LexInput(`one {two;three} {four; \n five;six {seven;eight {nine;[1;2;[3;4];{ten;elevent} 5;6]}}}`);
LexInput(`[1;2;[3;4;5];6]`);
LexInput(`{math.randint!var{userid}={*min;1}{*max;10}}`);
LexInput(`one {two;three! four}`);