class TestingBase {
  constructor() {

  }

  get dirname() {
    return __dirname;
  }

  get filename() {
    return __filename;
  }
}

module.exports = TestingBase;