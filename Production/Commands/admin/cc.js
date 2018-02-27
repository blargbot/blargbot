const { AdminCommand } = require('../../../Core/Structures/Command');
const util = require('util');
const { TagContext } = require('../../../Core/Tag');

class CCCommand extends AdminCommand {
  constructor(client) {
    super(client, {
      name: 'cc',
      aliases: ['ccommand'],
      info: 'Custom Commands (CCommands) are a system of guild-specific commands that staff can create, using the BBTag language.' +
        '\n\n**Subcommands**:\n{{subcommands}}\n\nFor more information about a subcommand, do ' +
        '`b!cc help <subcommand>`\nFor more information about BBTag, visit <https://blargbot.xyz/tags>.',
      usage: '<name | subcommand> [args]',
      subcommands: {
        set: {
          minArgs: 2, info: 'Creates or edits a custom command with the provided name and content. ' +
            'Will not replace any tags made by anyone else.',
          usage: '<name> <content>'
        },
        delete: { minArgs: 1, info: 'Deletes a custom command that you own.', usage: '<name>' },
        rename: { minArgs: 2, info: 'Renames a custom command that you own.', usage: '<name> <new name>' },
        raw: { minArgs: 1, info: 'Gets the raw code of a custom command.', usage: '<name>' },
        transfer: { minArgs: 2, info: 'Transfers a custom command to the specified user. Variables will not be transferred.', usage: '<name> <user>' },
        author: { minArgs: 1, info: 'Displays the author of a custom command.', usage: '<name>' },
        list: { info: 'Lists all the custom commands.' },
        test: { minArgs: 1, info: 'Executes the given code in a test environment.', usage: '<code>' },
        help: { usage: '[subcommand]', info: 'Displays this!' },
        setdesc: { minArgs: 2, info: 'Sets the info docs for the specified custom command.', usage: '<name> <description>' },
        setusage: { minArgs: 2, info: 'Sets the usage docs for the specified custom command.', usage: '<name> <usage>' }
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
        dontown: { key: '.dontown', value: "[[emote.x]] You don't own that custom command!" },
        notag: { key: '.notag', value: "[[emote.x]] There is no custom command with that name." },
        tagset: { key: '.tagset', value: "[[emote.check]] Custom command `{{name}}` {{process}}!" },
        tagrename: { key: '.tagrename', value: "[[emote.check]] The custom command `{{old}}` has been renamed to `{{new}}`." },
        raw: { key: '.raw', value: "The code for {{name}} is:\n```{{code}}```" },
        alreadyexists: { key: '.alreadyexists', value: "[[emote.x]] A custom command with that name already exists!" },
        testoutput: { key: '.testoutput', value: "Test Output:\n\n{{output}}" },
        help: '.info',
        subcommandNotFound: { key: '.subcommandnotfound', value: "Couldn't find a subcommand with the name `{{subcommand}}`." },
        transferprompt: { key: '.transferprompt', value: "{{target}}, {{user}} wants to transfer ownership of the custom command `{{tag}}` to you. Do you accept?\nThis will not transfer variables." },
        nobots: { key: '.nobots', value: "[[emote.x]] You cannot transfer a custom command to a bot!" },
        transfercancelled: { key: '.transfercancelled', value: "[[emote.x]] The transfer has been canceled." },
        transfercomplete: { key: '.transfercomplete', value: "[[emote.check]] {{user}} now owns the custom command `{{tag}}`." },
        descupdate: { key: '.descupdate', value: "The description for `{{tag}}` has been updated." },
        descreset: { key: '.descreset', value: "The description for `{{tag}}` has been reset." },
        subcommandconflict: { key: '.subcommandconflict', value: "You can't use the name `{{name}}` because there is a subcommand with that name!" },
        tagauthor: { key: '.tagauthor', value: "The custom command `{{tag}}` was created by **{{author}}**" }
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

  async getTag(name, guildId) {
    name = this.filterName(name).name.toLowerCase();
    const data = await this.client.getDataCustomCommand(name, guildId);
    let tag;
    try {
      tag = await data.getObject();
    } catch (err) { }
    return { data, tag };
  }

  async ownershipTest(ctx) {
    const { data, tag } = await this.getTag(this.filterName(ctx.input._[0]).name, ctx.guild.id);
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
    const { data, tag } = await this.getTag(ctx.input._[0], ctx.guild.id);
    if (!tag)
      await ctx.decodeAndSend(this.keys.notag);
    else {
      const tagContext = new TagContext(ctx.client, {
        ctx, content: tag.get('content'),
        author: tag.get('authorId'), name: tag.get('commandName'),
        isCustomCommand: true
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
    const { data, tag } = await this.getTag(name.name, ctx.guild.id);
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
    const tag2 = await this.getTag(ctx.input._[1], ctx.guild.id);
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
    const { data, tag } = await this.getTag(ctx.input._[0], ctx.guild.id);
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
          tag: await tag.get('commandName')
        }));
        try {
          await menu.setUserId(user.id).addConfirm().addCancel().awaitConfirmation();
          await data.setAuthor(user.id);
          await ctx.decodeAndSend(this.keys.transfercomplete, {
            user: user.fullName,
            tag: await tag.get('commandName')
          });
        } catch (err) {
          if (typeof err === 'string') {
            await ctx.decodeAndSend(this.keys.transfercancelled);
          } else throw err;
        }
      }
    }
  }

  async sub_author(ctx) {
    const { data, tag } = await this.getTag(ctx.input._[0], ctx.guild.id);
    if (tag) {
      let author = this.client.users.get(await data.getAuthor()) || await this.client.getRESTUser(await data.getAuthor()) || { fullName: 'Clyde#0000' };
      await ctx.decodeAndSend(this.keys.tagauthor, {
        name: await tag.get('commandName'),
        author: author.fullName
      });
    } else ctx.decodeAndSend(this.keys.notag);
  }

  async sub_test(ctx) {
    const data = this.client.getDataCustomCommand('test', ctx.guild.id);
    await data.getOrCreateObject();
    console.log('PLS HELP');
    const tagContext = new TagContext(ctx.client, {
      ctx, content: ctx.input._.raw.join(''),
      author: ctx.author.id, name: 'test',
      isCustomCommand: true
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
        tag: await tag.get('commandName')
      });
      else await ctx.decodeAndSend(this.keys.descreset, {
        tag: await tag.get('commandName')
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
        tag: await tag.get('commandName')
      });
      else await ctx.decodeAndSend(this.keys.descreset, {
        tag: await tag.get('commandName')
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

module.exports = CCCommand;