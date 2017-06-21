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
        await ctx.send('bai');
        ctx.client.sender.send('KILLEVERYTHING', 'meep');
    }
}

module.exports = RestartCommand;