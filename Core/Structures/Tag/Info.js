const Base = require('./Base');

class InfoTag extends Base {
    constructor(client, options) {
        super(client, options);
        if (this.constructor === InfoTag) {
            throw new Error('Can\'t instantiate an abstract class!');
        }
    }

    get category() { return 'info'; }

}

module.exports = InfoTag;