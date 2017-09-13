const { GeneralCommand } = require('../../../Core/Structures/Command');
const util = require('util');
const { TagContext } = require('../../../Core/Tag');

class TagCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'tag',
            aliases: ['t'],
            subcommands: {
                set: { minArgs: 2 },
                delete: { minArgs: 1 },
                rename: { minArgs: 2 },
                raw: { minArgs: 1 },
                info: { minArgs: 1 },
                transfer: { minArgs: 2 },
                top: {},
                author: { minArgs: 1 },
                search: { minArgs: 1 },
                list: {},
                favorite: {},
                report: { minArgs: 1 },
                test: { minArgs: 1 },
                help: {},
                docs: {},
                setdesc: { minArgs: 1 }
            },
            subcommandAliases: {
                remove: 'delete',
                favourite: 'favorite',
                add: 'set',
                create: 'set',
                edit: 'set',
                setinfo: 'setdesc'
            },
            keys: {
                dontown: '.dontown',
                notag: '.notag',
                tagset: '.tagset',
                tagrename: '.tagrename',
                raw: '.raw',
                alreadyexists: '.alreadyexists',
                testoutput: '.testoutput',
                help: '.info',
                subcommandNotFound: '.subcommandnotfound',
                transferprompt: '.transferprompt',
                nobots: '.nobots',
                transfercancelled: '.transfercancelled',
                transfercomplete: '.transfercomplete',
                taginfo: '.taginfo',
                descupdate: '.descupdate',
                descreset: '.descreset',
                subcommandconflict: '.subcommandconflict',
                toptagformat: '.toptagformat',
                toptags: '.toptags',
                tagauthor: '.tagauthor',
                favouriteadd: '.favouriteadd',
                favouriteremove: '.favouriteremove',
                favourites: '.favourites'
            }
        });

        this.subcommandKeys = [].concat(Object.keys(this.subcommands), Object.keys(this.subcommandAliases));
    }

    get filterRegex() {
        return /[^\w\d_!\.+-=\^\$\?"':;# ]/gim;
    }

    filterName(name) {
        let toReturn = { name, valid: true };

        toReturn.name = toReturn.name.replace(this.filterRegex, '');
        if (this.subcommandKeys.includes(toReturn.name.toLowerCase()))
            toReturn.valid = false;

        return toReturn;
    }

    async getTag(name) {
        name = this.filterName(name).name;
        const data = await this.client.getDataTag(name);
        let tag;
        try {
            tag = await data.getObject();
        } catch (err) { }
        return { data, tag };
    }

    async ownershipTest(ctx) {
        const { data, tag } = await this.getTag(this.filterName(ctx.input._[0]).name);
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
            await data.incrementUses();
        }
    }

    async sub_set(ctx) {
        let name = this.filterName(ctx.input._[0]);
        if (!name.valid) {
            return ctx.decodeAndSend(this.keys.subcommandconflict, { name: name.name.toLowerCase() });
        }
        const { data, tag } = await this.getTag(name.name);
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
            let name = this.filterName(ctx.input._[1]);
            if (!name.valid) {
                return ctx.decodeAndSend(this.keys.subcommandconflict, { name: name.name.toLowerCase() });
            }
            await data.rename(name.name);
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

    async sub_transfer(ctx) {
        const { data, tag, owner } = await this.ownershipTest(ctx);
        if (owner) {
            let user = await this.client.Helpers.Resolve.user(ctx, ctx.input._[1]);
            if (user) {
                if (user.bot) return await ctx.decodeAndSend(this.keys.nobots);
                let menu = this.client.Helpers.Menu.build(ctx);
                menu.embed.setContent(await ctx.decode(this.keys.transferprompt, {
                    target: user.mention,
                    user: ctx.author.fullName,
                    tag: await tag.get('tagName')
                }));
                try {
                    await menu.setUserId(user.id).addConfirm().addCancel().awaitConfirmation();
                    await data.setAuthor(user.id);
                    await ctx.decodeAndSend(this.keys.transfercomplete, {
                        user: user.fullName,
                        tag: await tag.get('tagName')
                    });
                } catch (err) {
                    if (typeof err === 'string') {
                        await ctx.decodeAndSend(this.keys.transfercancelled);
                    } else throw err;
                }
            }
        }
    }

    async sub_info(ctx) {
        const { data, tag } = await this.getTag(ctx.input._[0]);
        if (tag) {
            let author = this.client.users.get(await data.getAuthor()) || await this.client.getRESTUser(await data.getAuthor()) || { fullName: 'Clyde#0000' };
            await ctx.decodeAndSend(this.keys.taginfo, {
                name: await tag.get('tagName'),
                author: author.fullName,
                lastModified: await tag.get('updatedAt'),
                uses: await data.getUses(),
                favourites: await data.getFavourites(),
                usage: await data.getUsage() || '',
                desc: await data.getDesc() || ''
            });
        } else ctx.decodeAndSend(this.keys.notag);
    }

    async sub_top(ctx) {
        let tags = await ctx.client.models.Tag.findAll({
            order: [
                [ctx.client.database.sequelize.fn('countTagFavourites', ctx.client.database.sequelize.col('tagName')), 'DESC'],
                ['uses', 'DESC']
            ],
            limit: 10
        });
        let output = [];
        let authorCache = {};

        for (let i = 0; i < tags.length; i++) {
            let author = await tags[i].get('authorId');
            if (authorCache[author]) author = authorCache[author];
            else if (ctx.client.users.get(author)) author = ctx.client.users.get(author);
            else author = await ctx.client.getRESTUser(author);
            authorCache[author.id] = author;
            output.push(await ctx.decode(this.keys.toptagformat, {
                name: await tags[i].get('tagName'),
                uses: await tags[i].get('uses'),
                favourites: await tags[i].get('favourites'),
                index: i + 1,
                author: author.fullName
            }));
        }

        return await ctx.decodeAndSend(this.keys.toptags, {
            tags: output.join('\n\n')
        });
    }

    async sub_author(ctx) {
        const { data, tag } = await this.getTag(ctx.input._[0]);
        if (tag) {
            let author = this.client.users.get(await data.getAuthor()) || await this.client.getRESTUser(await data.getAuthor()) || { fullName: 'Clyde#0000' };
            await ctx.decodeAndSend(this.keys.tagauthor, {
                name: await tag.get('tagName'),
                author: author.fullName
            });
        } else ctx.decodeAndSend(this.keys.notag);
    }

    async sub_search(ctx) {
        await ctx.send('search');

    }

    async sub_list(ctx) {
        await ctx.send('list');

    }

    async sub_favorite(ctx) {
        if (ctx.input._.length > 0) {
            let name = ctx.input._.raw.join('');
            const { data, tag } = await this.getTag(name);
            if (tag) {
                let favTemplate = {
                    tagName: data.id,
                    userId: ctx.user.id
                };
                let fav = await ctx.client.models.TagFavourite.findOrCreate({
                    where: favTemplate,
                    defaults: favTemplate
                });
                console.log(fav);
            } else {
                await ctx.decodeAndSend(this.keys.notag);
            }
        } else {
            let tags = await ctx.client.models.TagFavourite.findAll({
                attributes: ['tagName'],
                where: {
                    userId: ctx.user.id
                }
            });
            let tagNames = tags.map(t => t.dataValues.tagName);
            await ctx.decodeAndSend(this.keys.favourites, {
                count: tagNames.length,
                tags: tagNames.join(', ')
            });
        }
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

    async sub_setdesc(ctx) {
        const { data, tag, owner } = await this.ownershipTest(ctx);
        if (owner) {
            let toSet = null;
            if (ctx.input._.length > 1) toSet = ctx.input._.raw.slice(1).join('');
            if (toSet && toSet.length > 1000) {
                return ctx.decodeAndSend('error.inputtoolong', {
                    length: toSet.length,
                    max: 100
                });
            }
            await data.setDesc(toSet);
            if (toSet) await ctx.decodeAndSend(this.keys.descupdate, {
                tag: await tag.get('tagName')
            });
            else await ctx.decodeAndSend(this.keys.descreset, {
                tag: await tag.get('tagName')
            });
        }
    }

    async sub_help(ctx) {
        if (ctx.input._.length === 0) {
            await ctx.decodeAndSend(this.keys.info, {
                subcommands: Object.keys(this.subcommands).map(s => `**${s}**`).join(', ')
            });
        } else {
            let query = ctx.input._[0].toLowerCase();
            let name = this.subcommandAliases[query] || query;
            let subcommand = this.subcommands[name];
            if (!subcommand) {
                await ctx.decodeAndSend(this.keys.subcommandNotFound, {
                    subcommand: name
                });
            } else {
                await ctx.decodeAndSend('generic.commandhelp', {
                    name: `tag ${name}`,
                    info: await ctx.decode(subcommand.info),
                    usage: await ctx.decode(subcommand.usage),
                    aliases: Object.keys(this.subcommandAliases).filter(a => this.subcommandAliases[a] === name).join(', ') || ''
                });
            }
        }
    }
}

module.exports = TagCommand;