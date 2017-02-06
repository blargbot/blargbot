const Manager = require('./Manager.js');

class CommandManager extends Manager {

    constructor() {
        super('dcommands');
    }

    init() {
        this.commandList = {};
        super.init();
    }

    load(name) {
        if (super.load(name)) {
            if (this.list.hasOwnProperty(name) && this.list[name].isCommand) {
                this.build(name);
                return true;
            } else {
                logger.init('     Skipping non-command ', name + '.js');
                delete this.list[name];
            }
        }
        return false;
    }

    reload(name) {
        if (super.reload(name)) {
            if (this.list[name].isCommand) {
                this.build(name);
                return true;
            } else {
                logger.init('     Skipping non-command ', name + '.js');
                delete this.list[name];
            }
        }
        return false;
    }

    unload(name) {
        if (this.list[name]) {
            logger.init(`${1 < 10 ? ' ' : ''}${1}.`, 'Unloading command module ', name);

            if (this.list[name].sub) {
                for (var subCommand in this.list[name].sub) {
                    logger.init(`    Unloading ${name}'s subcommand`, subCommand);
                    delete this.commandList[subCommand];
                }
            }
            delete this.commandList[name];
            if (this.list[name].alias) {
                for (var ii = 0; ii < this.list[name].alias.length; ii++) {
                    logger.init(`    Unloading ${name}'s alias`, this.list[name].alias[ii]);
                    delete this.commandList[this.list[name].alias[ii]];
                }
            }
        }
        return super.unload(name);
    }

    build(name) {
        try {
            this.list[name].init();
            var command = {
                name: name,
                usage: this.list[name].usage,
                info: this.list[name].info,
                hidden: this.list[name].hidden,
                category: this.list[name].category
            };
            if (this.list[name].sub) {
                for (var subCommand in this.list[name].sub) {
                    logger.init(`    Loading ${name}'s subcommand`, subCommand);

                    this.commandList[subCommand] = {
                        name: name,
                        usage: this.list[name].sub[subCommand].usage,
                        info: this.list[name].sub[subCommand].info,
                        hidden: this.list[name].hidden,
                        category: this.list[name].category
                    };
                }
            }
            this.commandList[name] = command;
            if (this.list[name].alias) {
                for (var ii = 0; ii < this.list[name].alias.length; ii++) {
                    logger.init(`    Loading ${name}'s alias`, this.list[name].alias[ii]);
                    this.commandList[this.list[name].alias[ii]] = command;
                }
            }
        } catch (err) {
            logger.error(err);
        }
    }
}

module.exports = CommandManager;