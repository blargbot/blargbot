class Manager {

    constructor(type) {
        this.list = {};
        this.type = type;
        this.init();
    }

    init() {
        var fileArray = dep.fs.readdirSync(dep.path.join(__dirname, this.type));
        for (var i = 0; i < fileArray.length; i++) {
            var file = fileArray[i];
            if (/.+\.js$/.test(file)) {
                var name = file.match(/(.+)\.js$/)[1];
                this.load(name);
                logger.init(`${i < 10 ? ' ' : ''}${i}.`, 'Loading ' + this.type + ' module ', name);
            } else {
                logger.init('     Skipping non-script ', file);
            }
        }
    }

    load(name) {
        try {
            const mod = require(this.constructPath(name));
            this.list[name] = mod;
        } catch (err) {
            logger.error(err);
            logger.init('Failed to load ' + this.type + ' ' + name);
        }
    }

    unload(name) {
        if (this.list.hasOwnProperty(name)) {
            delete this.list[name];
            logger.init('Unloaded ' + this.type + ' ' + name);
            return true;
        }
        return false;
    }

    reload(name) {
        try {
            if (this.list.hasOwnProperty(name)) {
                this.list[name] = dep.reload(this.constructPath(name));
                return true;
            } else {
                return false;
            }
        } catch (err) {
            logger.error(err);
            return false;
        }
    }

    constructPath(eventName) {
        return './' + this.type + '/' + eventName;
    }
}

module.exports = Manager;