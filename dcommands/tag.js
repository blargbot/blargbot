var e = module.exports = {}
var bu = require('./../util.js')
var tags = require('./../tags')

var bot
e.init = (Tbot) => {
    bot = Tbot
}
e.requireCtx = require

e.isCommand = true
e.hidden = false
e.usage = 'tag help';
e.info = 'Gets tag command help';
e.alias = ['t']
e.category = bu.CommandType.GENERAL

e.execute = (msg, words, text) => {
    if (words[1]) {
        //       console.log(words[1]);
        //        console.log(words.length);
        switch (words[1].toLowerCase()) {
            case 'test':
                bu.sendMessageToDiscord(msg.channel.id, 'Test output:\n' + tags.processTag(msg, text.replace(words[0], '').trim().replace(words[1], '').trim(), ''));
                break;
            case 'create':
                if (words.length > 3) {

                    //  console.log('checking if tag exists');
                    var stmt = bu.db.prepare(`select exists(select 1 from tag where title=?) as kek`);
                    stmt.get(words[2], (err, row) => {
                        //   console.log('now were cooking with gas');
                        if (row.kek == 0) {
                            var title = words[2].replace(/[^\u0021\u0022\u0023\u0024\u0025\u0026\u0027\u0028\u0029\u002a\u002b\u002c\u002d\u002e\u002f\u0030\u0031\u0032\u0033\u0034\u0035\u0036\u0037\u0038\u0039\u003a\u003b\u003c\u003d\u003e\u003f\u0040\u0041\u0042\u0043\u0044\u0045\u0046\u0047\u0048\u0049\u004a\u004b\u004c\u004d\u004e\u004f\u0050\u0051\u0052\u0053\u0054\u0055\u0056\u0057\u0058\u0059\u005a\u005b\u005d\u005e\u005f\u0060\u0061\u0062\u0063\u0064\u0065\u0066\u0067\u0068\u0069\u006a\u006b\u006c\u006d\u006e\u006f\u0070\u0071\u0072\u0073\u0074\u0075\u0076\u0077\u0078\u0079\u007a\u007b\u007c\u007d\u007e]/ig, '')
                            stmt = bu.db.prepare(`insert into tag (author, title, contents, lastmodified) values (?, ?, ?, datetime('now'))`)
                            stmt.run(msg.author.id,
                                title,
                                text.replace(words[0], '').trim().replace(words[1], '').trim().replace(words[2], '').trim());
                            bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${title}\` created. ✅`)
                        } else
                            bu.sendMessageToDiscord(msg.channel.id, `❌ That tag already exists! ❌`)
                    });
                }
                break;
            case 'rename':
                //          console.log('ohh la la')
                if (words.length > 3) {
                    bu.db.run(`BEGIN TRANSACTION`);
                    var stmt = bu.db.prepare(`select author, id from tag where title=?`);
                    stmt.get(words[2], (err, row) => {
                        //   console.log('now were cooking with gas');

                        if (row) {
                            if (row.author != msg.author.id) {
                                bu.sendMessageToDiscord(msg.channel.id, `❌ You don't own this tag! ❌`)
                                bu.db.run(`END`);
                                return;
                            }
                            stmt = bu.db.prepare(`select exists(select 1 from tag where title=?) as kek`);
                            stmt.get(words[3], (err, row2) => {
                                if (row2.kek == 0) {
                                    stmt = bu.db.prepare('update tag set title=? where id=?');

                                    //  stmt = bu.db.prepare(`insert into tag (author, title, contents, lastmodified) values (?, ?, ?, datetime('now'))`)
                                    //    stmt.run(row.author, words[3], row.contents);
                                    //    stmt = bu.db.prepare(`delete from tag where title=?`)
                                    // stmt = bu.db.prepare(`update `)
                                    stmt.run(words[3], row.id);
                                    bu.db.run(`END`);
                                    bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${words[2]}\` has been renamed to \`${words[3]}\`. ✅`)

                                } else {
                                    bu.sendMessageToDiscord(msg.channel.id, `❌ The tag \`${words[3]}\` already exist! ❌`)
                                    bu.db.run(`END`);

                                }
                            });
                        } else {
                            bu.sendMessageToDiscord(msg.channel.id, `❌ The tag \`${words[2]}\` doesn't exist! ❌`)
                            bu.db.run(`END`);
                        }
                    });
                }
                break;
            case 'edit':
                var stmt = bu.db.prepare(`select author from tag where title=?`);
                stmt.get(words[2], (err, row) => {
                    if (!row)
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exists! ❌`)
                    else if (row.author != msg.author.id)
                        bu.sendMessageToDiscord(msg.channel.id, `❌ You don't own this tag! ❌`)
                    else {
                        stmt = bu.db.prepare('update tag set contents=? where title=?');
                        stmt.run(text.replace(words[0], '').trim().replace(words[1], '').trim().replace(words[2], '').trim(),
                            words[2]);
                        bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${words[2]}\` edited. ✅`)

                    }
                });
                break;
            case 'delete':
                var stmt = bu.db.prepare(`select author from tag where title=?`);
                stmt.get(words[2], (err, row) => {
                    if (!row)
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exists! ❌`)
                    else if (row.author != msg.author.id)
                        bu.sendMessageToDiscord(msg.channel.id, `❌ You don't own this tag! ❌`)
                    else {
                        stmt = bu.db.prepare(`delete from tag where title=?`)
                        stmt.run(words[2]);
                        bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${words[2]}\` is gone forever! ✅`)

                    }
                });
                break;
            case 'help':
                bu.sendMessageToDiscord(msg.channel.id, `\`\`\`diff
!=== { Tag Usage } ===!
+ tag <name> - executes tag with given name
+ tag create <name> <content> - creates a new tag with given name and content
+ tag rename <tag1> <tag2> - renames the tag by the name of \`tag1\` to \`tag2\`
+ tag edit <name> <content> - edits an existing tag with given content, provided that you were the one who created it
+ tag delete <name> - deletes the tag with given name, provided that you own it
+ tag raw <name> - displays the raw code of a tag
+ tag author <tag> - displays the name of who made the tag
+ tag search <name> - searches for a tag based on the provided name
+ tag list - lists all tags 
+ tag help - shows this message
For more information about tags, visit http://ratismal.github.io/blargbot/tags.html
\`\`\``)
                break;
            case 'raw':
                var stmt = bu.db.prepare(`select contents from tag where title=?`);
                stmt.get(words[2], (err, row) => {
                    if (!row)
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exists! ❌`)
                    else if (row.author != msg.author.id)
                        bu.sendMessageToDiscord(msg.channel.id, `The code for ${words[2]} is:
\`\`\`
${row.contents}
\`\`\``);
                });
                break;
            case 'author':
                var stmt = bu.db.prepare(`select author from tag where title=?`);
                stmt.get(words[2], (err, row) => {
                    if (!row)
                        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exists! ❌`)
                    else {
                        bu.sendMessageToDiscord(msg.channel.id, `The tag \`${words[2]}\` was made by **${bot.users.get(row.author).username}#${bot.users.get(row.author).discriminator}**`);
                    }
                });
                break;
            case 'search':
                //    var tagList = 'Found these tags:\n';
                var tagList = [];
                var stmt = bu.db.prepare(`select title from tag where title like ?`);
                stmt.each(`%${words[2]}%`, (err, row) => {
                    //     console.log('err');
                    //  if (!err)
                    tagList.push(row.title);
                    //   else {

                    //   }
                }, (err, retrieved) => {
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
                    var tagList = [];
                    var stmt = bu.db.prepare(`select title from tag`);
                    stmt.each((err, row) => {
                        //     console.log('err');
                        //  if (!err)
                        tagList.push(row.title);
                        //   else {

                        //   }
                    }, (err, retrieved) => {
                        tagList.sort();
                        console.log('all done');
                        var tagMessage = '';
                        for (var i = 0; i < tagList.length; i++) {
                            tagMessage += ` ${tagList[i]},`;
                        }
                        var message = `Found ${tagList.length} tags.\n\`\`\`${tagMessage.trim()}\n\`\`\``;
                        bu.sendMessageToDiscord(msg.channel.id, message);
                    });
                } else {
                    var tagList = [];
                    var stmt = bu.db.prepare(`select title from tag where author=?`);
                    var userToSearch = text.replace(words[0], '').trim().replace(words[1], '').trim();
                    console.log(userToSearch);
                    var obtainedUser = bu.getUserFromName(msg, userToSearch);
                    if (!obtainedUser) {
                        break;
                    }

                    stmt.each(obtainedUser.id, (err, row) => {
                        //     console.log('err');
                        //  if (!err)
                        tagList.push(row.title);
                        //   else {

                        //   }
                    }, (err, retrieved) => {
                        tagList.sort();
                        console.log('all done');
                        var tagMessage = '';
                        for (var i = 0; i < tagList.length; i++) {
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
                tags.executeTag(msg, words[1], command)
                break;
        }
    } else {
        bu.sendMessageToDiscord(msg.channel.id, `\`\`\`diff
!=== { Tag Usage } ===!
+ tag <name> - executes tag with given name
+ tag create <name> <content> - creates a new tag with given name and content
+ tag edit <name> <content> - edits an existing tag with given content, provided that you were the one who created it
+ tag delete <name> - deletes the tag with given name, provided that you own it
+ tag raw <name> - displays the raw code of a tag
+ tag author <tag> - displays the name of who made the tag
+ tag search <name> - searches for a tag based on the provided name
+ tag list - lists all tags 
+ tag help - shows this message
For more information about tags, visit http://ratismal.github.io/blargbot/tags.html
\`\`\``)
    }
}