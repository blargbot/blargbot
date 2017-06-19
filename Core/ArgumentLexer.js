const chevrotain = require('chevrotain');
const Lexer = chevrotain.Lexer;

function createToken(name, pattern, group) {
    let token = chevrotain.createToken({ name, pattern });
    return token;
}

class ArgumentLexer {
    constructor() {
        this.tokens = {
            Escaped: createToken('Escaped', /\\[\\ "]/),
            NewLine: createToken('NewLine', / *\n/),
            Phrase: createToken('Phrase', /".+"/),
            WhiteSpace: createToken('WhiteSpace', / +/),
            Identifier: createToken('Text', /[^ \\]+/)
        };
        this.SelectLexer = new Lexer(Object.values(this.tokens));

        let types = {};
        const tokenNames = Object.keys(this.tokens);
        for (const key of tokenNames) {
            types[key] = this.tokens[key].tokenType;
        }
        this.tokenTypes = types;
    }

    tokenize(input) {
        return this.SelectLexer.tokenize(input);
    }

    parse(input) {
        let lexed = this.tokenize(input);
        let tokens = lexed.tokens;
        const tokenTypes = this.tokenTypes;

        let output = [];
        let rawOutput = [];
        for (const token of tokens) {
            switch (token.tokenType) {
                case tokenTypes.Identifier:
                    output.push(token.image);
                    rawOutput.push(token.image);
                    break;
                case tokenTypes.WhiteSpace:
                    rawOutput[rawOutput.length - 1] += token.image;
                    break;
                case tokenTypes.Escaped:
                    console.debug(token.image);
                    output[output.length - 1] += token.image.substring(1);
                    rawOutput[rawOutput.length - 1] += token.image;
                    break;
                case tokenTypes.NewLine:
                    output[output.length - 1] += '\n';
                    rawOutput[rawOutput.length - 1] += '\n';
                case tokenTypes.Phrase:
                    output.push(token.image.substring(1, token.image.lastIndexOf('"')));
                    rawOutput.push(token.image);
                    break;
            }
        }
        return { output, rawOutput };
    }
}

module.exports = ArgumentLexer;