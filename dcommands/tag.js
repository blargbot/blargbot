var e = module.exports = {};
var bu;
var tags = require('./../tags');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const moment = require('moment');

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'tag [<name> | create | rename | edit | delete | raw | author | search | list | help]';

e.info = `Tags are a system of public commands that anyone can create or run, using the BBTag language.

__**Usage:**__
  **tag <name>** - executes tag with given name
  **tag create <name> <content>** - creates a new tag with given name and content
  **tag edit <name> <content>** - edits an existing tag with given content, provided that you were the one who created it
  **tag set <name> <content>** - provides the functionality of \`create\` and \`edit\` in a single command
  **tag delete <name>** - deletes the tag with given name, provided that you own it
  **tag rename <tag1> <tag2>** - renames the tag by the name of \`tag1\` to \`tag2\`
  **tag raw <name>** - displays the raw code of a tag
  **tag info <name>** - displays information about a tag
  **tag top** - displays information about the top 5 tags
  **tag author <tag>** - displays the name of who made the tag
  **tag search [page] <name>** - searches for a tag based on the provided name
  **tag list [page] [author]** - lists all tags, or tags made by a specific author
  **tag help** - shows this message

NOTE: Any NSFW tags must contain \`{nsfw}\` somewhere in their body, or they will be deleted and you will be blacklisted.

For more information about BBTag, visit https://blargbot.xyz/tags`;
e.longinfo = `<p>
        Tags are like public custom commands. You can create them on one guild, and use them on another. Anyone is
        capable of making tags. Tags use a <a href="/tags/">tagging system</a>, so they can can range from simple to
        complex. See the <a href="/tags/">tag</a> page for more details.
    </p>
    <pre><code>tag &lt;name&gt;</code></pre>
    <p>
        Executes a tag with the given name.
    </p>
    <pre><code>tag create &lt;name&gt; &lt;content&gt;</code></pre>
    <p>
        Creates a tag with the given name and content. The name must be unique.
    </p>
    <pre><code>tag edit &lt;name&gt; &lt;content&gt;</code></pre>
    <p>Edits an existing tag. You must own it to edit it!</p>
    <pre><code>tag set &lt;name&gt; &lt;content&gt;</code></pre>
    <p>Provides the functionality of create and edit in a single command.</p>
    <pre><code>tag delete &lt;name&gt;</code></pre>
    <p>Deletes the specified tag. You must own it to delete it!</p>
    <pre><code>tag rename &lt;name&gt; &lt;new name&gt;</code></pre>    
    <p>Renames an existing tag to something else. You must own it to rename it!<p>
    <pre><code>tag raw &lt;name&gt;</code></pre>
    <p>Displays the raw code of a given tag.</p>
    <pre><code>tag info &lt;name&gt;</code></pre>
    <p>Displays information about a given tag.</p>
    <pre><code>tag top</code></pre>
    <p>Displays information about the top 5 tags.</p>
    <pre><code>tag author &lt;name&gt;</code></pre>
    <p>Tells you who made the specified tag</p>
    <pre><code>tag search &lt;name&gt;</code></pre>
    <p>Searches for tags with given name</p>
    <pre><code>tag list</code></pre>
    <p>Lists all tags</p>
    <pre><code>help tag</code></pre>
    <p>Gets basic help tag.</p>`;
e.alias = ['t'];

