const https = require('https');

// const originalRequest = https.request;
// https.request = function (...args) {
//   const data = args[0];
//   const req = originalRequest(...args);

//   if (data && data.host === 'discordapp.com') {
//     const route = data.path.replace(/\?.+$/, '').replace(/(\d{2,}|[^\/]{30,})/g, '_x').replace(/reactions\/.+$/i, 'reactions/_r');

//     const originalFinish = req.finish;
//     req.finish = function () {
//       console.log(data.method, data.path);
//       bot.sender.send('httpsMetric', { method: data.method, route });

//       originalFinish();
//     };
//   }

//   return req;
// };