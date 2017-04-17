console.log('Starting with a babel-hook.');

process.on('message', msg => {
    if (msg.code == 'PING') {
        process.send({ code: 'PONG', stamp: msg.stamp });
    }
});

require("babel-register")({
    "presets": ["latest"]
});
require("babel-polyfill");

require("./blargbot.js");