const Manager = require('./Manager');
const path = require('path');

class LocaleManager extends Manager {
    constructor(client) {
        super(client, 'Locale', undefined, 'json');
        this.localeList = {};
    }

    init() {
        if (this.modules)
            this.modules = this.modules.reload();
        else
            this.modules = require(`../../Production/${this.name}`);
        this.localeList = {};
        for (const key in this.modules) {
            if (key === 'index') continue;
            let obj = this.modules[key];
            this.build(key);
        }
    }

    build(...names) {
        let mod = this.modules.get(...names);
        let name = names[names.length - 1];
        this.localeList[name] = mod;
    }

    getTemplate(locale = 'en_us', key = '') {
        let segments = key.split('.');
        let temp = this.localeList[locale.toLowerCase()];
        for (const segment of segments) {
            if (temp.hasOwnProperty(segment))
                temp = temp[segment];
            else return null;
        }
        return temp;
    }
}

module.exports = LocaleManager;