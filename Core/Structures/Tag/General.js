const Base = require('./Base');

class GeneralTag extends Base {
    constructor(client, options) {
        super(client, options);
        if (this.constructor === GeneralTag) {
            throw new Error('Can\'t instantiate an abstract class!');
        }
    }

    get category() { return 'general'; }
}

module.exports = GeneralTag;