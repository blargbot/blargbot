const Constants = require('../Constants');

class CatCommand {
    constructor(options) {
        super(options);
        if (this.constructor === CatCommand) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.category = 'CATZ MEOW MEOW';
    }

    async canExecute(msg) {
        return msg.author.id == Constants.CAT_ID;
    }
}