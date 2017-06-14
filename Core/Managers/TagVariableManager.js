const Manager = require('./Manager');
const { TagVariable } = require('../Tag');

class TagVariableManager extends Manager {
    constructor(client) {
        super(client, 'TagVariables', TagVariable);

        this.prefixMap = {};
    }

    async build(name) {
        if (super.build(name)) {
            const source = this.builtList[name];
            this.prefixMap[source.prefix] = source;
        }
    }

    async executeGet(ctx, name) {
        const prefix = name[0].toLowerCase();
        if (this.prefixMap.hasOwnProperty(prefix)) {
            return await this.prefixMap[prefix].get(ctx, name.substring(1));
        } else {
            return await this.prefixMap[false].get(ctx, name);
        }
    }

    async executeSet(ctx, name, value) {
        const prefix = name[0].toLowerCase();
        if (this.prefixMap.hasOwnProperty(prefix)) {
            return await this.prefixMap[prefix].set(ctx, name.substring(1), value);
        } else {
            return await this.prefixMap[false].set(ctx, name, value);
        }
    }

}

module.exports = TagVariableManager;