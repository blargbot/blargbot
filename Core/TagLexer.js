const chevrotain = _dep.chevrotain;
const Lexer = chevrotain.Lexer;
function createToken(name, pattern) {
    return chevrotain.createToken({name, pattern});
}

class TagLexer {
    constructor() {

        this.tokens = {
            TagOpen: createToken('TagOpen', /\{/),
            TagClose: createToken('TagClose', /\}/),
            ArgumentSeparator: createToken('ArgumentSeparator', /;/)
        };
        this.SelectLexer = new Lexer([this.tokens.TagOpen, this.tokens.TagClose, this.tokens.ArgumentSeparator]);
    }



}

module.exports = TagLexer;