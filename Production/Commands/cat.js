const { GeneralCommand } = _core.Structures.Command;

class CatCommand extends GeneralCommand {
    constructor() {
        super({
            name: 'cat'
        });
    }

    async execute(ctx) {
        await super.execute(ctx);
        let res1 = await _dep.request
            .get('http://random.cat/meow');

        await ctx.send({
            embed: {
                color: _discord.Core.Helpers.Random.getRandomInt(0x000000, 0xffffff),
                image: {
                    url: res1.body.file
                }
            }
        });
    }
}

module.exports = CatCommand;