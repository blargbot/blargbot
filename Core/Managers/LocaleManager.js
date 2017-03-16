const Manager = require('./Manager');

class LocaleManager extends Manager {
    constructor() {
        super('Locale', undefined, 'json');
    }

    build(name) {
        // no-op
    }
    
    getTemplate(locale, key) {
        let segments = key.split('.');
        let temp = this.list[locale];
        for (const segment of segments) {
            temp = temp[segment];
        }
        return temp;
    }
}

module.exports = LocaleManager;