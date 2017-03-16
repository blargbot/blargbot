const Base = require('./Base');

class GeneralCommand extends Base {
    constructor(options) {
        super(options);
        if (this.constructor === GeneralCommand) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.category = 'general';
    }

    async canExecute(ctx) {
        return await super.canExecute(ctx);
    }
}

module.exports = GeneralCommand;