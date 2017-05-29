const { GeneralCommand } = _core.Structures.Command;

class PingCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'ping'
        });
    }

    async execute(ctx) {
        await super.execute(ctx);
        const msg2 = await ctx.send(await ctx.decode(`${this.base}.randmsg`));
        await msg2.edit(await ctx.decode(`${this.base}.final`, { time: msg2.timestamp - ctx.msg.timestamp }));
    }
}

module.exports = PingCommand;