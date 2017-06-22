const Manager = require('./Manager');
const path = require('path');

class LocaleManager extends Manager {
    constructor(client) {
        super(client, 'Locale', undefined, 'json');
    }

    build(name) {
        // no-op
    }

    getTemplate(locale = 'en_US', key = '') {
        let segments = key.split('.');
        let temp = this.modules.get(locale);
        for (const segment of segments) {
            if (temp.hasOwnProperty(segment))
                temp = temp[segment];
            else return null;
        }
        return temp;
    }
}

module.exports = LocaleManager;