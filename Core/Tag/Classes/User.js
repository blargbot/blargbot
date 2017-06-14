const Base = require('./Base');

class UserTag extends Base {
    constructor(client, options) {
        super(client, options);
        if (this.constructor === UserTag) {
            throw new Error('Can\'t instantiate an abstract class!');
        }
    }

    get category() { return 'user'; }

    get implicit() { return false; }

}

module.exports = UserTag;