e.execute = async((msg, words, text) => {
    let page = 0;
    let index = 3;
    if (words[1]) {
        var tagList;
        switch (words[1].toLowerCase()) {
            case 'create':
                if (words.length > 3) {
                    var title = words[2].replace(/[^\u0020\u0021\u0022\u0023\u0024\u0025\u0026\u0027\u0028\u0029\u002a\u002b\u002c\u002d\u002e\u002f\u0030\u0031\u0032\u0033\u0034\u0035\u0036\u0037\u0038\u0039\u003a\u003b\u003c\u003d\u003e\u003f\u0040\u0041\u0042\u0043\u0044\u0045\u0046\u0047\u0048\u0049\u004a\u004b\u004c\u004d\u004e\u004f\u0050\u0051\u0052\u0053\u0054\u0055\u0056\u0057\u0058\u0059\u005a\u005b\u005d\u005e\u005f\u0061\u0062\u0063\u0064\u0065\u0066\u0067\u0068\u0069\u006a\u006b\u006c\u006d\u006e\u006f\u0070\u0071\u0072\u0073\u0074\u0075\u0076\u0077\u0078\u0079\u007a\u007b\u007c\u007d\u007e]/ig, '');
                    let tag = await(bu.r.table('tag').get(title).run());
                    if (!tag) {
                        await(bu.r.table('tag').insert({
                            name: title,
                            author: msg.author.id,
                            content: words.slice(3).join(' '),
                            lastmodified: bu.r.epochTime(moment().valueOf()),
                            uses: 0
                        }).run());
                        bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${title}\` created. ✅`);
                        bu.send('230810364164440065', `**__Create__**:\n  **User:** ${msg.author.username} (${msg.author.id})\n  **Tag:** ${words[2]}\n  **Contents**: \`\`\`${words.splice(3).join(' ')}\`\`\``);
                    } else {
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag already exists! ❌`);
                    }
                } else {
                    bu.send(msg.channel.id, 'Not enough arguments! Do `help tag` for more information.');
                }
                break;
            case 'rename':
                if (words.length > 3) {
                    let oldTag = await(bu.r.table('tag').get(words[2]).run());
                    if (oldTag) {
                        if (oldTag.author != msg.author.id) {
                            bu.sendMessageToDiscord(msg.channel.id, `❌ You don't own this tag! ❌`);
                            return;
                        }
                        let newTag = await(bu.r.table('tag').get(words[3]).run());
                        if (newTag) {
                            bu.sendMessageToDiscord(msg.channel.id, `❌ The tag \`${words[3]}\` already exist! ❌`);
                            return;
                        }
                        oldTag.name = words[3];
                        await(bu.r.table('tag').get(words[2]).replace(oldTag).run());

                        bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${words[2]}\` has been renamed to \`${words[3]}\`. ✅`);
                        bu.send('230810364164440065', `**__Rename__**:\n  **User:** ${msg.author.username} (${msg.author.id})\n  **Old Tag:** ${words[2]}\n  **New Tag**: ${words[3]}`);
                    }
                } else {
                    bu.send(msg.channel.id, 'Not enough arguments! Do `help tag` for more information.');
                }
                break;
            case 'edit':
                if (words.length > 3) {
                    let storedTag = await(bu.r.table('tag').get(words[2]).run());
                    if (!storedTag) {
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                        return;
                    }
                    if (storedTag.author == msg.author.id) {
                        let content = words.splice(3).join(' ');
                        await(bu.r.table('tag').get(words[2]).update({
                            content: content,
                            lastmodified: bu.r.epochTime(moment().valueOf())
                        }).run());
                        bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${words[2]}\` edited. ✅`);
                        bu.send('230810364164440065', `**__Edit__**:\n  **User:** ${msg.author.username} (${msg.author.id})\n  **Tag:** ${words[2]}\n  **Contents**: \`\`\`${content}\`\`\``);
                    } else {
                        bu.sendMessageToDiscord(msg.channel.id, `❌ You don't own this tag! ❌`);
                    }
                } else {
                    bu.send(msg.channel.id, 'Not enough arguments! Do `help tag` for more information.');
                }
                break;
            case 'set':
                if (words.length > 3) {
                    let title = words[2].replace(/[^\u0020\u0021\u0022\u0023\u0024\u0025\u0026\u0027\u0028\u0029\u002a\u002b\u002c\u002d\u002e\u002f\u0030\u0031\u0032\u0033\u0034\u0035\u0036\u0037\u0038\u0039\u003a\u003b\u003c\u003d\u003e\u003f\u0040\u0041\u0042\u0043\u0044\u0045\u0046\u0047\u0048\u0049\u004a\u004b\u004c\u004d\u004e\u004f\u0050\u0051\u0052\u0053\u0054\u0055\u0056\u0057\u0058\u0059\u005a\u005b\u005d\u005e\u005f\u0061\u0062\u0063\u0064\u0065\u0066\u0067\u0068\u0069\u006a\u006b\u006c\u006d\u006e\u006f\u0070\u0071\u0072\u0073\u0074\u0075\u0076\u0077\u0078\u0079\u007a\u007b\u007c\u007d\u007e]/ig, '');
                    let storedTag = await(bu.r.table('tag').get(title).run());
                    if (!storedTag) {
                        await(bu.r.table('tag').insert({
                            name: title,
                            author: msg.author.id,
                            content: words.slice(3).join(' '),
                            lastmodified: bu.r.epochTime(moment().valueOf()),
                            uses: 0
                        }).run());
                        bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${title}\` created. ✅`);
                        bu.send('230810364164440065', `**__Create__**:\n  **User:** ${msg.author.username} (${msg.author.id})\n  **Tag:** ${words[2]}\n  **Contents**: \`\`\`${words.splice(3).join(' ')}\`\`\``);
                        return;
                    }
                    if (storedTag.author == msg.author.id) {
                        let content = words.splice(3).join(' ');
                        await(bu.r.table('tag').get(words[2]).update({
                            content: content,
                            lastmodified: bu.r.epochTime(moment().valueOf())
                        }).run());
                        bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${words[2]}\` edited. ✅`);
                        bu.send('230810364164440065', `**__Edit__**:\n  **User:** ${msg.author.username} (${msg.author.id})\n  **Tag:** ${words[2]}\n  **Contents**: \`\`\`${content}\`\`\``);
                    } else {
                        bu.sendMessageToDiscord(msg.channel.id, `❌ You don't own this tag! ❌`);
                    }
                } else {
                    bu.send(msg.channel.id, 'Not enough arguments! Do `help tag` for more information.');
                }
                break;
            case 'delete':
                if (words.length > 2) {
                    let storedTag = await(bu.r.table('tag').get(words[2]).run());
                    if (!storedTag) {
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                        return;
                    }
                    if (storedTag.author == msg.author.id) {
                        await(bu.r.table('tag').get(words[2]).delete());
                        bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${words[2]}\` is gone forever! ✅`);
                        bu.send('230810364164440065', `**__Delete__**:\n  **User:** ${msg.author.username} (${msg.author.id})\n  **Tag:** ${words[2]}`);
                    } else {
                        bu.sendMessageToDiscord(msg.channel.id, `❌ You don't own this tag! ❌`);
                        return;
                    }
                } else {
                    bu.send(msg.channel.id, 'Not enough arguments! Do `help tag` for more information.');
                }
                break;
            case 'help':
                bu.sendMessageToDiscord(msg.channel.id, e.info);
                break;
            case 'raw':
                if (words.length > 2) {
                    let storedTag = await(bu.r.table('tag').get(words[2]).run());
                    if (!storedTag) {
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                        return;
                    }
                    let lang = '';
                    if (/\{lang;.*?}/i.test(storedTag.content)) {
                        lang = storedTag.content.match(/\{lang;(.*?)}/i)[1];
                    }
                    bu.send(msg.channel.id, `The code for ${words[2]} is:
\`\`\`${lang}
${storedTag.content}
\`\`\``);
                } else {
                    bu.send(msg.channel.id, 'Not enough arguments! Do `help tag` for more information.');

                }
                break;
            case 'author':
                if (words.length > 2) {
                    let storedTag = await(bu.r.table('tag').get(words[2]).run());
                    if (!storedTag) {
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                        return;
                    }
                    let author = await(bu.r.table('user').get(storedTag.author).run());
                    bu.sendMessageToDiscord(msg.channel.id, `The tag \`${words[2]}\` was made by **${author.username}#${author.discriminator}**`);
                } else {
                    bu.send(msg.channel.id, 'Not enough arguments! Do `help tag` for more information.');
                }
                break;
            case 'top':
                let topTags = await(bu.r.table('tag').orderBy(bu.r.desc(bu.r.row('uses'))).limit(5).run());
                let returnMsg = '__Here are the top 5 tags:__\n';
                for (let i = 0; i < topTags.length; i++) {
                    let author = await(bu.r.table('user').get(topTags[i].author));
                    returnMsg += `**${i + 1}.** **${topTags[i].name}** (**${author.username}#${author.discriminator}**) - used **${topTags[i].uses} time${topTags[i].uses == 1 ? '' : 's'}**\n`;
                }
                bu.send(msg.channel.id, returnMsg);
                break;
            case 'info':
                if (words.length > 2) {
                    let storedTag = await(bu.r.table('tag').get(words[2]).run());
                    if (!storedTag) {
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                        return;
                    }
                    let author = await(bu.r.table('user').get(storedTag.author).run());
                    bu.sendMessageToDiscord(msg.channel.id, `__**Tag | ${words[2]}** __
Author: **${author.username}#${author.discriminator}**
It was last modified **${moment(storedTag.lastmodified).format('LLLL')}**.
It has been used a total of **${storedTag.uses} time${storedTag.uses == 1 ? '' : 's'}**!`);
                } else {
                    bu.send(msg.channel.id, 'Not enough arguments! Do `help tag` for more information.');
                }
                break;
            case 'search':
                if (words.length > 2) {
                    page = 1;
                    if (words[2]) {
                        if (/^[\d]+$/.test(words[2])) {
                            page = parseInt(words[2]);
                        } else {
                            index = 2;
                        }
                    }
                    let originalTagList = await(bu.r.table('tag').filter(
                        bu.r.row('name').match('(?i)' + words[index])
                    ).run());
                    if (originalTagList.length == 0) {
                        bu.send(msg.channel.id, 'No results found!');
                        return;
                    }
                    tagList = originalTagList.map(m => m.name);

                    tagList.sort();
                    tagList = tagList.splice((page - 1) * 100, 100);

                    var message = `Returned ${tagList.length}/${originalTagList.length} tags matching '${words[index]}'.\nPage **#${page}/${Math.floor(originalTagList.length / 100) + 1}**\n\`\`\`fix\n${tagList.length == 0 ? 'No results found.' : tagList.join(', ').trim()}\n\`\`\``;
                    bu.sendMessageToDiscord(msg.channel.id, message);
                } else {
                    bu.send(msg.channel.id, 'Not enough arguments! Do `help tag` for more information.');
                }
                break;

            case 'list':
                page = 1;
                if (words[2]) {
                    if (/^[\d]+$/.test(words[2])) {
                        page = parseInt(words[2]);
                    } else {
                        index = 2;
                    }
                }
                if (!words[index]) {
                    tagList = [];
                    let originalTagList = await(bu.r.table('tag').run());
                    if (originalTagList.length == 0) {
                        bu.send(msg.channel.id, 'No results found!');
                        return;
                    }
                    tagList = originalTagList.map(m => m.name);
                    tagList.sort();
                    //  bu.logger.debug(tagList.length, tagList);                    
                    tagList = tagList.splice((page - 1) * 100, 100);
                    //  bu.logger.debug((page - 1) * 100, tagList.length, tagList);


                    let message = `Returned ${tagList.length}/${originalTagList.length} tags.\nPage **#${page}/${Math.floor(originalTagList.length / 100) + 1}**\n\`\`\`fix\n${tagList.length == 0 ? 'No results found.' : tagList.join(', ').trim()}\n\`\`\``;
                    bu.sendMessageToDiscord(msg.channel.id, message);
                } else {
                    tagList = [];
                    var userToSearch = words.slice(index).join(' ');
                    bu.logger.debug(userToSearch);
                    var obtainedUser = bu.getUserFromName(msg, userToSearch);
                    if (!obtainedUser) {
                        break;
                    }

                    let originalTagList = await(bu.r.table('tag').filter(
                        bu.r.row('author').eq(obtainedUser.id)
                    ).run());
                    if (originalTagList.length == 0) {
                        bu.send(msg.channel.id, 'No results found!');
                        return;
                    }
                    tagList = originalTagList.map(m => m.name);

                    tagList.sort();
                    tagList = tagList.splice((page - 1) * 100, 100);

                    let message = `Returned ${tagList.length}/${originalTagList.length} tags made by **${obtainedUser.username}#${obtainedUser.discriminator}**.\nPage **#${page}/${Math.floor(originalTagList.length / 100) + 1}**\n\`\`\`fix\n${tagList.length == 0 ? 'No results found.' : tagList.join(', ').trim()}\n\`\`\``;
                    bu.sendMessageToDiscord(msg.channel.id, message);
                }
                break;
            default:
                var command = words.slice(2).join(' ');
                tags.executeTag(msg, words[1], command);
                break;
        }
    } else {
        bu.sendMessageToDiscord(msg.channel.id, tagHelp);
    }
});


var tagHelp = `\`\`\`prolog
Tag Usage
  Tag <name> - executes tag with given name
  Tag Create <name> <content> - creates a new tag with given name and content
  Tag Rename <tag1> <tag2> - renames the tag by the name of \`tag1\` to \`tag2\`
  Tag Edit <name> <content> - edits an existing tag with given content, provided that you were the one who created it
  Tag Delete <name> - deletes the tag with given name, provided that you own it
  Tag Raw <name> - displays the raw code of a tag
  Tag Author <tag> - displays the name of who made the tag
  Tag Search [page] <name> - searches for a tag based on the provided name
  Tag List [page] [author] - lists all tags, or tags made by a specific author
  help tag - shows this message
NOTE: Any NSFW tags must contain '{nsfw}' somewhere in their body, or they will be deleted and you will be blacklisted.
\`\`\`
For more information about tags, visit https://blargbot.xyz/tags`;


function escapeRegex(str) {
    return (str + '').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}