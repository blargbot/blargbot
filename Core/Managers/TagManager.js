const Manager = require('./Manager');
const { Base } = require('../Structures/Tag');

class TagManager extends Manager {
    constructor(client) {
        super(client, 'Tags', Base);

        this.tagMap = {};
    }

    unload(name) {
        if (this.builtList[name].aliases.length > 0) {
            for (const alias of this.builtList[name].aliases) {
                delete this.builtList[alias];
            }
        }
        super.unload(name);
    }

    build(name) {
        if (super.build(name)) {
            this.tagMap[this.builtList[name].name] = this.builtList[name];
        }
    }

    async execute(name, ctx, args) {
        const tag = this.tagMap[name];
        if (tag !== undefined) {
            return await tag.execute(ctx, args);
        } else throw new Error('aaaaaa');
    }

    has(name) {
        return this.tagMap.hasOwnProperty(name);
    }
}

module.exports = TagManager;