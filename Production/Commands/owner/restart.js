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
        switch (ctx.input._.join(' ').toLowerCase()) {
            case 'kill':
                await ctx.send('ah you killed me D:');
                ctx.client.sender.send('KILLEVERYTHING', ctx.channel.id);
                break;
            case 'site':
            case 'website':
            case 'frontend':
                await ctx.send('ah you killed the frontend D:');
                ctx.client.sender.send('respawnFrontend', ctx.channel.id);
                break;
            default:
                await ctx.send('ah you killed me but in a way that minimizes downtime D:');
                ctx.client.sender.send('respawnAll', ctx.channel.id);
                break;
        }
    }
}

module.exports = RestartCommand;