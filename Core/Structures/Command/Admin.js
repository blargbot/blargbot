const Base = require('./Base');

class GeneralCommand extends Base {
    constructor(...args) {
        super(...args);
        if (this.constructor === GeneralCommand) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.category = 'admin';
    }

    async canExecute(ctx) {
        return await ctx.checkStaff();
    }
}

module.exports = GeneralCommand;