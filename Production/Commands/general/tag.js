const { GeneralCommand } = require('../../../Core/Structures/Command');
const util = require('util');
const { TagContext } = require('../../../Core/Tag');

class TagCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'tag',
            aliases: 't',
            subcommands: {
                set: { minArgs: 2 },
                delete: { minArgs: 1 },
                rename: { minArgs: 2 },
                raw: { minArgs: 1 },
                info: { minArgs: 1 },
                top: {},
                author: { minArgs: 1 },
                search: { minArgs: 1 },
                list: {},
                favorite: {},
                report: { minArgs: 2 },
                test: { minArgs: 1 },
                help: {}
            },
            subcommandAliases: {
                remove: 'delete',
                favourite: 'favorite',
                add: 'set',
                create: 'set',
                edit: 'set'
            }
        });

        this.keys = {
            dontown: `${this.base}.dontown`,
            notag: `${this.base}.notag`,
            tagset: `${this.base}.tagset`,
            tagrename: `${this.base}.tagrename`,
            raw: `${this.base}.raw`,
            alreadyexists: `${this.base}.alreadyexists`,
            testoutput: `${this.base}.testoutput`
        };
    }

    async getTag(name) {
        const data = await this.client.getDataTag(name);
        let tag;
        try {
            tag = await data.getObject();
        } catch (err) { }
        return { data, tag };
    }

    async ownershipTest(ctx) {
        const { data, tag } = await this.getTag(ctx.input._[0]);
        if (!tag) {
            await ctx.decodeAndSend(this.keys.notag);
        } else if (tag.get('authorId') !== ctx.author.id) {
            await ctx.decodeAndSend(this.keys.dontown);
        } else {
            return { data, tag, owner: true };
        }
        return { data, tag, owner: false };
    }

    async execute(ctx) {
        if (ctx.input._.length == 0) return await this.sub_help(ctx);
        const { data, tag } = await this.getTag(ctx.input._[0]);
        if (!tag)
            await ctx.decodeAndSend(this.keys.notag);
        else {
            const tagContext = new TagContext(ctx.client, {
                ctx, content: tag.get('content'),
                author: tag.get('authorId'), name: tag.get('tagName'),
                isCustomCommand: false
            }, data);
            await ctx.send((await tagContext.process()).toString());
        }
    }

    async sub_set(ctx) {
        const { data, tag } = await this.getTag(ctx.input._[0]);
        if (tag && tag.get('authorId') !== ctx.author.id) {
            await ctx.decodeAndSend(this.keys.dontown);
            return;
        }
        let content = ctx.input._.slice(1).join(' ').replace(/\n /g, '\n');
        if (!tag)
            await data.create({
                content,
                authorId: ctx.author.id
            });
        else await data.setContent(content);
        await ctx.decodeAndSend(this.keys.tagset, {
            name: ctx.input._[0], process: await ctx.decode(`generic.${tag ? 'edited' : 'created'}`)
        });
    }

    async sub_delete(ctx) {
        const { data, tag, owner } = await this.ownershipTest(ctx);
        if (owner) {
            await tag.destroy();
            await ctx.decodeAndSend(this.keys.tagset, {
                name: ctx.input._[0], process: await ctx.decode('generic.deleted')
            });
        }
    }

    async sub_rename(ctx) {
        const { data, tag, owner } = await this.ownershipTest(ctx);
        const tag2 = await this.getTag(ctx.input._[1]);
        if (tag2.tag) {
            await ctx.decodeAndSend(this.keys.alreadyexists);
        } else if (owner) {
            await data.rename(ctx.input._[1]);
            await ctx.decodeAndSend(this.keys.tagrename, {
                old: ctx.input._[0], new: ctx.input._[1]
            });
        }
    }

    async sub_raw(ctx) {
        const { data, tag } = await this.getTag(ctx.input._[0]);
        if (!tag)
            await ctx.decodeAndSend(this.keys.notag);
        else {
            await ctx.decodeAndSend(this.keys.raw, {
                name: ctx.input._[0], code: tag.get('content')
            });
        }
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
        const data = this.client.getDataTag('test');
        await data.getOrCreateObject();
        const tagContext = new TagContext(ctx.client, {
            ctx, content: ctx.input._.raw.join(''),
            author: ctx.author.id, name: 'test',
            isCustomCommand: false
        }, data);
        let output = await tagContext.process() || '';
        await ctx.decodeAndSend(this.keys.testoutput, {
            output: output.toString().trim()
        });
    }

    async sub_help(ctx) {
        await ctx.send('help');

    }
}

module.exports = TagCommand;