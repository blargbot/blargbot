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

const tagNameMsg = 'Enter the name of the tag:';
const tagContentsMsg = 'Enter the tag\'s contents:';


var searchTags = async((msg, originalTagList, query, page, deleteMsg) => {
    let tagList = originalTagList.map(m => m.name);
    let maxPages = Math.floor(originalTagList.length / 100) + 1;
    tagList.sort();
    tagList = tagList.slice((page - 1) * 100);
    if (tagList.length != 0) {
        if (deleteMsg) await(bot.deleteMessage(deleteMsg.channel.id, deleteMsg.id));
        var message = `Found ${originalTagList.length} tags matching '${query}'.\nPage **#${page}/${maxPages}**\n\`\`\`fix\n${tagList.join(', ').trim()}\n\`\`\`\nType a number between 1-${maxPages} to view that page, type \`c\` to cancel, or type anything else to perform another search.`;
        let newPage = await(bu.awaitMessage(msg, message)).content;
        if (newPage.toLowerCase() == 'c') {
            bu.send(msg.channel.id, 'I hope you found what you were looking for!');
            return;
        }
        let choice = parseInt(newPage);
        deleteMsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
        if (!isNaN(choice) && choice >= 1 && choice <= maxPages) {
            return searchTags(msg, originalTagList, query, choice, deleteMsg);
        } else {
            originalTagList = await(bu.r.table('tag').filter(
                bu.r.row('name').match('(?i)' + escapeRegex(newPage))
            ).run());
            if (originalTagList.length == 0) {
                bu.send(msg.channel.id, 'No results found!');
                return;
            }
            return searchTags(msg, originalTagList, newPage, 1, deleteMsg);
        }
    } else {
        bu.send(msg.channel.id, 'No results found!');
        return;
    }
});

var listTags = async((msg, originalTagList, page, author, deleteMsg) => {

    let tagList = [];
    if (originalTagList.length == 0) {
        bu.send(msg.channel.id, 'No results found!');
        return;
    }
    let maxPages = Math.floor(originalTagList.length / 100) + 1;
    tagList = originalTagList.map(m => m.name);
    tagList.sort();
    bu.logger.debug(tagList.length, tagList);

    tagList = tagList.slice((page - 1) * 100);
    bu.logger.debug((page - 1) * 100, tagList.length, tagList);
    if (tagList.length != 0) {
        if (deleteMsg) await(bot.deleteMessage(deleteMsg.channel.id, deleteMsg.id));
        let message = `Found ${originalTagList.length} tags${author ? ` made by **${author.username}#${author.discriminator}**` : ''}.\nPage **#${page}/${maxPages}**\n\`\`\`fix\n${tagList.length == 0 ? 'No results found.' : tagList.join(', ').trim()}\n\`\`\`Type a number between 1-${maxPages} to view that page, type \`c\` to cancel, or type anything else to look up tags made by a specific user.`;
        let newPage = await(bu.awaitMessage(msg, message)).content;
        if (newPage.toLowerCase() == 'c') {
            bu.send(msg.channel.id, 'I hope you found what you were looking for!');
            return;
        }
        let choice = parseInt(newPage);
        deleteMsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
        if (!isNaN(choice) && choice >= 1 && choice <= maxPages) {
            return listTags(msg, originalTagList, choice, author, deleteMsg);
        } else {
            author = await(bu.getUser(msg, newPage));
            if (author)
                originalTagList = await(bu.r.table('tag').getAll(author.id, { index: 'author' }).run());
            else
                originalTagList = await(bu.r.table('tag').run());
            if (originalTagList.length == 0) {
                bu.send(msg.channel.id, 'No results found!');
                return;
            }
            return listTags(msg, originalTagList, 1, newPage, deleteMsg);
        }
    } else {
        bu.send(msg.channel.id, 'No results found!');
        return;
    }
});

