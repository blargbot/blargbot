var e = module.exports = {};

var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;

e.hidden = true;
e.usage = 'lines';
e.info = 'Gets the number of lines the bot is made of.';
e.longinfo = `<p>Gets the number of lines the bot is made of.</p>`;

e.execute = (msg) => {

    logger.debug(__dirname);
    exec(`cloc ${path.join(__dirname, '..')} --exclude-dir=codemirror`, (err, stdout, stderr) => {
        logger.debug(err);
        logger.debug(stdout);
        logger.debug(stderr);
    });

};