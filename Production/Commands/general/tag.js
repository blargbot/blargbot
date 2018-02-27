const { GeneralCommand } = require('../../../Core/Structures/Command');
const util = require('util');
const { TagContext } = require('../../../Core/Tag');

class TagCommand extends GeneralCommand {
  constructor(client) {
    super(client, {
      name: 'tag',
      aliases: ['t'],
      info: 'Tags are a system of public commands that anyone can create or execute, using the BBTag language.' +
        '\n\n**Subcommands**:\n{{subcommands}}\n\nFor more information about a subcommand, do ' +
        '`b!t help <subcommand>`\nFor more information about BBTag, visit <https://blargbot.xyz/tags>.' +
        '\nBy creating a tag, you acknowledge that you agree to the ' +
        'Terms of Service (<https://blargbot.xyz/tags/tos>).',
      usage: '<name | subcommand> [args]',
      subcommands: {
        set: {
          minArgs: 2, info: 'Creates or edits a tag with the provided name and content. ' +
            'Will not replace any tags made by anyone else.',
          usage: '<name> <content>'
        },
        delete: { minArgs: 1, info: 'Deletes a tag that you own.', usage: '<name>' },
        rename: { minArgs: 2, info: 'Renames a tag that you own.', usage: '<name> <new name>' },
        raw: { minArgs: 1, info: 'Gets the raw code of a tag.', usage: '<name>' },
        info: { minArgs: 1, info: 'Displays information about a tag.', usage: '<name>' },
        transfer: { minArgs: 2, info: 'Transfers a tag to the specified user. Variables will not be transferred.', usage: '<name> <user>' },
        top: { info: 'Displays the tags that have been the most favorited.' },
        author: { minArgs: 1, info: 'Displays the author of a tag.', usage: '<name>' },
        search: { minArgs: 1, info: 'Searches for a tag with a name containing your query.', usage: '<query>' },
        list: { info: 'Lists all the tags, or optionally all the tags created by a specific user.', usage: '[user]' },
        favorite: { minArgs: 1, info: 'Favorites the specified tag, or gets a list of your favorited tags.', usage: '[name]' },
        report: { minArgs: 2, info: 'Reports a tag for violating the ToS. Please use responsibly.', usage: '<name> <reason>' },
        test: { minArgs: 1, info: 'Executes the given code in a test environment.', usage: '<code>' },
        help: { usage: '[subcommand]', info: 'Displays this!' },
        docs: { info: 'Gives a link to the BBTag documentation, or provides information about a specific subtag.', usage: '[subtag]' },
        setdesc: { minArgs: 2, info: 'Sets the info docs for the specified tag.', usage: '<name> <description>' },
        setusage: { minArgs: 2, info: 'Sets the usage docs for the specified tag.', usage: '<name> <usage>' }
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
        dontown: { key: '.dontown', value: "[[emote.x]] You don't own that tag!" },
        notag: { key: '.notag', value: "[[emote.x]] There is no tag with that name." },
        tagset: { key: '.tagset', value: "[[emote.check]] Tag `{{name}}` {{process}}!" },
        tagrename: { key: '.tagrename', value: "[[emote.check]] The tag `{{old}}` has been renamed to `{{new}}`." },
        raw: { key: '.raw', value: "The code for {{name}} is:\n```{{code}}```" },
        alreadyexists: { key: '.alreadyexists', value: "[[emote.x]] A tag with that name already exists!" },
        testoutput: { key: '.testoutput', value: "Test Output:\n\n{{output}}" },
        help: { key: '.info', value: "Tags are a system of public commands that anyone can create or execute, using the BBTag language.\n\n**Subcommands**:\n{{subcommands}}\n\nFor more information about a subcommand, do `b!t help <subcommand>`\nFor more information about BBTag, visit <https://blargbot.xyz/tags>.\nBy creating a tag, you acknowledge that you agree to the Terms of Service (<https://blargbot.xyz/tags/tos>)." },
        subcommandNotFound: { key: '.subcommandnotfound', value: "Couldn't find a subcommand with the name `{{subcommand}}`." },
        transferprompt: { key: '.transferprompt', value: "{{target}}, {{user}} wants to transfer ownership of the tag `{{tag}}` to you. Do you accept?\nThis will not transfer variables." },
        nobots: { key: '.nobots', value: "[[emote.x]] You cannot transfer a tag to a bot!" },
        transfercancelled: { key: '.transfercancelled', value: "[[emote.x]] The transfer has been canceled." },
        transfercomplete: { key: '.transfercomplete', value: "[[emote.check]] {{user}} now owns the tag `{{tag}}`." },
        taginfo: { key: '.taginfo', value: "__**Tag | {{name}}**__\nAuthor: **{{author}}**\nLast Modified: **{{lastModified}}**\nUses: **{{uses}}**\nFavorites: **{{favourites}}**\n\nUsage: ` {{usage}}`\n\n{{desc}}" },
        descupdate: { key: '.descupdate', value: "The description for `{{tag}}` has been updated." },
        descreset: { key: '.descreset', value: "The description for `{{tag}}` has been reset." },
        subcommandconflict: { key: '.subcommandconflict', value: "You can't use the name `{{name}}` because there is a subcommand with that name!" },
        toptagformat: { key: '.toptagformat', value: "{{index}}. **{{name}}** ({{author}})\n    - Favorites: {{favourites}} Uses: {{uses}}" },
        toptags: { key: '.toptags', value: "Here are the top 10 tags!\n\n{{tags}}" },
        tagauthor: { key: '.tagauthor', value: "The tag `{{tag}}` was created by **{{author}}**" },
        favouriteadd: { key: '.favouriteadd', value: "The tag `{{tag}}` has been added to your favorites list." },
        favouriteremove: { key: '.favouriteremove', value: "The tag `{{tag}}` has been removed from your favorites list." },
        favourites: { key: '.favourites', value: "You have {{count}} tags on your favorites list.\n```fix\n{{tags}}\n```" }
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
  async sub_setusage(ctx) {
    const { data, tag, owner } = await this.ownershipTest(ctx);
    if (owner) {
      let toSet = null;
      if (ctx.input._.length > 1) toSet = ctx.input._.raw.slice(1).join('');
      if (toSet && toSet.length > 200) {
        return ctx.decodeAndSend('error.inputtoolong', {
          length: toSet.length,
          max: 100
        });
      }
      await data.setUsage(toSet);
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

  async sub_docs(ctx) {
    return 'docs';
  }
}

module.exports = TagCommand;