const SSE = require('sse');

module.exports = (server, app) => {
  const sse = new SSE(server, {
    path: '/messagestream',
    headers: {
      'X-Powered-By': 'little tiny kittens'
    }
  });

  sse.broadcast = (...args) => {
    for (const client of sse.clients) client.send(...args);
  }

  return sse;
}