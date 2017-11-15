const Base = require('./Base');

class RoleTag extends Base {
  constructor(client, options) {
    super(client, options);
    if (this.constructor === RoleTag) {
      throw new Error('Can\'t instantiate an abstract class!');
    }
  }

  get category() { return 'role'; }
  get implicit() { return false; }

}

module.exports = RoleTag;