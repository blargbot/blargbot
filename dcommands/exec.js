var e = module.exports = {};

var exec = require('child_process').exec;


e.init = () => {
    
    

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
        logger.debug(commandToProcess);
        if (commandToProcess.trim().toLowerCase() == 'pm2 restart 0'
            || commandToProcess.trim().toLowerCase() == 'pm2 reload 0'
            || commandToProcess.trim().toLowerCase() == 'pm2 start 0') {
            bu.send(msg, 'No! That\'s dangerous! Do `b!restart` instead.\n\nIt\'s not that I don\'t trust you, it\'s just...\n\nI don\'t trust you.');
            return;
        }
        exec(commandToProcess, function (err, stdout, stderr) {
            if (err) {
                bu.send(msg, `Error!
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
            bu.send(msg, message);
        });
    }
};