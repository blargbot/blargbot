const { CatCommand } = require('../../../Core/Structures/Command');
const util = require('util');
const exec = require('child_process').exec;

class RestartCommand extends CatCommand {
    constructor(client) {
        super(client, {
            name: 'restart'
        });
    }

    async execute(ctx) {
        if (ctx.input._.join(' ').toLowerCase() === 'kill') {
            await ctx.send('ah you killed me D:');
            ctx.client.sender.send('KILLEVERYTHING', ctx.channel.id);
        } else {
            await ctx.send('ah you killed me but in a way that minimizes downtime D:');
            ctx.client.sender.send('respawnAll', ctx.channel.id);
        }
    }
}

module.exports = RestartCommand;