/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:33:36
 * @Last Modified by: stupid cat
<<<<<<< HEAD:Manager.js
 * @Last Modified time: 2017-12-05 11:54:57
=======
 * @Last Modified time: 2017-12-06 09:47:10
>>>>>>> 955ab76943c20c761c7bf1bb6d97947f055262e4:src/core/Manager.js
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

class Manager {

    constructor(type, removeListeners) {
        this.list = {};
        this.type = type;
        this.removeListeners = removeListeners;
        this.init();
    }

    init() {
        var fileArray = dep.fs.readdirSync(dep.path.join(__dirname, '..', this.type));
        for (var i = 0; i < fileArray.length; i++) {
            var file = fileArray[i];
            if (/.+\.js$/.test(file)) {
                var name = file.match(/(.+)\.js$/)[1];
                this.load(name);
<<<<<<< HEAD:Manager.js
                logger.module(`${i < 10 ? ' ' : ''}${i}.`, 'Loading ' + this.type + ' module ', name);
            } else {
                logger.module('     Skipping non-script ', file);
=======
                console.module(`${i < 10 ? ' ' : ''}${i}.`, 'Loading ' + this.type + ' module ', name);
            } else {
                console.module('     Skipping non-script ', file);
>>>>>>> 955ab76943c20c761c7bf1bb6d97947f055262e4:src/core/Manager.js
            }
        }
    }

    load(name) {
        try {
            if (this.removeListeners)
                bot.removeAllListeners(name);
            const mod = require(this.constructPath(name));
            if (typeof mod.init == 'function') mod.init();
            if (mod.name !== undefined) name = mod.name;
            this.list[name] = mod;
            return true;
        } catch (err) {
<<<<<<< HEAD:Manager.js
            logger.error(err);
            logger.module('Failed to load ' + this.type + ' ' + name);
=======
            console.error(err.stack);
            console.module('Failed to load ' + this.type + ' ' + name);
>>>>>>> 955ab76943c20c761c7bf1bb6d97947f055262e4:src/core/Manager.js
        }
        return false;
    }

    unload(name) {
        if (this.list.hasOwnProperty(name)) {
            if (this.removeListeners)
                bot.removeAllListeners(name);
            delete this.list[name];
<<<<<<< HEAD:Manager.js
            logger.module('Unloaded ' + this.type + ' ' + name);
=======
            console.module('Unloaded ' + this.type + ' ' + name);
>>>>>>> 955ab76943c20c761c7bf1bb6d97947f055262e4:src/core/Manager.js
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