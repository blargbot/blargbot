const Manager = require('./Manager');
const { Base } = require('../Tag/Classes');

class TagManager extends Manager {
    constructor(client) {
        super(client, 'Tags', Base);

        this.tagMap = { _: {} };
    }

    build(name) {
        let temp = new this.list[name](this.client);
        if (temp instanceof this.base) {
            if (!this.tagMap[temp.category]) this.tagMap[temp.category] = {};
            this.tagMap[temp.category][temp.name] = temp;
            if (temp.implicit) {
                this.tagMap._[temp.name] = temp;
            }
        }
        else {
            delete this.list[name];
            delete this.builtList[name];
        }
        //        if (super.build(name)) {
        //            this.tagMap[this.builtList[name].name] = this.builtList[name];
        //        }
    }

    split(name) {
        if (Array.isArray(name)) name = name.join('');
        const parts = name.toLowerCase().split('.');
        if (parts.length == 1) parts.unshift('_');
        return parts;
    }

    async execute(name, ctx, args) {
        const parts = this.split(name);
        const tag = this.tagMap[parts[0]][parts[1]];
        if (tag !== undefined) {
            return await tag.execute(ctx, args);
        } else throw new Error('Tag Not Found');
    }

    has(name) {
        const parts = this.split(name);
        return this.tagMap[parts[0]] && this.tagMap[parts[0]][parts[1]];
    }
}

module.exports = TagManager;