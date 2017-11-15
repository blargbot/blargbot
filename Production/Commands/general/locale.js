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
      let locale = localeManager.localeList[l];
      let name = locale.specs.lang;
      if (locale.specs.perc) name += ` (${locale.specs.perc}%)`;
      return {
        value: l,
        name
      };
    });
    locales = locales.sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
    let userLocale = await ctx.author.data.getLocale();
    const menu = ctx.client.Helpers.Menu.build(ctx);
    menu.embed.setDescription(await ctx.decode(this.keys.list, {
      current: localeManager.localeList[userLocale.toLowerCase()].specs.lang
    }));
    try {
      let res = await menu.paginate(locales);

      await ctx.author.data.setLocale(res.value);
      await ctx.decodeAndSend(this.keys.set, {
        locale: res.name
      });
    } catch (err) {
      await ctx.decodeAndSend('generic.nochange');
    }
  }
}

module.exports = LocaleCommand;