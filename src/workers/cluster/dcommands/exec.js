const { exec } = require('child_process');
const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class ExecCommand extends BaseCommand {
    constructor() {
        super({
            name: 'exec',
            category: newbutils.commandTypes.CAT
        });
    }

    async execute(msg, words) {
        if (msg.author.id === config.discord.users.owner) {
            let commandToProcess = words.slice(1).join(' ');
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
                let message = '```xl\n';
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
