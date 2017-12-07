var e = module.exports = {};


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
        console.debug(commandToProcess);
        if (commandToProcess.trim().toLowerCase().includes('pm2 restart') ||
            commandToProcess.trim().toLowerCase().includes('pm2 reload') ||
            commandToProcess.trim().toLowerCase().includes('pm2 start')) {
            bu.send(msg, 'No! That\'s dangerous! Do `b!restart` instead.\n\nIt\'s not that I don\'t trust you, it\'s just...\n\nI don\'t trust you.');
            return;
        }
        dep.exec(commandToProcess, function(err, stdout, stderr) {
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