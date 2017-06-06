const { TagVariable } = require('../../Core/Structures');

class AuthorVariable extends TagVariable {

    get prefix() {
        return '@';
    }

    async _tagGet(ctx, name) {
        return await this.client.getDataUser(ctx.author).getVariable(name);
    }

    async _tagSet(ctx, name, value) {
        return await this.client.getDataUser(ctx.author).setVariable(name, value);
    }

}

module.exports = AuthorVariable;