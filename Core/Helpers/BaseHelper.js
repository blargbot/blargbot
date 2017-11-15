class BaseHelper {
  constructor(client) {
    if (this.constructor === BaseHelper) {
      throw new Error("Can't instantiate an abstract class!");
    }
    this.client = client;
  }
}

module.exports = BaseHelper;