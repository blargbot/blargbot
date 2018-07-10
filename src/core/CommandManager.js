/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:28:41
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-07 11:15:50
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const BaseCommand = require('../structures/BaseCommand');

const Manager = require('./Manager.js');

class CommandManager extends Manager {

    constructor() {
        super('dcommands');
    }

    init() {
        this.commandList = {};
        this.built = {};
        super.init();
    }

    load(name) {
        if (super.load(name)) {
            if (this.list.hasOwnProperty(name) && this.list[name].prototype instanceof BaseCommand) {
                this.build(name);
                return true;
            } else {
                this.log('', 'Skipping non-command', name + '.js');
                delete this.list[name];
            }
        }
        return false;
    }

    reload(name) {
        if (super.reload(name)) {
            if (this.list[name].prototype instanceof BaseCommand) {
                this.build(name);
                return true;
            } else {
                this.log('', 'Skipping non-command', name + '.js');
                delete this.list[name];
            }
        }
        return false;
    }

    unload(name) {
        if (this.list[name]) {
            this.log('', 'Unloading command module', name);

            if (this.list[name].sub) {
                for (var subCommand in this.list[name].sub) {
                    this.log('', `Unloading ${name}'s subcommand`, subCommand);
                    delete this.commandList[subCommand];
                }
            }
            delete this.commandList[name];
            if (this.list[name].alias) {
                for (var ii = 0; ii < this.list[name].alias.length; ii++) {
                    this.log('', `Unloading ${name}'s alias`, this.list[name].alias[ii]);
                    delete this.commandList[this.list[name].alias[ii]];
                }
            }
        }
        return super.unload(name);
    }

    build(name) {
        try {
            this.built[name] = new this.list[name]();
            var command = {
                name: name,
                usage: this.built[name].usage,
                onlyOn: this.built[name].onlyOn,
                info: this.built[name].info,
                hidden: this.built[name].hidden,
                category: this.built[name].category
            };
            if (this.built[name].sub) {
                for (var subCommand in this.built[name].sub) {
                    this.log('', `Loading ${name}'s subcommand`, subCommand);

                    this.commandList[subCommand] = {
                        name: name,
                        usage: this.built[name].sub[subCommand].usage,
                        info: this.built[name].sub[subCommand].info,
                        hidden: this.built[name].hidden,
                        category: this.built[name].category
                    };
                }
            }
            this.commandList[name] = command;
            if (this.built[name].aliases) {
                for (var ii = 0; ii < this.built[name].aliases.length; ii++) {
                    this.log('', `Loading ${name}'s alias`, this.built[name].aliases[ii]);
                    this.commandList[this.built[name].aliases[ii]] = command;
                }
            }
        } catch (err) {
            console.error(err);
        }
    }
}

module.exports = CommandManager;