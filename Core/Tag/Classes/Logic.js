const Base = require('./Base');

class LogicTag extends Base {
    constructor(client, options) {
        super(client, options);
        if (this.constructor === LogicTag) {
            throw new Error('Can\'t instantiate an abstract class!');
        }
    }

    get category() { return 'logic'; }
}

module.exports = LogicTag;