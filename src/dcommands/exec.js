const BaseCommand = require('../structures/BaseCommand');
const { exec } = require('child_process');

class ExecCommand extends BaseCommand {
    constructor() {
        super({
            name: 'exec',
            category: bu.CommandType.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id === bu.CAT_ID) {
            var commandToProcess = words.slice(1).join(' ');
            console.debug(commandToProcess);
            if (commandToProcess.trim().toLowerCase().includes('pm2 restart') ||
                commandToProcess.trim().toLowerCase().includes('pm2 reload') ||
                commandToProcess.trim().toLowerCase().includes('pm2 start')) {
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
    }
}

module.exports = ExecCommand;
