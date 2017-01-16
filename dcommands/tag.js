var e = module.exports = {};
var tags = require('./../tags');
const moment = require('moment');
const results = 100;
e.init = () => {
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


var searchTags = async function(msg, originalTagList, query, page, deleteMsg) {
    let tagList = originalTagList.map(m => m.name);
    let maxPages = Math.floor(originalTagList.length / results) + 1;
    tagList.sort();
    tagList = tagList.slice((page - 1) * results, ((page - 1) * results) + results);
    if (tagList.length != 0) {
        if (deleteMsg) await bot.deleteMessage(deleteMsg.channel.id, deleteMsg.id);
        var message = `Found ${tagList.length}/${originalTagList.length} tags matching '${query}'.\nPage **#${page}/${maxPages}**\n\`\`\`fix\n${tagList.join(', ').trim()}\n\`\`\`\nType a number between 1-${maxPages} to view that page, type \`c\` to cancel, or type anything else to perform another search.`;
        let newPage = (await bu.awaitMessage(msg, message)).content;
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

var listTags = async function(msg, originalTagList, page, author, deleteMsg) {
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
        let message = `Found ${tagList.length}/${originalTagList.length} tags${author ? ' made by **' + bu.getFullName(author) + '**' : ''}.\nPage **#${page}/${maxPages}**\n\`\`\`fix\n${tagList.length == 0 ? 'No results found.' : tagList.join(', ').trim()}\n\`\`\`Type a number between 1-${maxPages} to view that page, type \`c\` to cancel, or type anything else to look up tags made by a specific user.`;
        logger.debug(message, message.length);
        let newPage = (await bu.awaitMessage(msg, message)).content;
        if (newPage.toLowerCase() == 'c') {
            bu.send(msg, 'I hope you found what you were looking for!');
            return;
        }
        let choice = parseInt(newPage);
        deleteMsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
        if (!isNaN(choice) && choice >= 1 && choice <= maxPages) {
            return listTags(msg, originalTagList, choice, author, deleteMsg);
        } else {
            author = await bu.getUser(msg, newPage);
            if (author)
                originalTagList = await r.table('tag').getAll(author.id, {
                    index: 'author'
                }).run();
            else
                originalTagList = await r.table('tag').run();
            if (originalTagList.length == 0) {
                bu.send(msg, 'No results found!');
                return;
            }
            return listTags(msg, originalTagList, 1, newPage, deleteMsg);
        }
    } else {
        bu.send(msg, 'No results found!');
        return;
    }
};

function filterTitle(title) {
    return title.replace(/[^\d\w .,\/#!$%\^&\*;:{}=\-_~()@]/gi, '');
}

e.execute = async function(msg, words, text) {
    let page = 0;
    let title, content, tag, author, originalTagList;
    if (words[1]) {
        switch (words[1].toLowerCase()) {
            case 'create':
                if (words[2]) title = words[2];
                if (words[3]) content = bu.splitInput(text, true).slice(3).join(' ');
                if (!title)
                    title = (await bu.awaitMessage(msg, tagNameMsg)).content;

                title = filterTitle(title);
                tag = await r.table('tag').get(title).run();
                if (tag) {
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
                    lastmodified: r.epochTime(moment() / 1000),
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
                if (tag.author != msg.author.id) {
                    bu.send(msg, `❌ You don't own this tag! ❌`);
                    break;
                }

                if (!content)
                    content = await bu.awaitMessage(msg, tagContentsMsg).content;

                //  content = bu.fixContent(content);

                await r.table('tag').get(title).update({
                    content: content,
                    lastmodified: r.epochTime(moment() / 1000)
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
                if (tag && tag.author != msg.author.id) {
                    bu.send(msg, `❌ You don't own this tag! ❌`);
                    break;
                }

                if (!content)
                    content = (await bu.awaitMessage(msg, tagContentsMsg)).content;

                //    content = content.replace(/(?:^)(\s+)|(?:\n)(\s+)/g, '');
                logger.debug('First:', content, words);
                //  content = bu.fixContent(content);
                logger.debug('Second:', content);
                await r.table('tag').get(title).replace({
                    name: title,
                    author: msg.author.id,
                    content: content,
                    lastmodified: r.epochTime(moment() / 1000),
                    uses: tag ? tag.uses : 0
                }).run();
                bu.send(msg, `✅ Tag \`${title}\` ${tag ? 'edited' : 'created'}. ✅`);
                logChange(tag ? 'Edit' : 'Create', msg, {
                    tag: title,
                    content: content
                });

                break;
            case 'delete':
                if (words[2]) title = words[2];
                if (!title) title = await bu.awaitMessage(msg, tagNameMsg);

                tag = await r.table('tag').get(title).run();
                if (!tag) {
                    bu.send(msg, `❌ That tag doesn't exist! ❌`);
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
                bu.send(msg, e.info);
                break;
            case 'raw':
                if (words[2]) title = words[2];
                if (!title) title = await bu.awaitMessage(msg, tagNameMsg);

                tag = await r.table('tag').get(words[2]).run();
                if (!tag) {
                    bu.send(msg, `❌ That tag doesn't exist! ❌`);
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
                author = await r.table('user').get(tag.author).run();
                bu.send(msg, `__**Tag | ${title}** __
Author: **${author.username}#${author.discriminator}**
It was last modified **${moment(tag.lastmodified).format('LLLL')}**.
It has been used a total of **${tag.uses} time${tag.uses == 1 ? '' : 's'}**!`);
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
            default:
                var command = words.slice(2).join(' ');
                command = bu.fixContent(command);

                tags.executeTag(msg, words[1], command);
                break;
        }
    } else {
        bu.send(msg, tagHelp);
    }
};


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

function logChange(action, msg, actionObj) {
    let actionArray = [];
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
            timestamp: moment(msg.timestamp),
            footer: {
                text: `MsgID: ${msg.id}`
            }
        }
    });
}