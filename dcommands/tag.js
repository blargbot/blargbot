var e = module.exports = {};
var bu = require('./../util.js');
var tags = require('./../tags');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'tag help';
e.info = 'Gets tag command help';
e.longinfo = `<p>
        Tags are like public custom commands. You can create them on one guild, and use them on another. Anyone is
        capable of making tags. Tags use a <a href="tags.html">tagging system</a>, so they can can range from simple to
        complex. See the <a href="tags.html">tag</a> page for more details.
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
e.category = bu.CommandType.GENERAL;

e.execute = (msg, words, text) => {
    if (words[1]) {
        var tagList;
        //       console.log(words[1]);
        //        console.log(words.length);
        switch (words[1].toLowerCase()) {
            case 'test':
                bu.sendMessageToDiscord(msg.channel.id, 'Test output:\n' + tags.processTag(msg, text.replace(words[0], '').trim().replace(words[1], '').trim(), ''));
                break;
            case 'create':
                if (words.length > 3) {

                    //  console.log('checking if tag exists');
                    bu.db.query(`select exists(select 1 from tag where title=?) as kek`,
                        [words[2]], (err, row) => {
                            //   console.log('now were cooking with gas');
                            if (row[0].kek == 0) {
                                var title = words[2].replace(/[^\u0021\u0022\u0023\u0024\u0025\u0026\u0027\u0028\u0029\u002a\u002b\u002c\u002d\u002e\u002f\u0030\u0031\u0032\u0033\u0034\u0035\u0036\u0037\u0038\u0039\u003a\u003b\u003c\u003d\u003e\u003f\u0040\u0041\u0042\u0043\u0044\u0045\u0046\u0047\u0048\u0049\u004a\u004b\u004c\u004d\u004e\u004f\u0050\u0051\u0052\u0053\u0054\u0055\u0056\u0057\u0058\u0059\u005a\u005b\u005d\u005e\u005f\u0060\u0061\u0062\u0063\u0064\u0065\u0066\u0067\u0068\u0069\u006a\u006b\u006c\u006d\u006e\u006f\u0070\u0071\u0072\u0073\u0074\u0075\u0076\u0077\u0078\u0079\u007a\u007b\u007c\u007d\u007e]/ig, '');
                                bu.db.query(`insert into tag (author, title, contents, lastmodified) values (?, ?, ?, NOW())`,
                                    [msg.author.id, title,
                                        text.replace(words[0], '').trim().replace(words[1], '').trim().replace(words[2], '').trim()]);
                                bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${title}\` created. ✅`);
                            } else
                                bu.sendMessageToDiscord(msg.channel.id, `❌ That tag already exists! ❌`);
                        });
                }
                break;
            case 'rename':
                //          console.log('ohh la la')
                if (words.length > 3) {
                    bu.db.beginTransaction((err) => {
                        if (err) {
                            bu.db.rollback(() => {
                                console.log(err);
                                return;
                            });
                        }
                        bu.db.query(`select author, id from tag where title=?`,
                            [words[2]], (err, row) => {
                                //   console.log('now were cooking with gas');

                                if (row) {
                                    if (row[0].author != msg.author.id) {
                                        bu.sendMessageToDiscord(msg.channel.id, `❌ You don't own this tag! ❌`);
                                        //     bu.db.query(`END`);
                                        bu.db.commit((err) => {
                                            if (err) bu.db.rollback(() => {
                                                console.log(err);
                                            });
                                        });
                                        return;
                                    }
                                    bu.db.query(`select exists(select 1 from tag where title=?) as kek`,
                                        [words[3]], (err, row2) => {
                                            if (row2[0].kek == 0) {
                                                bu.db.query('update tag set title=? where id=?',
                                                    [words[3], row[0].id]);

                                                //  stmt = bu.db.prepare(`insert into tag (author, title, contents, lastmodified) values (?, ?, ?, datetime('now'))`)
                                                //    stmt.run(row.author, words[3], row.contents);
                                                //    stmt = bu.db.prepare(`delete from tag where title=?`)
                                                // stmt = bu.db.prepare(`update `)
                                                bu.db.commit((err) => {
                                                    if (err) bu.db.rollback(() => {
                                                        console.log(err);
                                                    });
                                                });
                                                bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${words[2]}\` has been renamed to \`${words[3]}\`. ✅`);

                                            } else {
                                                bu.sendMessageToDiscord(msg.channel.id, `❌ The tag \`${words[3]}\` already exist! ❌`);
                                                bu.db.commit((err) => {
                                                    if (err) bu.db.rollback(() => {
                                                        console.log(err);
                                                    });
                                                });

                                            }
                                        });
                                } else {
                                    bu.sendMessageToDiscord(msg.channel.id, `❌ The tag \`${words[2]}\` doesn't exist! ❌`);
                                    bu.db.commit((err) => {
                                        if (err) bu.db.rollback(() => {
                                            console.log(err);
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
                            bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exists! ❌`);
                        else if (row[0].author != msg.author.id)
                            bu.sendMessageToDiscord(msg.channel.id, `❌ You don't own this tag! ❌`);
                        else {
                            bu.db.query('update tag set contents=? where title=?',
                                [text.replace(words[0], '').trim().replace(words[1], '').trim().replace(words[2], '').trim(),
                                    words[2]]);
                            bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${words[2]}\` edited. ✅`);

                        }
                    });
                break;
            case 'delete':
                bu.db.query(`select author from tag where title=?`, [words[2]], (err, row) => {
                    if (!row[0])
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exists! ❌`);
                    else if (row[0].author != msg.author.id)
                        bu.sendMessageToDiscord(msg.channel.id, `❌ You don't own this tag! ❌`);
                    else {
                        bu.db.query(`delete from tag where title=?`, [words[2]]);
                        bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${words[2]}\` is gone forever! ✅`);
                    }
                });
                break;
            case 'help':
                bu.sendMessageToDiscord(msg.channel.id, tagHelp);
                break;
            case 'raw':
                bu.db.query(`select contents from tag where title=?`, [words[2]], (err, row) => {
                    if (!row[0])
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exists! ❌`);
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
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exists! ❌`);
                    else {
                        bu.sendMessageToDiscord(msg.channel.id, `The tag \`${words[2]}\` was made by **${bot.users.get(row[0].author).username}#${bot.users.get(row[0].author).discriminator}**`);
                    }
                });
                break;
            case 'search':
                //    var tagList = 'Found these tags:\n';
                tagList = [];
                bu.db.query(`select title from tag where title like ?`, [`%${words[2]}%`], (err, row) => {
                    //     console.log('err');
                    //  if (!err)
                    for (i = 0; i < row.length; i++) {
                        tagList.push(row[i].title);
                    }
                    tagList.sort();
                    console.log('all done');
                    var tagMessage = '';
                    for (var i = 0; i < tagList.length; i++) {
                        tagMessage += ` ${tagList[i]},`;
                    }
                    var message = `Found ${tagList.length} tags matching '${words[2]}'.\n\`\`\`${tagMessage.trim()}\n\`\`\``;
                    bu.sendMessageToDiscord(msg.channel.id, message);
                });

                break;

            case 'list':
                if (!words[2]) {
                    tagList = [];
                    bu.db.query(`select title from tag`, (err, row) => {
                        for (var i = 0; i < row.length; i++) {
                            tagList.push(row[i].title);
                        }
                        tagList.sort();
                        console.log('all done');
                        var tagMessage = '';
                        for (i = 0; i < tagList.length; i++) {
                            tagMessage += ` ${tagList[i]},`;
                        }
                        var message = `Found ${tagList.length} tags.\n\`\`\`${tagMessage.trim()}\n\`\`\``;
                        bu.sendMessageToDiscord(msg.channel.id, message);
                    });
                } else {
                    tagList = [];
                    var userToSearch = text.replace(words[0], '').trim().replace(words[1], '').trim();
                    console.log(userToSearch);
                    var obtainedUser = bu.getUserFromName(msg, userToSearch);
                    if (!obtainedUser) {
                        break;
                    }

                    bu.db.query(`select title from tag where author=?`, obtainedUser.id, (err, row) => {
                        //     console.log('err');
                        //  if (!err)
                        for (var i = 0; i < row.length; i++) {
                            tagList.push(row[i].title);
                        }
                        //   else {

                        //   }
                        tagList.sort();
                        console.log('all done');
                        var tagMessage = '';
                        for (i = 0; i < tagList.length; i++) {
                            tagMessage += ` ${tagList[i]},`;
                        }
                        var message = `Found ${tagList.length} tags made by **${obtainedUser.username}#${obtainedUser.discriminator}**.\n\`\`\`${tagMessage.trim()}\n\`\`\``;
                        bu.sendMessageToDiscord(msg.channel.id, message);
                    });
                }
                break;
            default:
                var command = text.replace(words[0], '').trim().replace(words[1], '').trim();
                //    console.log('FUCK FUCK FUCK ' + command);
                tags.executeTag(msg, words[1], command);
                break;
        }
    } else {
        bu.sendMessageToDiscord(msg.channel.id, tagHelp);
    }
};


var tagHelp = `\`\`\`xl
!=== { Tag Usage } ===!
+ Tag <name> - executes tag with given name
+ Tag Create <name> <content> - creates a new tag with given name and content
+ Tag Rename <tag1> <tag2> - renames the tag by the name of \`tag1\` to \`tag2\`
+ Tag Edit <name> <content> - edits an existing tag with given content, provided that you were the one who created it
+ Tag Delete <name> - deletes the tag with given name, provided that you own it
+ Tag Raw <name> - displays the raw code of a tag
+ Tag Author <tag> - displays the name of who made the tag
+ Tag Search <name> - searches for a tag based on the provided name
+ Tag List - lists all tags 
+ Tag Help - shows this message
NOTE: Any NSFW tags must contain '{nsfw}' somewhere in their body, or they will be deleted and you will be blacklisted.
For more information about tags, visit http://ratismal.github.io/blargbot/tags.html
\`\`\``;