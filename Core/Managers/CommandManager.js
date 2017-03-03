const Manager = require('./Manager');
const {Base} = require('../Structures/Command');

class CommandManager extends Manager {
    constructor() {
        super('Commands', Base);
        this.fullList = {};
    }

    load(name) {
        super.load(name);
    }

    unload(name) {
        if (this.list[name].aliases.length > 0) {
            for (const alias of this.list[name].aliases) {
                delete this.fullList[alias];
            }
        }
        super.unload(name);
    }

    reload(name) {
        super.reload(name);
    }

    build(name) {
        if (super.build(name)) {
            if (this.list[name].aliases.length > 0) {
                for (const alias of this.list[name].aliases) {
                    this.fullList[alias] = this.list[name];
                }
                this.fullList[name] == this.list[name];
            }
        }
    }

    async execute(name, ctx) {
        const command = this.list[name];
        if (command !== undefined) {
            if (command.canExecute(ctx)) {
                try {
                    let response = await command.execute(ctx);
                    if (response !== undefined) {
                        await command.send(response);
                    }
                } catch (err) {
                    // TO-DO
                }
            }
        }
    }
}

module.exports = CommandManager;