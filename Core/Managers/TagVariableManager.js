const Manager = require('./Manager');
const { TagVariable, TagArray } = require('../Tag');

class TagVariableManager extends Manager {
    constructor(client) {
        super(client, 'TagVariables', TagVariable);

        this.prefixMap = {};
    }

    async build(...names) {
        let name = names[names.length - 1];
        if (super.build(name)) {
            const source = this.builtList[name];
            this.prefixMap[source.prefix] = source;
        }
    }

    async executeGet(ctx, name) {
        if (Array.isArray(name)) name = name.join('');
        const prefix = name[0].toLowerCase();
        let variable;
        if (this.prefixMap.hasOwnProperty(prefix)) {
            variable = await this.prefixMap[prefix].get(ctx, name.substring(1));
        } else {
            variable = await this.prefixMap[false].get(ctx, name);
        }
        if (Array.isArray(variable)) {

        }
        return variable;
    }

    async executeSet(ctx, name, value) {
        if (Array.isArray(name)) name = name.join('');
        if (Array.isArray(value) && !(value instanceof TagArray)) {
            if (value.length === 1 && value[0] instanceof TagArray) {
                value = value[0];
            } else value = value.join('');
        }
        const prefix = name[0].toLowerCase();
        if (this.prefixMap.hasOwnProperty(prefix)) {
            return await this.prefixMap[prefix].set(ctx, name.substring(1), value);
        } else {
            return await this.prefixMap[false].set(ctx, name, value);
        }
    }

}

module.exports = TagVariableManager;