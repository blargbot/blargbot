console.log('Starting with a babel-hook.');

require("babel-register")({
    "presets": ["latest"]
});
require("babel-polyfill");

require("./blargbot.js");