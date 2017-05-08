/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:23:53
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:25:13
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

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