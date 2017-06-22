const Manager = require('./Manager');
const { Base } = require('../Tag/Classes');

class TagManager extends Manager {
    constructor(client) {
        super(client, 'Tags', Base);

        this.tagMap = { _: {} };
    }
    build(...names) {
        let mod = this.modules.get(...names);
        let name = names[names.length - 1];
        let built = new mod(this.client);
        if (built instanceof this.base) {
            console.module(`Built ${this.name} module: ${names.join('/')}`);
            if (!this.tagMap[built.category]) this.tagMap[built.category] = {};
            this.tagMap[built.category][built.name] = built;
            if (built.implicit) {
                this.tagMap._[built.name] = built;
            }

            return true;
        }
        else {
            delete this.builtList[name];
            return false;
        }
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