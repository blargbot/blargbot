const Base = require('./Base');

class GeneralCommand extends Base {
  constructor(...args) {
    args[1].category = 'general';
    super(...args);
    if (this.constructor === GeneralCommand) {
      throw new Error("Can't instantiate an abstract class!");
    }
  }

  async canExecute(ctx) {
    return await super.canExecute(ctx);
  }
}

module.exports = GeneralCommand;