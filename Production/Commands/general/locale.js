const { GeneralCommand } = require('../../../Core/Structures/Command');

class LocaleCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'locale',
            keys: {
                set: `.set`,
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
        locales = locales.sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
        let userLocale = await ctx.author.data.getLocale();
        const menu = ctx.client.Helpers.Menu.build(ctx);
        menu.embed.setDescription(await ctx.decode(this.keys.list, {
            current: localeManager.localeList[userLocale].specs.lang
        }));
        try {
            let res = await menu.paginate(locales);

            await ctx.author.data.setLocale(res.value);
            await ctx.decodeAndSend(this.keys.set, {
                locale: res.value
            });
        } catch (err) {
            await ctx.decodeAndSend('generic.nochange');
        }
    }
}

module.exports = LocaleCommand;