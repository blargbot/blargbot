/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:28:41
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-07 09:51:34
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

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
                console.module('     Skipping non-command ', name + '.js');
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
                console.module('     Skipping non-command ', name + '.js');
                delete this.list[name];
            }
        }
        return false;
    }

    unload(name) {
        if (this.list[name]) {
            console.module(`${1 < 10 ? ' ' : ''}${1}.`, 'Unloading command module ', name);

            if (this.list[name].sub) {
                for (var subCommand in this.list[name].sub) {
                    console.module(`    Unloading ${name}'s subcommand`, subCommand);
                    delete this.commandList[subCommand];
                }
            }
            delete this.commandList[name];
            if (this.list[name].alias) {
                for (var ii = 0; ii < this.list[name].alias.length; ii++) {
                    console.module(`    Unloading ${name}'s alias`, this.list[name].alias[ii]);
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
                    console.module(`    Loading ${name}'s subcommand`, subCommand);

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
                    console.module(`    Loading ${name}'s alias`, this.list[name].alias[ii]);
                    this.commandList[this.list[name].alias[ii]] = command;
                }
            }
        } catch (err) {
            console.error(err);
        }
    }
}

module.exports = CommandManager;