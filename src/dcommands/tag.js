/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:17:56
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-02-08 13:22:33
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};
var tags = require('../core/tags');

const results = 100;
e.init = () => {
    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;

const reportChannel = '290890240011534337';

const subcommands = [
    {
        name: '<name>',
        args: '<args>',
        desc: 'Executes a tag with the given name'
    },
    {
        name: 'create',
        args: '<name> <content>',
        desc: 'Creates a new tag with the given name and content'
    },
    {
        name: 'edit',
        args: '<name> <content>',
        desc: 'Edits an existing tag with given content, provided that you were the one who created it'
    },
    {
        name: 'delete',
        args: '<name>',
        desc: 'Deletes the tag with the given name, provided that you were the one who created it'
    },
    {
        name: 'rename',
        args: '<tag> <name>',
        desc: 'Renames the tag with the name of of the provided tag to the given name'
    },
    {
        name: 'raw',
        args: '<name>',
        desc: 'Displays the raw code of a tag'
    },
    {
        name: 'info',
        args: '<name>',
        desc: 'Displays information about a tag'
    },
    {
        name: 'top',
        args: '',
        desc: 'Displays the top 5 tags'
    },
    {
        name: 'author',
        args: '<tag>',
        desc: 'Displays the name of the tag\'s author'
    },
    {
        name: 'search',
        args: '<name>',
        desc: 'Searches for a tag based on the provided name'
    },
    {
        name: 'list',
        args: '[author]',
        desc: 'Lists all tags, or tags made by a specific author'
    },
    {
        name: 'favorite',
        alias: 'favourite',
        args: '[tag]',
        desc: 'Adds a tag to your favourite list, or displays your favourite tags'
    },
    {
        name: 'report',
        args: '<tag> <reason>',
        desc: 'Reports a tag as violating the ToS'
    },
    {
        name: 'test',
        args: '<code>',
        desc: 'Executes code in a tag sandbox'
    },
    {
        name: 'help',
        args: '[command]',
        desc: 'Returns general help, or help for the specified subcommand.'
    }
];

e.usage = `tag [${subcommands.map(s => s.name).join(' | ')}]`;


e.info = `Tags are a system of public commands that anyone can create or run, using the BBTag language.

**Subcommands**:
${subcommands.map(s => {
        return '**' + s.name + '**';
    }).join(', ')}

For more information about a subcommand, do \`b!tag help <subcommand>\`
For more information about BBTag, visit <https://blargbot.xyz/tags>
By creating a tag, you acknowledge that you agree to the Terms of Service (<https://blargbot.xyz/tags/tos>)`;
e.longinfo = `<p>
Tags are like public custom commands. You can create them on one guild, and use them on another. Anyone is
capable of making tags. Tags use a <a href="/tags/">tagging system</a>, so they can can range from simple to
complex. See the <a href="/tags/">documentation</a> page for more details.</p>

<p>By creating a tag, you acknowledge that you agree to the <a href="/tags/tos">Terms of Service</a>.</p>

<p>Subcommands:</p>
${subcommands.map(s => {
        let output = '';
        output += '<pre><code>' + bu.escapeHTML(s.name) + ' ' + bu.escapeHTML(s.args) + '</code></pre>';
        output += bu.escapeHTML(s.desc);
        return output;
    }).join('')}
`;
e.alias = ['t'];

const tagNameMsg = 'Enter the name of the tag:';
const tagContentsMsg = 'Enter the tag\'s contents:';


var searchTags = async function (msg, originalTagList, query, page, deleteMsg) {
    let tagList = originalTagList.map(m => m.name);
    let maxPages = Math.floor(originalTagList.length / results) + 1;
    tagList.sort();
    tagList = tagList.slice((page - 1) * results, ((page - 1) * results) + results);
    if (tagList.length != 0) {
        if (deleteMsg) await bot.deleteMessage(deleteMsg.channel.id, deleteMsg.id);
        var message = `Found ${tagList.length}/${originalTagList.length} tags matching '${query}'.\nPage **#${page}/${maxPages}**\n\`\`\`fix\n${tagList.join(', ').trim()}\n\`\`\`\nType a number between 1-${maxPages} to view that page, or type \`c\` to cancel.`;
        let newPage = (await bu.awaitMessage(msg, message, m => {
            let page = parseInt(m.content);
            return m.content.toLowerCase() == 'c' || (!isNaN(page) && page <= maxPages);
        })).content;
        if (newPage.toLowerCase() == 'c') {
            bu.send(msg, 'I hope you found what you were looking for!');
            return;
        }
        let choice = parseInt(newPage);
        deleteMsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
        if (!isNaN(choice) && choice >= 1 && choice <= maxPages) {
            return searchTags(msg, originalTagList, query, choice, deleteMsg);
        } else {
            originalTagList = await r.table('tag').filter(
                r.row('name').match('(?i)' + escapeRegex(newPage))
            ).run();
            if (originalTagList.length == 0) {
                bu.send(msg, 'No results found!');
                return;
            }
            return searchTags(msg, originalTagList, newPage, 1, deleteMsg);
        }
    } else {
        bu.send(msg, 'No results found!');
        return;
    }
};

var listTags = async function (msg, originalTagList, page, author, deleteMsg) {
    let tagList = [];
    if (originalTagList.length == 0) {
        bu.send(msg, 'No results found!');
        return;
    }
    let maxPages = Math.floor(originalTagList.length / results) + 1;
    tagList = originalTagList.map(m => m.name);
    tagList.sort();

    tagList = tagList.slice((page - 1) * results, ((page - 1) * results) + results);
    if (tagList.length != 0) {
        if (deleteMsg) await bot.deleteMessage(deleteMsg.channel.id, deleteMsg.id);
        let message = `Found ${tagList.length}/${originalTagList.length} tags${author ? ' made by **' + bu.getFullName(author) + '**' : ''}.\nPage **#${page}/${maxPages}**\n\`\`\`fix\n${tagList.length == 0 ? 'No results found.' : tagList.join(', ').trim()}\n\`\`\`Type a number between 1-${maxPages} to view that page, or type \`c\` to cancel.`;
        console.debug(message, message.length);
        let newPage = (await bu.awaitMessage(msg, message, m => {
            let page = parseInt(m.content);
            return m.content.toLowerCase() == 'c' || (!isNaN(page) && page <= maxPages);
        })).content;
        if (newPage.toLowerCase() == 'c') {
            bu.send(msg, 'I hope you found what you were looking for!');
            return;
        }
        let choice = parseInt(newPage);
        deleteMsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
        if (!isNaN(choice) && choice >= 1 && choice <= maxPages) {
            return listTags(msg, originalTagList, choice, author, deleteMsg);
        }
    } else {
        bu.send(msg, 'No results found!');
        return;
    }
};

function filterTitle(title) {
    return title.replace(/[^\d\w .,\/#!$%\^&\*;:{}[\]=\-_~()]/gi, '');
}

e.execute = async function (msg, words, text) {
    let page = 0;
    let title, content, tag, author, originalTagList;
    if (words[1]) {
        switch (words[1].toLowerCase()) {
            case 'add':
            case 'create':
                if (words[2]) title = words[2];
                if (words[3]) content = bu.splitInput(text, true).slice(3).join(' ');
                if (!title)
                    title = (await bu.awaitMessage(msg, tagNameMsg)).content;

                title = filterTitle(title);
                tag = await r.table('tag').get(title).run();
                if (tag) {
                    if (tag.deleted) {
                        bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                    } else
                        bu.send(msg, `❌ That tag already exists! ❌`);
                    break;
                }

                if (!content)
                    content = (await bu.awaitMessage(msg, tagContentsMsg)).content;

                //    content = bu.fixContent(content);

                await r.table('tag').insert({
                    name: title,
                    author: msg.author.id,
                    content: content,
                    lastmodified: r.epochTime(dep.moment() / 1000),
                    uses: 0
                }).run();
                bu.send(msg, `✅ Tag \`${title}\` created. ✅`);
                logChange('Create', msg, {
                    tag: title,
                    content: content
                });
                break;
            case 'rename':
                let oldTagName, newTagName;
                if (words[2]) oldTagName = words[2];

                if (words[3]) newTagName = words[3];

                if (!oldTagName) oldTagName = (await bu.awaitMessage(msg, `Enter the name of the tag you wish to rename:`)).content;
                oldTagName = filterTitle(oldTagName);
                let oldTag = await r.table('tag').get(oldTagName).run();
                if (!oldTag) {
                    bu.send(msg, `❌ That tag doesn't exist! ❌`);
                    break;
                }
                if (oldTag.deleted) {
                    bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                    break;
                }
                if (oldTag.author != msg.author.id) {
                    bu.send(msg, `❌ You don't own this tag! ❌`);
                    break;
                }

                if (!newTagName) newTagName = (await bu.awaitMessage(msg, `Enter the new name.`)).content;
                newTagName = filterTitle(newTagName);
                let newTag = await r.table('tag').get(newTagName).run();
                if (newTag) {
                    bu.send(msg, `❌ The tag \`${words[3]}\` already exist! ❌`);
                    break;
                }

                oldTag.name = newTagName;
                await r.table('tag').get(oldTagName).delete().run();
                await r.table('tag').insert(oldTag).run();

                bu.send(msg, `✅ Tag \`${oldTagName}\` has been renamed to \`${newTagName}\`. ✅`);
                logChange('Rename', msg, {
                    oldName: oldTagName,
                    newName: newTagName
                });
                break;
            case 'edit':
                if (words[2]) title = words[2];
                if (words[3]) content = bu.splitInput(text, true).slice(3).join(' ');

                if (!title)
                    title = await bu.awaitMessage(msg, tagNameMsg).content;

                title = filterTitle(title);
                tag = await r.table('tag').get(title).run();
                if (!tag) {
                    bu.send(msg, `❌ That tag doesn't exist! ❌`);
                    break;
                }
                if (tag.deleted) {
                    bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                    break;
                }
                if (tag.author != msg.author.id) {
                    bu.send(msg, `❌ You don't own this tag! ❌`);
                    break;
                }

                if (!content)
                    content = await bu.awaitMessage(msg, tagContentsMsg).content;

                //  content = bu.fixContent(content);

                await r.table('tag').get(title).update({
                    content: content,
                    lastmodified: r.epochTime(dep.moment() / 1000)
                }).run();
                bu.send(msg, `✅ Tag \`${title}\` edited. ✅`);
                logChange('Edit', msg, {
                    tag: title,
                    content: content
                });
                break;
            case 'set':

                if (words[2]) title = words[2];
                if (words[3]) content = bu.splitInput(text, true).slice(3).join(' ');
                //                if (words[3]) content = text.replace(words[0], '').trim().replace(words[1], '').trim().replace(words[2], '').trim();

                if (!title)
                    title = await bu.awaitMessage(msg, tagNameMsg).content;

                title = filterTitle(title);
                tag = await r.table('tag').get(title).run();
                if (tag && tag.deleted) {
                    bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                    break;
                }
                if (tag && tag.author != msg.author.id) {
                    bu.send(msg, `❌ You don't own this tag! ❌`);
                    break;
                }


                if (!content)
                    content = (await bu.awaitMessage(msg, tagContentsMsg)).content;

                //    content = content.replace(/(?:^)(\s+)|(?:\n)(\s+)/g, '');
                console.debug('First:', content, words);
                //  content = bu.fixContent(content);
                console.debug('Second:', content);
                await r.table('tag').get(title).replace({
                    name: title,
                    author: msg.author.id,
                    content: content,
                    lastmodified: r.epochTime(dep.moment() / 1000),
                    uses: tag ? tag.uses : 0
                }).run();
                bu.send(msg, `✅ Tag \`${title}\` ${tag ? 'edited' : 'created'}. ✅`);
                logChange(tag ? 'Edit' : 'Create', msg, {
                    tag: title,
                    content: content
                });

                break;
            case 'remove':
            case 'delete':
                if (words[2]) title = words[2];
                if (!title) title = await bu.awaitMessage(msg, tagNameMsg);

                tag = await r.table('tag').get(title).run();
                if (!tag) {
                    bu.send(msg, `❌ That tag doesn't exist! ❌`);
                    break;
                }
                if (tag.deleted) {
                    bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                    break;
                }
                if (tag.author != msg.author.id && msg.author.id != bu.CAT_ID) {
                    bu.send(msg, `❌ You don't own this tag! ❌`);
                    break;
                }
                await r.table('tag').get(words[2]).delete();
                bu.send(msg, `✅ Tag \`${title}\` is gone forever! ✅`);
                logChange('Delete', msg, {
                    author: `${tag.author == msg.author.id ? msg.author.username : (await r.table('user').get(tag.author)).username} (${tag.author})`,
                    tag: title,
                    content: tag.content
                });
                break;
            case 'help':
                if (words.length > 2) {
                    let command = subcommands.filter(s => {
                        return s.name == words[2].toLowerCase() || s.alias == words[2].toLowerCase();
                    });
                    if (command.length > 0) {
                        await bu.send(msg, `Subcommand: **${command[0].name}**
Args: \`${command[0].args}\`

${command[0].desc}`);
                    } else {
                        await bu.send(msg, 'That subcommand was not found!');
                    }
                } else
                    await bu.send(msg, e.info);
                break;
            case 'raw':
                if (words[2]) title = words[2];
                if (!title) title = await bu.awaitMessage(msg, tagNameMsg);

                tag = await r.table('tag').get(words[2]).run();
                if (!tag) {
                    bu.send(msg, `❌ That tag doesn't exist! ❌`);
                    break;
                }
                if (tag.deleted) {
                    bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                    break;
                }
                let lang = '';
                if (/\{lang;.*?}/i.test(tag.content)) {
                    lang = tag.content.match(/\{lang;(.*?)}/i)[1];
                }
                content = tag.content.replace(/`/g, '`\u200B');
                bu.send(msg, `The code for ${words[2]} is:
\`\`\`${lang}
${content}
\`\`\``);
                break;
            case 'author':
                if (words[2]) title = words[2];
                if (!title) title = await bu.awaitMessage(msg, tagNameMsg);

                tag = await r.table('tag').get(words[2]).run();
                if (!tag) {
                    bu.send(msg, `❌ That tag doesn't exist! ❌`);
                    break;
                }
                if (tag.deleted) {
                    bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                    break;
                }
                author = await r.table('user').get(tag.author).run();
                bu.send(msg, `The tag \`${title}\` was made by **${author.username}#${author.discriminator}**`);
                break;
            case 'top':
                let topTags = await r.table('tag').orderBy(r.desc(r.row('uses'))).limit(10).run();
                let returnMsg = '__Here are the top 10 tags:__\n';
                for (let i = 0; i < topTags.length; i++) {
                    let author = await r.table('user').get(topTags[i].author);
                    returnMsg += `**${i + 1}.** **${topTags[i].name}** (**${author.username}#${author.discriminator}**) - used **${topTags[i].uses} time${topTags[i].uses == 1 ? '' : 's'}**\n`;
                }
                bu.send(msg, returnMsg);
                break;
            case 'info':
                if (words[2]) title = words[2];
                if (!title) title = await bu.awaitMessage(msg, tagNameMsg);
                tag = await r.table('tag').get(words[2]).run();
                if (!tag) {
                    bu.send(msg, `❌ That tag doesn't exist! ❌`);
                    break;
                }
                if (tag.deleted) {
                    bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                    break;
                }
                author = await r.table('user').get(tag.author).run();
                let output = `__**Tag | ${title}** __
Author: **${author.username}#${author.discriminator}**
It was last modified **${dep.moment(tag.lastmodified).format('LLLL')}**.
It has been used a total of **${tag.uses} time${tag.uses == 1 ? '' : 's'}**!
It has been favourited **${tag.favourites || 0} time${(tag.favourites || 0) == 1 ? '' : 's'}**!`;
                if (tag.reports && tag.reports > 0)
                    output += `\n:warning: It has been reported ${tag.reports || 0} **time${(tag.reports == 1 || 0) ? '' : 's'}**!`;
                bu.send(msg, output);
                break;
            case 'search':
                let query;
                if (words[2]) query = words[2];
                if (!query) query = await bu.awaitMessage(msg, `What would you like to search for?`).content;

                page = 1;

                originalTagList = await r.table('tag').filter(
                    r.row('name').match('(?i)' + query)
                ).run();
                if (originalTagList.length == 0) {
                    bu.send(msg, 'No results found!');
                    return;
                }

                searchTags(msg, originalTagList, query, page);
                break;
            case 'list':
                let user;
                if (words[2]) {
                    user = await bu.getUser(msg, words[2]);
                }
                if (user)
                    originalTagList = await r.table('tag').getAll(user.id, {
                        index: 'author'
                    }).run();
                else originalTagList = await r.table('tag').run();

                listTags(msg, originalTagList, 1, user);
                break;
            case 'eval':
            case 'test':
                if (words.length > 2) {
                    let output = await tags.processTag(msg, words.slice(2).join(' '), '', 'test', msg.author.id);
                    await bu.send(msg, `Output:\n${output.trim()}`);
                }
                break;
            case 'favourite':
            case 'favorite':
                if (words.length > 2) {
                    title = filterTitle(words[2]);
                    tag = await r.table('tag').get(words[2]).run();
                    if (!tag) {
                        bu.send(msg, `❌ That tag doesn't exist! ❌`);
                        break;
                    }
                    if (tag.deleted) {
                        bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                        break;
                    }
                    if (!tag.favourites) tag.favourites = 0;
                    let user = await r.table('user').get(msg.author.id).run();
                    if (!user.favourites) user.favourites = {};
                    let output;
                    if (!user.favourites[title]) {
                        user.favourites[title] = true;
                        tag.favourites++;
                        output = `The tag \`${title}\` is now on your favourites list!`;
                    } else {
                        user.favourites[title] = undefined;
                        tag.favourites--;
                        output = `The tag \`${title}\` is no longer on your favourites list!`;
                    }
                    await r.table('tag').get(title).update({
                        favourites: r.literal(tag.favourites)
                    });
                    await r.table('user').get(msg.author.id).update({
                        favourites: r.literal(user.favourites)
                    });
                    await bu.send(msg, output);
                } else {
                    let user = await r.table('user').get(msg.author.id);
                    if (!user.favourites) user.favourites = {};
                    let output = `You have ${Object.keys(user.favourites).length} favourite tags. \`\`\`fix
${Object.keys(user.favourites).join(', ')}              
\`\`\` `;
                    await bu.send(msg, output);
                }

                break;
            case 'report':
                if (words.length > 2) {
                    title = filterTitle(words[2]);
                    tag = await r.table('tag').get(words[2]).run();
                    if (!tag) {
                        bu.send(msg, `❌ That tag doesn't exist! ❌`);
                        break;
                    }
                    if (tag.deleted) {
                        bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                        break;
                    }
                    if (!tag.reports) tag.reports = 0;
                    let user = await r.table('user').get(msg.author.id).run();
                    if (user.reportblock) {
                        return await bu.send(msg, user.reportblock);
                    }
                    if (!user.reports) user.reports = {};
                    let output;
                    if (words.length > 3) {
                        if (user.reports[title] == undefined)
                            tag.reports++;
                        user.reports[title] = words.slice(3).join(' ');
                        output = `The tag \`${title}\` has been reported.`;
                        await bu.send(reportChannel, `**${bu.getFullName(msg.author)}** has reported the tag: ${title}

${user.reports[title]}`);
                    } else if (user.reports[title] != undefined) {
                        user.reports[title] = undefined;
                        tag.reports--;
                        output = `The tag \`${title}\` is no longer being reported by you.`;
                        await bu.send(reportChannel, `**${bu.getFullName(msg.author)}** is no longer reporting the tag: ${title}`);
                    } else {
                        output = `Please provide a reason for your report.`;
                    }
                    await r.table('tag').get(title).update({
                        reports: r.literal(tag.reports)
                    });
                    await r.table('user').get(msg.author.id).update({
                        reports: r.literal(user.reports)
                    });
                    await bu.send(msg, output);
                } else {
                    let user = await r.table('user').get(msg.author.id);
                    if (!user.favourites) user.favourites = {};
                    let output = `You have ${Object.keys(user.favourites).length} favourite tags. \`\`\`fix
${Object.keys(user.favourites).join(', ')}              
\`\`\` `;
                    await bu.send(msg, output);
                }

                break;
            case 'permdelete':
                if (msg.author.id == bu.CAT_ID)
                    if (words.length > 3) {
                        title = filterTitle(words[2]);
                        tag = await r.table('tag').get(words[2]).run();
                        if (!tag) {
                            bu.send(msg, `❌ That tag doesn't exist! ❌`);
                            break;
                        }
                        tag.deleter = msg.author.id;
                        tag.reason = words.slice(3).join(' ');
                        tag.deleted = true;
                        tag.uses = 0;
                        tag.favourites = 0;
                        await r.table('tag').get(title).replace(tag);
                        await bu.send(msg, 'The tag has been deleted.');
                    } else {
                        await bu.send(msg, 'You must provide a reason.');
                    }
                break;
            default:
                var command = words.slice(2);

                tags.executeTag(msg, filterTitle(words[1]), command);
                break;
        }
    } else {
        bu.send(msg, e.info);
    }
};
const Message = require('eris/lib/structures/Message')

e.event = async function (args) {
    let msg;
    if (args.params.msg) {
        try {
            msg = await bot.getMessage(args.channel, args.params.msg);
        } catch (err) {
            msg = JSON.parse(args.msg);
            msg.channel_id = args.channel;
            msg.mentions_everyone = msg.mentionEveryone;
            msg.role_mentions = msg.roleMentions;
            msg.reactions = [];
            msg = new Message(msg, bot);
        }
    } else {
        let channel = bot.getChannel(args.channel);
        if (!channel) return;
        let tmsg = JSON.parse(args.msg);
        msg = {
            channel,
            author: bot.users.get(tmsg.author.id),
            member: channel.guild.members.get(tmsg.author.id),
            guild: channel.guild
        };
    }
    let params = args.params;
    params.msg = msg;
    params.msg.didTimer = true;
    let output = await bu.processTagInner(params, 1);
    bu.send(params.msg.channel.id, {
        content: output,
        disableEveryone: false
    });
};

function escapeRegex(str) {
    return (str + '').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}

function logChange(action, msg, actionObj) {
    let actionArray = [];
    let file = actionObj.content ? { name: actionObj.tag + '.bbtag', file: actionObj.content } : undefined;
    for (let key in actionObj) {
        if (actionObj[key].length > 1000) actionObj[key] = actionObj[key].substring(0, 1000) + '... (too long)';
        actionArray.push({
            name: key,
            value: actionObj[key],
            inline: true
        });
    }
    let color = 0x000000;
    switch (action.split(' ')[0].toLowerCase()) {
        case 'create':
            color = 0x0eed24;
            break;
        case 'edit':
            color = 0x6b0eed;
            break;
        case 'delete':
            color = 0xf20212;
            break;
        case 'rename':
            color = 0x02f2ee;
            break;
    }
    bu.send('230810364164440065', {
        embed: {
            title: action,
            color: color,
            fields: actionArray,
            author: {
                name: bu.getFullName(msg.author),
                icon_url: msg.author.avatarURL,
                url: `https://blargbot.xyz/user/${msg.author.id}`
            },
            timestamp: dep.moment(msg.timestamp),
            footer: {
                text: `MsgID: ${msg.id}`
            }
        }
    }, file);
}
