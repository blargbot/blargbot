const BaseHelper = require('./BaseHelper');
const BigNumber = require('big-number');

class SnowflakeHelper extends BaseHelper {
  constructor(client) {
    super(client);
  }

  make(date = Date.now()) {
    return BigNumber(date).minus(1420070400000).multiply(4194304).toString();;
  }

  unmake(snowflake) {
    return parseInt(BigNumber(snowflake).div(4194304).plus(1420070400000));
  }
}

module.exports = SnowflakeHelper;