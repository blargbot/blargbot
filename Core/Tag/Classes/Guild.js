const Base = require('./Base');

class GuildTag extends Base {
    constructor(client, options) {
        super(client, options);
        if (this.constructor === GuildTag) {
            throw new Error('Can\'t instantiate an abstract class!');
        }
    }

    get category() { return 'guild'; }

}

module.exports = GuildTag;