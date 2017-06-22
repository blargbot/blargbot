const Base = require('./Base');

class MessageTag extends Base {
    constructor(client, options) {
        super(client, options);
        if (this.constructor === MessageTag) {
            throw new Error('Can\'t instantiate an abstract class!');
        }
    }

    get category() { return 'message'; }

    get implicit() { return false; }

}

module.exports = MessageTag;