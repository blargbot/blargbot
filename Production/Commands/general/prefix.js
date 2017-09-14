const { GeneralCommand } = require('../../../Core/Structures/Command');

class PrefixCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'prefix',
            keys: {
            },
            info: 'Gets or sets the your command prefixes. This command configures user prefixes. For guild prefixes, use the `setup` command.',
            subcommands: {
                add: { usage: '<prefix>', info: 'Adds a prefix to your list.', aliases: ['create'] },
                remove: { usage: '<prefix>', info: 'Removes a prefix from your list.', aliases: ['delete'] }
            },
            keys: {
                prefixList: { key: '.prefixlist', value: '{{content}}\nTo configure your prefixes, use the `add` and `remove` subcommands. To configure the guild prefixes, use the `setup` command.' },
                userPrefixes: { key: '.userprefixes', value: 'Here are your prefixes:\n```md\n{{userprefixes}}\n```' },
                guildPrefixes: { key: '.guildprefixes', value: 'Here are the prefixes on this guild:\n```md\n{{guildprefixes}}\n```' },
                noPrefixes: { key: '.noprefixes', value: 'You have no custom prefixes.' },

                prefixAdded: { key: '.prefixadded', value: 'That prefix has been added!' },
                prefixRemoved: { key: '.prefixremoved', value: 'That prefix has been removed!' },
                nothingChanged: { key: '.nothingchanged', value: 'Nothing was changed.' }
            },
            aliases: ['prefixes']
        });

    }

    async execute(ctx) {
        let userPrefixes = await ctx.author.data.getPrefixes();
        let guildPrefixes = await ctx.guild.data.getPrefixes();
        let content = [];

        if (userPrefixes.length > 0)
            content.push(await ctx.decode(this.keys.userPrefixes, { userprefixes: userPrefixes.map(p => ` - ${p}`).join('\n') }));
        if (guildPrefixes.length > 0)
            content.push(await ctx.decode(this.keys.guildPrefixes, { userprefixes: guildPrefixes.map(p => ` - ${p}`).join('\n') }));
        if (userPrefixes.length === 0 && guildPrefixes.length === 0)
            content.push(await ctx.decode(this.keys.noPrefixes));

        return await ctx.decodeAndSend(this.keys.prefixList, { content: content.join('\n') });
    }

    async sub_add(ctx) {
        let prefixes = await ctx.author.data.getPrefixes();
        let newPrefix = ctx.input._.raw.join('');
        if (!prefixes.includes(newPrefix)) {
            prefixes.push(newPrefix);
            prefixes.sort();
            await ctx.author.data.setPrefixes(prefixes);
            return await ctx.decode(this.keys.prefixAdded);
        } else
            return await ctx.decode(this.keys.nothingChanged);
    }

    async sub_remove(ctx) {
        let prefixes = await ctx.author.data.getPrefixes();
        let newPrefix = ctx.input._.raw.join('');
        if (prefixes.includes(newPrefix)) {
            prefixes.splice(prefixes.indexOf(newPrefix), 1);
            prefixes.sort();
            await ctx.author.data.setPrefixes(prefixes);
            return await ctx.decode(this.keys.prefixRemoved);
        } else
            return await ctx.decode(this.keys.nothingChanged);
    }
}

module.exports = PrefixCommand;