const { CatCommand } = _core.Structures.Command;

class EvalCommand extends CatCommand {
    constructor() {
        super({
            name: 'eval'
        });
    }

    async execute(ctx) {
        await super.execute(ctx);
        let input = ctx.text.split(' ').slice(1).join(' ');
        try {
            let response = await _discord.doEval(ctx, input);
            await ctx.send(`Input:\n\`\`\`js\n${input}\n\`\`\`\nOutput:\n\`\`\`\n${_dep.util.inspect(response, {depth: 3})}\n\`\`\``);
        } catch (err) {
            await ctx.send(`Input:\n\`\`\`js\n${input}\n\`\`\`\Error:\n\`\`\`\n${err.message}\n${err.stack}\n\`\`\``);            
        }
        
    }
}

module.exports = EvalCommand;