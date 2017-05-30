const { GeneralCommand } = require('../../Core/Structures/Command');

class TagCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'tag',
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

    }

    async sub_set(ctx) {

    }

    async sub_create(ctx) {

    }

    async sub_edit(ctx) {

    }

    async sub_delete(ctx) {

    }

    async sub_rename(ctx) {

    }

    async sub_raw(ctx) {

    }

    async sub_info(ctx) {

    }

    async sub_top(ctx) {

    }

    async sub_author(ctx) {

    }

    async sub_search(ctx) {

    }

    async sub_list(ctx) {

    }

    async sub_favorite(ctx) {

    }

    async sub_report(ctx) {

    }

    async sub_test(ctx) {

    }

    async sub_help(ctx) {

    }
}

module.exports = TagCommand;