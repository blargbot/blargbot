const Constants = require('../Constants');
const Base = require('./Base');

class CatCommand extends Base {
    constructor(options) {
        super(options);
        if (this.constructor === CatCommand) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.category = 'CATZ MEOW MEOW';
    }

    async canExecute(ctx) {
        return ctx.msg.author.id == Constants.CAT_ID;
    }
}

module.exports = CatCommand;