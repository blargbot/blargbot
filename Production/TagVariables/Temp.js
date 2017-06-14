const { TagVariable } = require('../../Core/Tag');

class TempVariable extends TagVariable {

    async _tagGet(ctx, name) {
        return ctx.vars[name];
    }

    async _tagSet(ctx, name, value) {
        ctx.vars[name] = value;
    }

}

module.exports = TempVariable;