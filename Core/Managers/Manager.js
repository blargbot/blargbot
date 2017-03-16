class Manager {
    constructor(name, base, extension) {
        if (this.constructor === Manager) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.name = name;
        this.list = {};
        this.builtList = {};
        this.base = base;
        this.extension = extension || 'js';
    }

    init() {
        var fileArray = _dep.fs.readdirSync(_dep.path.join(__dirname, this.path));
        const regexp = new RegExp("(.+)\." + this.extension)
        for (var i = 0; i < fileArray.length; i++) {
            var file = fileArray[i];
            if (regexp.test(file)) {
                var name = file.match(regexp)[1];
                this.load(name);
            }
        }
    }

    load(name) {
        _logger.init('Loading ' + this.name + ': ' + name);
        this.list[name] = require(this.constructPath(name));
        this.build(name);
    }

    unload(name) {
        delete this.list[name];
    }

    reload(name) {
        this.unload(name);
        this.list[name] = _dep.reload(this.constructReloadPath(name));
        this.build(name);
    }

    build(name) {
        this.builtList[name] = new this.list[name]();
        if (this.builtList[name] instanceof this.base)
            return true;
        else {
            delete this.list[name];
            delete this.builtList[name];
            return false;
        }
    }

    get topPath() {
        return `./Production/${this.name}/`;
    }

    get path() {
        return `../.${this.topPath}`;
    }

    constructPath(name) {
        return this.path + name;
    }

    constructReloadPath(name) {
        return this.topPath + name;
    }
}

module.exports = Manager;