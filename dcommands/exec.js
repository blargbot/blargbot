var e = module.exports = {};
var bu;
var exec = require('child_process').exec;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.CAT;
};
e.requireCtx = require;

e.isCommand = true;

e.hidden = false;
e.usage = '';
e.info = '';

e.execute = (msg, words, text) => {
    if (msg.author.id === bu.CAT_ID) {
        var commandToProcess = words.slice(1).join(' ');
        bu.logger.debug(commandToProcess);
        if (commandToProcess.trim().toLowerCase() == 'pm2 restart 0'
        || commandToProcess.trim().toLowerCase() == 'pm2 reload 0'
        || commandToProcess.trim().toLowerCase() == 'pm2 start 0') {
            bu.send(msg.channel.id, 'No! That\'s dangerous! Do `b!restart` instead.\n\nIt\'s not that I don\'t trust you, it\'s just...\n\nI don\'t trust you.');
        }
        exec(commandToProcess, function (err, stdout, stderr) {
            if (err) {
                bu.sendMessageToDiscord(msg.channel.id, `Error!
\`\`\`js
${err.stack}
\`\`\``);
                return;
            }
            var message = '```xl\n';
            if (stderr) {
                message += stderr;
                //  return;
            }
            message += stdout + '\n```';
            bu.sendMessageToDiscord(msg.channel.id, message);
        });
    }
};