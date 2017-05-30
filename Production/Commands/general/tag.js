const { GeneralCommand } = require('../../../Core/Structures/Command');

class TagCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'tag',
            aliases: 't',
            subcommands: {
                set: {},
                create: {},
                edit: {},
                delete: {},
                rename: {},
                raw: {},
                info: {},
                top: {},
                author: {},
                search: {},
                list: {},
                favorite: {},
                report: {},
                test: {},
                help: {}
            },
            subcommandAliases: {
                remove: 'delete',
                favourite: 'favorite',
                add: 'create'
            }
        });
    }

    async execute(ctx) {
        if (ctx.input._.length == 0) return await this.sub_help(ctx);
        await ctx.send('regular');

    }

    async sub_set(ctx) {
        await ctx.send('set');
    }

    async sub_create(ctx) {
        await ctx.send('create');

    }

    async sub_edit(ctx) {
        await ctx.send('edit');

    }

    async sub_delete(ctx) {
        await ctx.send('delete');

    }

    async sub_rename(ctx) {
        await ctx.send('rename');

    }

    async sub_raw(ctx) {
        await ctx.send('raw');

    }

    async sub_info(ctx) {
        await ctx.send('info');

    }

    async sub_top(ctx) {
        await ctx.send('top');

    }

    async sub_author(ctx) {
        await ctx.send('author');

    }

    async sub_search(ctx) {
        await ctx.send('search');

    }

    async sub_list(ctx) {
        await ctx.send('list');

    }

    async sub_favorite(ctx) {
        await ctx.send('favorite');

    }

    async sub_report(ctx) {
        await ctx.send('report');

    }

    async sub_test(ctx) {
        await ctx.send('test');

    }

    async sub_help(ctx) {
        await ctx.send('help');

    }
}

module.exports = TagCommand;