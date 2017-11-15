const Base = require('./Base');

class AdminCommand extends Base {
  constructor(...args) {
    args[1].category = 'admin';
    super(...args);
    if (this.constructor === AdminCommand) {
      throw new Error("Can't instantiate an abstract class!");
    }
  }

  async canExecute(ctx) {
    return await ctx.checkStaff();
  }
}

module.exports = AdminCommand;