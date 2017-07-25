const { CatCommand } = require('../../../Core/Structures/Command');
const util = require('util');
const raur = '197529405659021322';

class GenerateCommand extends CatCommand {
    constructor(client) {
        super(client, {
            name: 'eval',
            subcommands: {
                tags: { minArgs: 0, maxArgs: 1 },
                raurusers: { minArgs: 0, maxArgs: 0 }
            }
        });
    }

    get randomUser() {
        return this.client.guilds.get(raur).members.random().user;
    }

    async execute(ctx) {
        return await ctx.send('use a subcommand or some shit\n' + Object.keys(this.subcommands).map(r => ` - ${r}`).join('\n'));
    }

    async sub_raurusers(ctx) {
        let members = this.client.guilds.get(raur).members;
        for (const [key, member] of members) {
            await member.user.data.create();
        }
        await ctx.send(`generated ${members.size} members from the raur guild`);
    }

    async sub_tags(ctx) {
        await this.sub_raurusers(ctx);
        let members = this.client.guilds.get(raur).members;

        let length = 50;
        if (ctx.input._.length > 0) length = parseInt(ctx.input._[0]);
        if (!length) length = 50;

        for (let i = 0; i < length; i++) {
            let data = await ctx.client.getDataTag(ctx.client.Helpers.Random.generateToken(10));
            await data.create({
                uses: ctx.client.Helpers.Random.randInt(1, 999),
                authorId: this.randomUser.id,
                content: 'Procedurally Generated Tag:\n\n' + ctx.client.Helpers.Random.generateToken(100),
                desc: 'This tag was procedurally generated for testing purposes.\n\n' + ctx.client.Helpers.Random.generateToken(100)
            });
            for (let i = 0; i < ctx.client.Helpers.Random.randInt(2, members.size); i++) {
                await data.addFavourite(this.randomUser.id);
            }
        }

        ctx.send(`Generated ${length} tags`);
    }
}

module.exports = GenerateCommand;