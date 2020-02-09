const https = require('https');

// const originalRequest = https.request;
// https.request = function (...args) {
//   const data = args[0];
//   if (data && data.host === 'discordapp.com') {
//     const route = data.path.replace(/\?.+$/, '').replace(/(\d{2,}|[^\/]{30,})/g, '_x').replace(/reactions\/.+$/i, 'reactions/_r');
//     bot.sender.send('httpsMetric', { method: data.method, route });
//   }
//   return originalRequest(...args);
// };