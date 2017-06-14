const Base = require('./Base');

class MathTag extends Base {
    constructor(client, options) {
        super(client, options);
        if (this.constructor === MathTag) {
            throw new Error('Can\'t instantiate an abstract class!');
        }
    }

    get category() { return 'math'; }
}

module.exports = MathTag;