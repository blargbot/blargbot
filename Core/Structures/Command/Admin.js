const Constants = require('../Constants');
const Base = require('./Base');

class GeneralCommand extends Base {
    constructor(options) {
        super(options);
        if (this.constructor === GeneralCommand) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.category = 'Admin';
    }

    async canExecute(msg) {
        return true;
    }
}

module.exports = GeneralCommand;