e.execute = async((msg, words) => {
    let page = 0;
    let index = 3;
    let title, content, tag, author, originalTagList;

    if (words[1]) {
        var tagList;
        switch (words[1].toLowerCase()) {
            case 'create':
                if (words[2]) title = words[2];
                if (words[3]) content = words.slice(3).join(' ');

                if (!title)
                    title = await(bu.awaitMessage(msg, tagNameMsg)).content;

                title = title.replace(/[^\d\w .,\/#!$%\^&\*;:{}=\-_`~()@]/gi, '');
                tag = await(bu.r.table('tag').get(title).run());
                if (tag) {
                    bu.send(msg.channel.id, `❌ That tag already exists! ❌`);
                    break;
                }

                if (!content)
                    content = await(bu.awaitMessage(msg, tagContentsMsg)).content;

                await(bu.r.table('tag').insert({
                    name: title,
                    author: msg.author.id,
                    content: content,
                    lastmodified: bu.r.epochTime(moment() / 1000),
                    uses: 0
                }).run());
                bu.send(msg.channel.id, `✅ Tag \`${title}\` created. ✅`);
                logChange('Create', {
                    user: `${msg.author.username} (${msg.author.id})`,
                    tag: title,
                    content: content
                });
                break;
            case 'rename':
                let oldTagName, newTagName;
                if (words[2]) oldTagName = words[2];

                if (words[3]) newTagName = words[3];

                if (!oldTagName) oldTagName = await(bu.awaitMessage(msg, `Enter the name of the tag you wish to rename:`)).content;

                let oldTag = await(bu.r.table('tag').get(oldTagName).run());
                if (!oldTag) {
                    bu.send(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                    break;
                }
                if (oldTag.author != msg.author.id) {
                    bu.send(msg.channel.id, `❌ You don't own this tag! ❌`);
                    break;
                }

                if (!newTagName) newTagName = await(bu.awaitMessage(msg, `Enter the new name.`)).content;
                let newTag = await(bu.r.table('tag').get(newTagName).run());
                if (newTag) {
                    bu.send(msg.channel.id, `❌ The tag \`${words[3]}\` already exist! ❌`);
                    break;
                }

                oldTag.name = newTagName;
                bu.logger.debug(oldTag);
                await(bu.r.table('tag').get(oldTagName).delete().run());
                await(bu.r.table('tag').insert(oldTag).run());

                bu.send(msg.channel.id, `✅ Tag \`${oldTagName}\` has been renamed to \`${newTagName}\`. ✅`);
                logChange('Rename', {
                    user: `${msg.author.username} (${msg.author.id})`,
                    oldName: oldTagName,
                    newName: newTagName
                });
                break;
            case 'edit':
                if (words[2]) title = words[2];
                if (words[3]) content = words.slice(3).join(' ');

                if (!title)
                    title = await(bu.awaitMessage(msg, tagNameMsg)).content;

                title = title.replace(/[^\d\w .,\/#!$%\^&\*;:{}=\-_`~()@]/gi, '');
                tag = await(bu.r.table('tag').get(title).run());
                if (!tag) {
                    bu.send(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                    break;
                }
                if (tag.author != msg.author.id) {
                    bu.send(msg.channel.id, `❌ You don't own this tag! ❌`);
                    break;
                }

                if (!content)
                    content = await(bu.awaitMessage(msg, tagContentsMsg)).content;



                await(bu.r.table('tag').get(title).update({
                    content: content,
                    lastmodified: bu.r.epochTime(moment() / 1000)
                }).run());
                bu.send(msg.channel.id, `✅ Tag \`${title}\` edited. ✅`);
                logChange('Edit', {
                    user: `${msg.author.username} (${msg.author.id})`,
                    tag: title,
                    content: content
                });
                break;
            case 'set':

                if (words[2]) title = words[2];
                if (words[3]) content = words.slice(3).join(' ');

                if (!title)
                    title = await(bu.awaitMessage(msg, tagNameMsg)).content;

                title = title.replace(/[^\d\w .,\/#!$%\^&\*;:{}=\-_`~()@]/gi, '');
                tag = await(bu.r.table('tag').get(title).run());
                if (tag && tag.author != msg.author.id) {
                    bu.send(msg.channel.id, `❌ You don't own this tag! ❌`);
                    break;
                }

                if (!content)
                    content = await(bu.awaitMessage(msg, tagContentsMsg)).content;

                await(bu.r.table('tag').get(title).replace({
                    name: title,
                    author: msg.author.id,
                    content: words.slice(3).join(' '),
                    lastmodified: bu.r.epochTime(moment() / 1000),
                    uses: tag ? tag.uses : 0
                }).run());
                bu.send(msg.channel.id, `✅ Tag \`${title}\` ${tag ? 'edited' : 'created'}. ✅`);
                logChange(tag ? 'Edit' : 'Create', {
                    user: `${msg.author.username} (${msg.author.id})`,
                    tag: title,
                    content: content
                });

                break;
            case 'delete':
                if (words[2]) title = words[2];
                if (!title) title = await(bu.awaitMessage(msg, tagNameMsg));

                tag = await(bu.r.table('tag').get(title).run());
                if (!tag) {
                    bu.send(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                    break;
                }
                if (tag.author != msg.author.id) {
                    bu.send(msg.channel.id, `❌ You don't own this tag! ❌`);
                    break;
                }
                await(bu.r.table('tag').get(words[2]).delete());
                bu.send(msg.channel.id, `✅ Tag \`${title}\` is gone forever! ✅`);
                logChange('Delete', {
                    user: `${msg.author.username} (${msg.author.id})`,
                    tag: title,
                    content: content
                });
                break;
            case 'help':
                bu.send(msg.channel.id, e.info);
                break;
            case 'raw':
                if (words[2]) title = words[2];
                if (!title) title = await(bu.awaitMessage(msg, tagNameMsg));

                tag = await(bu.r.table('tag').get(words[2]).run());
                if (!tag) {
                    bu.send(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                    break;
                }

                let lang = '';
                if (/\{lang;.*?}/i.test(tag.content)) {
                    lang = tag.content.match(/\{lang;(.*?)}/i)[1];
                }
                bu.send(msg.channel.id, `The code for ${words[2]} is:
\`\`\`${lang}
${tag.content}
\`\`\``);
                break;
            case 'author':
                if (words[2]) title = words[2];
                if (!title) title = await(bu.awaitMessage(msg, tagNameMsg));

                tag = await(bu.r.table('tag').get(words[2]).run());
                if (!tag) {
                    bu.send(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                    break;
                }
                author = await(bu.r.table('user').get(tag.author).run());
                bu.send(msg.channel.id, `The tag \`${title}\` was made by **${author.username}#${author.discriminator}**`);
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
                if (words[2]) title = words[2];
                if (!title) title = await(bu.awaitMessage(msg, tagNameMsg));
                tag = await(bu.r.table('tag').get(words[2]).run());
                if (!tag) {
                    bu.send(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                    break;
                }
                author = await(bu.r.table('user').get(tag.author).run());
                bu.send(msg.channel.id, `__**Tag | ${title}** __
Author: **${author.username}#${author.discriminator}**
It was last modified **${moment(tag.lastmodified).format('LLLL')}**.
It has been used a total of **${tag.uses} time${tag.uses == 1 ? '' : 's'}**!`);
                break;
            case 'search':
                let query;
                if (words[2]) query = words[2];
                if (!query) query = await(bu.awaitMessage(msg, `What would you like to search for?`)).content;

                page = 1;

                originalTagList = await(bu.r.table('tag').filter(
                    bu.r.row('name').match('(?i)' + query)
                ).run());
                if (originalTagList.length == 0) {
                    bu.send(msg.channel.id, 'No results found!');
                    return;
                }

                searchTags(msg, originalTagList, query, page);
                break;

            case 'list':
                let user;
                if (words[2]) {
                    user = await(bu.getUser(msg, words[2]));

                }
                if (user)
                    originalTagList = await(bu.r.table('tag').getAll(user.id, { index: 'author' }).run());
                else originalTagList = await(bu.r.table('tag').run());

                listTags(msg, originalTagList, 1, user);
                break;
            default:
                var command = words.slice(2).join(' ');
                tags.executeTag(msg, words[1], command);
                break;
        }
    } else {
        bu.send(msg.channel.id, tagHelp);
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

function logChange(action, actionObj) {
    let output = `**__${action}__**\n`;
    let actionArray = [];
    for (let key in actionObj) {
        actionArray.push(`  **${key}**: ${actionObj[key]}`);
    }
    bu.send('230810364164440065', output + actionArray.join('\n'));
}
