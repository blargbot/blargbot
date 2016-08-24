var e = module.exports = {}
var bu = require('./../util.js')
var exec = require('child_process').exec;

var bot
e.init = (Tbot) => {
    bot = Tbot
}
e.requireCtx = require

e.isCommand = true
e.hidden = false
e.usage = '';
e.info = '';
e.category = bu.CommandType.CAT

e.execute = (msg, words, text) => {
    if (msg.author.id === bu.CAT_ID) {
        var commandToProcess = text.replace("exec ", "");
        console.log(commandToProcess);
        exec(commandToProcess, function (err, stdout, stderr) {
            if (err) {
                bu.sendMessageToDiscord(msg.channel.id, `Error!
\`\`\`js
${err.stack}
\`\`\``);
                return;
            }
            if (stderr) {
                bu.sendMessageToDiscord(msg.channel.id, `std error!
\`\`\`shell
${stderr}
\`\`\``);
                return;
            }
            bu.sendMessageToDiscord(msg.channel.id, `Input:
\`\`\`shell
${commandToProcess};
\`\`\`
Output:
\`\`\`shell
${stdout}
\`\`\``)
        });
    }
}