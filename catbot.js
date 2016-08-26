var Eris = require('eris');


var e = module.exports = {}
var db;
var config
var CAT_ID = '103347843934212096'
e.init = (configuration, database) => {

    db = database
    config = configuration

    e.bot = new Eris.Client(config.catbot.token, {
        autoReconnect: true,
        disableEvents: {
            PRESENCE_DATE: true,
            VOICE_STATE_UPDATE: true,
            TYPING_START: true
        }
    });

    e.bot.on('ready', () => {
        console.log('stupid cat> YO SHIT WADDUP ITS DA CAT HERE')
    })

    e.bot.on('messageCreate', (msg) => {
        var prefix = config.general.isbeta ? 'catbeta' : 'cat'
        if (msg.content.startsWith(prefix)) {
            var command = msg.content.replace(prefix, '').trim();
            console.log('stupid cat>', msg.author.username, msg.author.id, prefix, command)
            var words = command.split(' ')
            switch (words.shift().toLowerCase()) {
                case 'eval':
                    console.log('evaling')
                    eval1(msg, words.join(' '))
                    break;
                case 'eval2':
                    console.log('eval2ing')
                    eval2(msg, words.join(' '))
                    break;
                case 'avatar':
                    if (msg.author.id === CAT_ID) {
                        var request = require('request').defaults({ encoding: null });
                        var avatarUrl = '';
                        if (msg.attachments.length > 0) {
                            avatarUrl = msg.attachments[0].url;
                        } else if (words.length > 0) {
                            avatarUrl = words[0];
                        } else {
                            e.bot.createMessage(msg.channel.id, "No URL given.");
                        }
                        request.get(avatarUrl, function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
                                console.log(data);
                                var p1 = e.bot.editSelf({ avatar: data });
                                p1.then(function () {
                                    e.bot.createMessage(msg.channel.id, ":ok_hand: Avatar set!");
                                })
                            }
                        });
                    }
                    break;
                case 'pls': // yay markovs
                    var statement = ` from catchat `
                    statement += ` where nsfw <> 1`
                    db.query(`select count(*) as count` + statement, (err, row) => {
                        if (err)
                            console.log(err);
                        db.query(`select varvalue as pos from vars where varname = ?`,
                            ['markovpos'], (err2, row2) => {
                                if (err2) console.log(err2)
                                if (!row2) {
                                    db.query(`insert into vars (varname, varvalue) values ("markovpos", 0)`)
                                    e.bot.createMessage(msg.channel.id, `Markov initiated! Please try again.`)
                                } else {

                                    var max = row.count;

                                    if (max >= 100) {
                                        var diff = getRandomInt(0, 100) - 50
                                        var pos = parseInt(row2.pos) + diff
                                        if (pos < 0) {
                                            pos += max
                                        }
                                        if (pos > max) {
                                            pos -= max
                                        }
                                        console.log('Getting message at pos', pos)
                                        db.query(`select id, content, attachment` + statement + ` limit 1 offset ?`,
                                            [pos], (err3, row3) => {
                                                if (err3) console.log(err3)
                                                if (row3) {
                                                    var messageToSend = `${row3.content} ${row3.attachment == 'none' ? '' :
                                                        row3.attachment}`;
                                                    e.bot.createMessage(msg.channel.id, `\u200B` + messageToSend);
                                                    db.query(`update vars set varvalue = ? where varname="markovpos"`,
                                                        [pos])
                                                }
                                            })

                                    } else {
                                        e.bot.createMessage(msg.channel.id, `I don't have a big enough sample size.`);
                                    }

                                }
                            })


                    })
                    break;
            }
        }
    })

    e.bot.connect()
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function eval2(msg, text) {
    if (msg.author.id == CAT_ID) {
        var commandToProcess = text.replace("eval2 ", "");
        console.log(commandToProcess);
        try {
            e.bot.createMessage(msg.channel.id, `\`\`\`js
${eval(`${commandToProcess}.toString()`)}
\`\`\``);
        } catch (err) {
            e.bot.createMessage(msg.channel.id, err.message);
        }
    } else {
        e.bot.createMessage(msg.channel.id, `You don't own me!`);
    }
}

function eval1(msg, text) {
    if (msg.author.id == CAT_ID) {
        console.log('fucking fuck', text)
        var commandToProcess = text.replace("eval ", "");
        if (commandToProcess.startsWith('```js') && commandToProcess.endsWith('```'))
            commandToProcess = commandToProcess.substring(6, commandToProcess.length - 3);
        else if (commandToProcess.startsWith('```') && commandToProcess.endsWith('```'))
            commandToProcess = commandToProcess.substring(4, commandToProcess.length - 3);
        //  console.log(commandToProcess);
        try {
            e.bot.createMessage(msg.channel.id, `Input:
\`\`\`js
${commandToProcess}
\`\`\`
Output:
\`\`\`js
${eval(commandToProcess)}
\`\`\``);

        } catch (err) {
            e.bot.createMessage(msg.channel.id, `An error occured!
\`\`\`js
${err.stack}
\`\`\``);
        }
    } else {
        e.bot.createMessage(msg.channel.id, `You don't own me!`);
    }
}