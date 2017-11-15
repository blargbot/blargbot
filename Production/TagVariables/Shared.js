const { TagVariable } = require('../../Core/Tag');

class SharedVariable extends TagVariable {

  /**
   * NO OP
   * Still must decide how to implement
   */

  get prefix() {
    return '&';
  }

}

module.exports = SharedVariable;