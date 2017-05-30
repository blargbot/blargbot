const Manager = require('./Manager');
const Base = require('../Structures/Tag');

class TagManager extends Manager {
    constructor(client) {
        super(client, 'Tags', Base);
    }

    unload(name) {
        if (this.builtList[name].aliases.length > 0) {
            for (const alias of this.builtList[name].aliases) {
                delete this.builtList[alias];
            }
        }
        super.unload(name);
    }

    async execute(name, ctx) {
        const tag = this.builtList[name];
        if (tag !== undefined) {
            return await tag.execute(ctx);
        }
    }

    has(name) {
        return this.builtList.hasOwnProperty(name);
    }
}

module.exports = TagManager;