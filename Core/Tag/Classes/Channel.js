const Base = require('./Base');

class ChannelTag extends Base {
    constructor(client, options) {
        super(client, options);
        if (this.constructor === ChannelTag) {
            throw new Error('Can\'t instantiate an abstract class!');
        }
    }

    get category() { return 'channel'; }
    get implicit() { return false; }

}

module.exports = ChannelTag;