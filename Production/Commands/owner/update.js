const { CatCommand } = require('../../../Core/Structures/Command');
const util = require('util');
const exec = require('child_process').exec;

class UpdateCommand extends CatCommand {
    constructor(client) {
        super(client, {
            name: 'update'
        });
    }

    async execute(ctx) {
        exec('git pull origin rewrite', async (err, stdout, stderr) => {
            let message = '```xl\n';
            if (err) {
                message += err + '\n';
            }
            if (stderr) {
                message += stderr + '\n';
            }
            if (stdout) {
                message += stdout + '\n';
            }
            message += '```';
            await ctx.send(message);
        });
    }
}

module.exports = UpdateCommand;