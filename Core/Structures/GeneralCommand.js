const Constants = require('../Constants');

class GeneralCommand {
    constructor(options) {
        super(options);
        if (this.constructor === GeneralCommand) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.category = 'General';
    }

    async canExecute(msg) {
        return true;
    }
}