const { GeneralCommand } = require('../../../Core/Structures/Command');

class LocaleCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'locale',
            keys: {
                randmsg: `.set`,
                list: `.list`
            }
        });

    }

    async execute(ctx) {
        let localeManager = ctx.client.LocaleManager;

        let locales = Object.keys(localeManager.localeList).map(l => {
            return {
                value: l,
                name: localeManager.localeList[l].specs.lang
            };
        });
        let userLocale = await ctx.author.data.getLocale();

        const menu = ctx.client.Helpers.Menu.build(ctx);
        menu.embed.setDescription(await ctx.decode(this.keys.list), {
            current: userLocale
        });
        let res = await menu.paginate(locales);

        await ctx.send(res.value);
    }
}

module.exports = LocaleCommand;