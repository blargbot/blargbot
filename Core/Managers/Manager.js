const fs = require('fs');
const path = require('path');
const reload = require('require-reload')(require);

class Manager {
    constructor(client, name, base, extension) {
        this.client = client;
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
        let fileList = [];
        this.walk(path.join(__dirname, this.path), fileList);
        const regexp = new RegExp("/?(.+)\." + this.extension);
        for (var i = 0; i < fileList.length; i++) {
            let file = fileList[i];
            if (regexp.test(file)) {
                let name = file.match(regexp)[1];
                this.load(name, file);
            }
        }
    }

    walk(dir, fileList, prefix = '') {
        let files = fs.readdirSync(dir);
        fileList = fileList || [];
        files.forEach((file) => {
            let filePath = path.join(dir, file);
            let name = path.join(prefix, file);
            if (fs.statSync(filePath).isDirectory()) {
                this.walk(filePath, fileList, name);
            }
            else {
                fileList.push(name);
            }
        });
    }

    load(file, filePath) {
        filePath = this.constructPath(filePath);
        console.init('Loading ' + this.name + ': ' + file);
        this.list[filePath] = require(filePath);
        if (this.build(filePath))
            this.builtList[filePath].path = filePath;
    }

    unload(name) {
        delete this.list[name];
    }

    reload(name) {
        let filePath = this.builtList[name].path;
        this.unload(name);
        this.list[name] = reload(filePath);
        this.build(name);
    }

    build(name) {
        this.builtList[name] = new this.list[name](this.client);
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
        return path.join(this.path, name);
    }

    constructReloadPath(name) {
        return path.join(this.topPath, name);
    }
}

module.exports = Manager;