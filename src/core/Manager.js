/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:33:36
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-07 11:15:36
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const path = require('path');

class Manager {

    constructor(type, removeListeners, init = true) {
        this.list = {};
        this.aliases = {};
        this.type = type;
        this.removeListeners = removeListeners;
        if (init)
            this.init();
    }

    init() {
        var fileArray = dep.fs.readdirSync(path.join(__dirname, '..', this.type));
        for (var i = 0; i < fileArray.length; i++) {
            var file = fileArray[i];
            if (/.+\.js$/.test(file)) {
                var name = file.match(/(.+)\.js$/)[1];
                this.load(name);
                console.module(`${i < 10 ? ' ' : ''}${i}.`, 'Loading', this.type, ' module ', name);
            } else {
                console.module('     Skipping non-script ', file);
            }
        }
    }

    get(name) {
        if (!this.list.hasOwnProperty(name))
            name = this.aliases[name] || name;
        if (this.list.hasOwnProperty(name))
            return this.list[name];
        return undefined;
    }

    load(name) {
        try {
            if (this.removeListeners)
                bot.removeAllListeners(name);
            const mod = require(this.constructPath(name));
            if (typeof mod.init == 'function') mod.init();
            else if (!mod.prototype && mod.name !== undefined) name = mod.name;
            this.list[name] = mod;
            for (const alias of mod.aliases || [])
                this.aliases[alias] = name;
            return true;
        } catch (err) {
            console.error(err.stack);
            console.module('Failed to load' + this.type, name);
        }
        return false;
    }

    unload(name) {
        if (!this.list.hasOwnProperty(name))
            name = this.aliases[name] || name;
        if (this.list.hasOwnProperty(name)) {
            let mod = this.list[name];
            if (this.removeListeners)
                bot.removeAllListeners(name);
            delete this.list[name];
            for (const alias of mod.aliases || [])
                delete this.aliases[alias];
            console.module('Unloaded', this.type, name);
            return true;
        }
        return false;
    }

    reload(name) {
        try {
            if (this.list.hasOwnProperty(name)) {
                if (this.removeListeners)
                    bot.removeAllListeners(name);
                this.list[name] = dep.reload(this.constructPath(name));
                if (typeof this.list[name].init == 'function') this.list[name].init();

                return true;
            }
        } catch (err) {
            console.error(err);
        }
        return false;
    }

    constructPath(eventName) {
        return '../' + this.type + '/' + eventName;
    }
}

module.exports = Manager;