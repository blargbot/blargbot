let hasGotten = false;
module.exports = {
  get thing() {
    hasGotten = true;
    return 'bbb';
  },
  get hasGotten() {
    return hasGotten;
  },
  get dirname() {
    return __dirname;
  }
};

console.log('aaa');