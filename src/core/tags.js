/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:34:15
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-26 01:09:00
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const argFactory = require('../structures/ArgumentFactory');

var e = module.exports = {};

e.processTag = async function (msg, contents, command, tagName, author, isCcommand) {
    try {
        author = author || msg.channel.guild.id;
        var words = typeof command === 'string' ? bu.splitInput(command) : command;

        if (contents.toLowerCase().indexOf('{nsfw') > -1) {
            let nsfwChan = await bu.isNsfwChannel(msg.channel.id);
            if (!nsfwChan) {
                bu.send(msg, `❌ This tag contains NSFW content! Go to an NSFW channel. ❌`);
                return;
            }
        }

        if (contents.split(' ')[0].indexOf('help') > -1) {
            contents = '\u200B' + contents;
        }
        contents = contents.replace(new RegExp(bu.specialCharBegin, 'g'), '').replace(new RegExp(bu.specialCharDiv, 'g'), '').replace(new RegExp(bu.specialCharEnd, 'g'), '');

        contents = await bu.processTag({
            msg,
            words,
            contents,
            author,
            tagName,
            ccommand: isCcommand
        });
        contents = bu.processSpecial(contents.contents, true);
    } catch (err) {
        console.error(err);
    }
    return contents;
};

e.executeTag = async function (msg, tagName, command) {
    let tag = await r.table('tag').get(tagName).run();
    if (!tag)
        bu.send(msg, `❌ That tag doesn't exist! ❌`);
    else {
        if (tag.deleted === true) {
            await bu.send(msg, `❌ That tag has been permanently deleted by **${bu.getFullName(bot.users.get(tag.deleter))}**

Reason: ${tag.reason}`);
            return;
        }
        if (tag.content.toLowerCase().indexOf('{nsfw') > -1) {
            let nsfwChan = await bu.isNsfwChannel(msg.channel.id);
            if (!nsfwChan) {
                bu.send(msg, `❌ This command contains NSFW content! Go to an NSFW channel. ❌`);
                return;
            }
        }
        r.table('tag').get(tagName).update({
            uses: tag.uses + 1,
            lastuse: r.now()
        }).run();
        var message = await e.processTag(msg, tag.content, command, tagName, tag.author);
        while (/<@!?[0-9]{17,21}>/.test(message)) {
            let match = message.match(/<@!?([0-9]{17,21})>/)[1];
            console.debug(match);
            let obtainedUser = await bu.getUser(msg, match, true);
            let name = '';
            if (obtainedUser) {
                name = `@${obtainedUser.username}#${obtainedUser.discriminator}`;
            } else {
                name = `@${match}`;
            }
            message = message.replace(new RegExp(`<@!?${match}>`, 'g'), name);
        }
        if (message != '')
            bu.send(msg, message);
    }
};

e.sendHelp = async function (msg, message, type) {
    if (typeof message != 'object')
        message = { content: message };

    if (msg.channel.guild && await bu.guildSettings.get(msg.channel.guild.id, 'dmhelp')) {
        let dmChannel = await bot.getDMChannel(msg.author.id);
        await bu.send(msg, '📧 DMing you the ' + type + ' 📧');
        message.content = 'Here is the ' + type + ' you requested in <#' + msg.channel.id + '>\n' + message.content;
        await bu.send(dmChannel.id, message);
    } else
        await bu.send(msg, message);
};


e.docs = async function (msg, command, topic, ccommand = false) {
    let tags = Object.keys(TagManager.list).map(k => TagManager.list[k]),
        prefix = '',
        embed = {
            title: 'BBTag documentation',
            url: 'https://blargbot.xyz/tags',
            color: 0Xefff00,
            author: {
                name: bot.user.username,
                icon_url: bot.user.avatarURL
            }
        };
    if (msg.channel.guild)
        prefix = await bu.guildSettings.get(msg.channel.guild.id, 'prefix') || config.discord.defaultPrefix;

    if (!ccommand)
        tags = tags.filter(t => t.category != bu.TagType.CCOMMAND);

    switch ((topic || 'index').toLowerCase()) {
        case 'index':
            embed.description = 'Please use `' + prefix + command + ' docs [topic]` to view available information on a topic\nAvailable topics are:';
            embed.fields = Object.keys(bu.TagType.properties)
                .map(k => {
                    return {
                        properties: bu.TagType.properties[k],
                        tags: tags.filter(t => t.category == k)
                    };
                }).filter(c => c.tags.length > 0)
                .map(c => {
                    return {
                        name: c.properties.name + ' subtags (' + c.properties.desc + ')',
                        value: '```\n' + c.tags.map(t => t.name).join(', ') + '```'
                    };
                }).concat({
                    name: 'Other useful resources',
                    value: '```\nvariables, terminology```'
                }).filter(f => f.value.length > 0);
            await e.sendHelp(msg, { embed }, 'BBTag documentation');
            return;
        default:
            let tag = tags.filter(t => t.name == topic.toLowerCase())[0];
            if (tag == null)
                break;
            embed.description = tag.desc;
            embed.title += ' - ' + tag.name;
            embed.url += '/#' + encodeURIComponent(tag.name);
            embed.fields = [
                {
                    name: 'Usage',
                    value: '```\n{' + tag.name + ';' + argFactory.toString(tag.args, {
                        separator: { default: ';' }
                    }) + '}```',
                    inline: true
                }
            ];
            if (tag.exampleCode)
                embed.fields.push({
                    name: 'Example code',
                    value: '```\n\u200B' + tag.exampleCode + '\u200B```'
                });
            if (tag.exampleIn)
                embed.fields.push({
                    name: 'Example user input',
                    value: '```\n\u200B' + tag.exampleIn + '\u200B```'
                });
            if (tag.exampleOut)
                embed.fields.push({
                    name: 'Example output',
                    value: '```\n\u200B' + tag.exampleOut + '\u200B```'
                });
            await e.sendHelp(msg, { embed }, 'BBTag documentation');
            return;
    }

    await bu.send(msg, 'Oops, I didnt recognise that topic! Try using `' + prefix + command + ' docs` for a list of all topics');
};