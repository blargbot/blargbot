const Base = require('./Base');

class ArrayTag extends Base {
    constructor(client, options) {
        super(client, options);
        if (this.constructor === ArrayTag) {
            throw new Error('Can\'t instantiate an abstract class!');
        }
    }

    get category() { return 'array'; }
}

module.exports = ArrayTag;