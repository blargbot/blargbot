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
        return ctx.msg.author.id == _constants.CAT_ID;
    }
}

module.exports = CatCommand;