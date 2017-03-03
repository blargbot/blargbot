class Manager {
    constructor(name, base) {
        if (this.constructor === Manager) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.name = name;
        this.list = {};
        this.base = base;
    }

    init() {
        var fileArray = dep.fs.readdirSync(dep.path.join(__dirname, this.path));
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
        this.list[name] = require(this.constructPath(name));
        this.build(name);
    }

    unload(name) {
        delete this.list[name];
    }

    reload(name) {
        this.unload(name);
        this.list[name] = _dep.reload(this.constructPath(name));
        this.build(name);
    }

    build(name) {
        if (this.list[name] instanceof this.base)
            return true;
        else {
            delete this.list[name];
            return false;
        }
    }

    get path() {
        return `../../Production/${this.name}/`;
    }

    constructPath(name) {
        return this.path + name;
    }
}

module.exports = Manager;