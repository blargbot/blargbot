var e = module.exports = {};
var bu;
var tags = require('./../tags');

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'tag help';
e.info = 'Gets tag command help';
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
    <pre><code>tag delete &lt;name&gt;</code></pre>
    <p>Deletes the specified tag. You must own it to delete it!</p>
    <pre><code>tag raw &lt;name&gt;</code></pre>
    <p>Outputs the raw tag</p>
    <pre><code>tag author &lt;name&gt;</code></pre>
    <p>Tells you who made the specified tag</p>
    <pre><code>tag search &lt;name&gt;</code></pre>
    <p>Searches for tags with given name</p>
    <pre><code>tag list</code></pre>
    <p>Lists all tags</p>
    <pre><code>tag help</code></pre>
    <p>Gets basic tag help.</p>`;
e.alias = ['t'];

e.execute = (msg, words, text) => {
    let page = 0;
    let index = 3;
    if (words[1]) {
        var tagList;
        switch (words[1].toLowerCase()) {
            case 'create':
                if (words.length > 3) {
                    var title = words[2].replace(/[^\u0020\u0021\u0022\u0023\u0024\u0025\u0026\u0027\u0028\u0029\u002a\u002b\u002c\u002d\u002e\u002f\u0030\u0031\u0032\u0033\u0034\u0035\u0036\u0037\u0038\u0039\u003a\u003b\u003c\u003d\u003e\u003f\u0040\u0041\u0042\u0043\u0044\u0045\u0046\u0047\u0048\u0049\u004a\u004b\u004c\u004d\u004e\u004f\u0050\u0051\u0052\u0053\u0054\u0055\u0056\u0057\u0058\u0059\u005a\u005b\u005d\u005e\u005f\u0061\u0062\u0063\u0064\u0065\u0066\u0067\u0068\u0069\u006a\u006b\u006c\u006d\u006e\u006f\u0070\u0071\u0072\u0073\u0074\u0075\u0076\u0077\u0078\u0079\u007a\u007b\u007c\u007d\u007e]/ig, '');
                    bu.db.query(`select exists(select 1 from tag where title=?) as kek`,
                        [title], (err, row) => {
                            if (row[0].kek == 0) {
                                bu.db.query(`insert into tag (author, title, contents, lastmodified) values (?, ?, ?, NOW())`,
                                    [msg.author.id, title,
                                        words.slice(3).join(' ')]);
                                bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${title}\` created. ✅`);
                                bu.send('230810364164440065', `**__Create__**:\n  **User:** ${msg.author.username} (${msg.author.id})\n  **Tag:** ${words[2]}\n  **Contents**: \`\`\`${words.splice(3).join(' ')}\`\`\``);

                            } else
                                bu.sendMessageToDiscord(msg.channel.id, `❌ That tag already exists! ❌`);
                        });
                }
                break;
            case 'rename':
                if (words.length > 3) {
                    bu.db.beginTransaction((err) => {
                        if (err) {
                            bu.db.rollback(() => {
                                bu.logger.error(err);
                                return;
                            });
                        }
                        bu.db.query(`select author, id from tag where title=?`,
                            [words[2]], (err, row) => {
                                if (row) {
                                    if (row[0].author != msg.author.id) {
                                        bu.sendMessageToDiscord(msg.channel.id, `❌ You don't own this tag! ❌`);
                                        bu.db.commit((err) => {
                                            if (err) bu.db.rollback(() => {
                                                bu.logger.error(err);
                                            });
                                        });
                                        return;
                                    }
                                    bu.db.query(`select exists(select 1 from tag where title=?) as kek`,
                                        [words[3]], (err, row2) => {
                                            if (row2[0].kek == 0) {
                                                bu.db.query('update tag set title=? where id=?',
                                                    [words[3], row[0].id]);
                                                bu.db.commit((err) => {
                                                    if (err) bu.db.rollback(() => {
                                                        bu.logger.error(err);
                                                    });
                                                });
                                                bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${words[2]}\` has been renamed to \`${words[3]}\`. ✅`);
                                                bu.send('230810364164440065', `**__Rename__**:\n  **User:** ${msg.author.username} (${msg.author.id})\n  **Old Tag:** ${words[2]}\n  **New Tag**: ${words[3]}`);
                                            } else {
                                                bu.sendMessageToDiscord(msg.channel.id, `❌ The tag \`${words[3]}\` already exist! ❌`);
                                                bu.db.commit((err) => {
                                                    if (err) bu.db.rollback(() => {
                                                        bu.logger.error(err);
                                                    });
                                                });

                                            }
                                        });
                                } else {
                                    bu.sendMessageToDiscord(msg.channel.id, `❌ The tag \`${words[2]}\` doesn't exist! ❌`);
                                    bu.db.commit((err) => {
                                        if (err) bu.db.rollback(() => {
                                            bu.logger.error(err);
                                        });
                                    });
                                }
                            });
                    });
                }
                break;
            case 'edit':
                bu.db.query(`select author from tag where title=?`,
                    [words[2]], (err, row) => {
                        if (!row[0])
                            bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                        else if (row[0].author != msg.author.id)
                            bu.sendMessageToDiscord(msg.channel.id, `❌ You don't own this tag! ❌`);
                        else {
                            bu.db.query('update tag set contents=? where title=?',
                                [words.slice(3).join(' '),
                                    words[2]]);
                            bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${words[2]}\` edited. ✅`);
                            bu.send('230810364164440065', `**__Edit__**:\n  **User:** ${msg.author.username} (${msg.author.id})\n  **Tag:** ${words[2]}\n  **Contents**: \`\`\`${words.slice(3).join(' ')}\`\`\``);
                        }
                    });
                break;
            case 'delete':
                bu.db.query(`select author from tag where title=?`, [words[2]], (err, row) => {
                    if (!row[0])
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                    else if (row[0].author != msg.author.id && msg.author.id != bu.CAT_ID)
                        bu.sendMessageToDiscord(msg.channel.id, `❌ You don't own this tag! ❌`);
                    else {
                        bu.db.query(`delete from tag where title=?`, [words[2]]);
                        bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${words[2]}\` is gone forever! ✅`);
                        bu.send('230810364164440065', `**__Delete__**:\n  **User:** ${msg.author.username} (${msg.author.id})\n  **Tag:** ${words[2]}`);
                    }
                });
                break;
            case 'help':
                bu.sendMessageToDiscord(msg.channel.id, tagHelp);
                break;
            case 'raw':
                bu.db.query(`select contents from tag where title=?`, [words[2]], (err, row) => {
                    if (!row[0])
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                    else if (row[0].author != msg.author.id)
                        bu.sendMessageToDiscord(msg.channel.id, `The code for ${words[2]} is:
\`\`\`
${row[0].contents}
\`\`\``);
                });
                break;
            case 'author':
                bu.db.query(`select author from tag where title=?`, [words[2]], (err, row) => {
                    if (!row[0])
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exist! ❌`);
                    else {
                        bu.db.query(`select username, discriminator from user where userid = ?`, [row[0].author], (err, row2) => {
                            bu.sendMessageToDiscord(msg.channel.id, `The tag \`${words[2]}\` was made by **${row2[0].username}#${row2[0].discriminator}**`);
                        });
                    }
                });
                break;
            case 'search':
                page = 1;
                if (words[2]) {
                    if (/^[\d]+$/.test(words[2])) {
                        page = parseInt(words[2]);
                    } else {
                        index = 2;
                    }
                }
                tagList = [];
                bu.db.query(`select title from tag where title like ? order by title asc`, [`%${words[index]}%`], (err, row) => {
                    for (let i = (page - 1) * 100; i < row.length && i < page * 100; i++) {
                        tagList.push(row[i].title);
                    }
                    tagList.sort();
                    bu.logger.debug('all done');
                    var message = `Returned ${tagList.length}/${row.length} tags matching '${words[index]}'.\nPage **#${page}/${Math.floor(row / 100) + 1}**\n\`\`\`fix\n${tagList.length == 0 ? 'No results found.' : tagList.join(', ').trim()}\n\`\`\``;
                    bu.sendMessageToDiscord(msg.channel.id, message);
                });

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
                    bu.db.query(`select title from tag order by title asc`, (err, row) => {
                        for (let i = (page - 1) * 100; i < row.length && i < page * 100; i++) {
                            tagList.push(row[i].title);
                        }
                        tagList.sort();
                        bu.logger.debug('all done');
                        var message = `Returned ${tagList.length}/${row.length} tags.\nPage **#${page}/${Math.floor(row.length / 100) + 1}**\n\`\`\`fix\n${tagList.length == 0 ? 'No results found.' : tagList.join(', ').trim()}\n\`\`\``;
                        bu.sendMessageToDiscord(msg.channel.id, message);
                    });
                } else {
                    tagList = [];
                    var userToSearch = words.slice(index).join(' ');
                    bu.logger.debug(userToSearch);
                    var obtainedUser = bu.getUserFromName(msg, userToSearch);
                    if (!obtainedUser) {
                        break;
                    }

                    bu.db.query(`select title from tag where author=? order by title asc`, obtainedUser.id, (err, row) => {
                        for (var i = (page - 1) * 100; i < row.length && i < page * 100; i++) {
                            tagList.push(row[i].title);
                        }
                        tagList.sort();
                        bu.logger.debug('all done');
                        var message = `Returned ${tagList.length}/${row.length} tags made by **${obtainedUser.username}#${obtainedUser.discriminator}**.\nPage **#${page}/${Math.floor(row.length / 100) + 1}**\n\`\`\`fix\n${tagList.length == 0 ? 'No results found.' : tagList.join(', ').trim()}\n\`\`\``;
                        bu.sendMessageToDiscord(msg.channel.id, message);
                    });
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
  Tag Help - shows this message
NOTE: Any NSFW tags must contain '{nsfw}' somewhere in their body, or they will be deleted and you will be blacklisted.
\`\`\`
For more information about tags, visit https://blargbot.xyz/tags`;