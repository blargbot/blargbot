const https = require('https');

const originalRequest = https.request;
https.request = function (...args) {
  const data = args[0];
  if (data && data.host === 'discordapp.com') {
    const route = data.path.replace(/\?.+$/, '').replace(/\d{2,}/g, '_x');
    bot.sender.send('httpsMetric', [data.method, route]);
  }
  return originalRequest(...args);
};