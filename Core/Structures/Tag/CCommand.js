const Base = require('./Base');
const TagError = require('../TagError');

class CCommandTag extends Base {
    constructor(client, options) {
        super(client, options);
        if (this.constructor === CCommandTag) {
            throw new Error('Can\'t instantiate an abstract class!');
        }
    }

    get category() { return 'ccommand'; }

    async execute(ctx, args, parseArgs) {
        if (!ctx.isCustomCommand) throw new TagError('error.tag.ccommandonly', {
            tag: this.name
        });

        return await super.execute(ctx, args, parseArgs);
    }
}

module.exports = CCommandTag;