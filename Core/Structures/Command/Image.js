const Base = require('./Base');

class ImageCommand extends Base {
  constructor(...args) {
    args[1].category = 'image';
    super(...args);
    if (this.constructor === ImageCommand) {
      throw new Error("Can't instantiate an abstract class!");
    }
  }

  async canExecute(ctx) {
    return await super.canExecute(ctx);
  }
}

module.exports = ImageCommand;