var e = module.exports = {};

var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var Table = require('cli-table');

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
        if (err) {
            logger.error(err);
            bu.send(msg, 'An error has occurred!');
            return;
        }
        let message = '```prolog\n' + stdout;
        let sections = stdout.split(/-+/);
        logger.debug(sections);
        for (let i = 0; i < sections.length; i++) {
            if (sections[i] == '')
                sections.splice(i, 1);
        }
        logger.debug(sections);
        let head = sections[1].split(/\s\s+/);
        var table = new Table({
            head: head
        });
        let middle = sections[2].split(/\n/);
        logger.debug(middle);
        for (let i = 0; i < middle.length; i++) {
            if (middle[i] != '') {
                let toPush = middle[i].split(/\s\s+/);
                logger.debug(toPush);
                table.push(toPush);
            }
        }
        let footer = sections[3].split(/\s\s+/);
        logger.debug(footer);
        table.push(footer);
        logger.debug(table);
        bu.send(msg, table.toString());
    });

};