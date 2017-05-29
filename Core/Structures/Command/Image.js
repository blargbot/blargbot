const Base = require('./Base');

class ImageCommand extends Base {
    constructor(...args) {
        super(...args);
        if (this.constructor === ImageCommand) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.category = 'image';
    }

    async canExecute(ctx) {
        return await super.canExecute(ctx);
    }
}

module.exports = ImageCommand;