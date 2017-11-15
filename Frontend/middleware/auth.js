module.exports = function ({ store, error }) {
  if (!store.state.authUser) {
    error({
      message: 'unauthed',
      statusCode: 403
    });
  }
};