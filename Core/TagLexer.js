const chevrotain = _dep.chevrotain;
const Lexer = chevrotain.Lexer;
function createToken(name, pattern) {
    let token = chevrotain.createToken({ name, pattern });
    return token;
}

class TagLexer {
    constructor() {
        this.tokens = {
            TagOpen: createToken('TagOpen', /\{/),
            TagClose: createToken('TagClose', /\}/),
            ArgumentSeparator: createToken('ArgumentSeparator', /;/),
            Text: createToken('Text', /[^\{\};]*/)
        };
        this.SelectLexer = new Lexer(Object.values(this.tokens));
    }

    tokenize(input) {
        return this.SelectLexer.tokenize(input);
    }

    parse(input) {
        let lexed = this.tokenize(input);
        let tokens = lexed.tokens;
        const tokenNames = Object.keys(this.tokens);
        for (let token of tokens) {
            token.name = tokenNames[token.tokenType - 2];
        }
        return tokens;
    }
}

module.exports = TagLexer;