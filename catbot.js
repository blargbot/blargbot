var Eris = require('eris');



var e = module.exports = {};
var db;

var CAT_ID = '103347843934212096';
e.init = (database) => {
    
    db = database;

    e.bot = new Eris.Client(config.catbot.token, {
        autoReconnect: true,
        disableEvents: {
            PRESENCE_DATE: true,
            VOICE_STATE_UPDATE: true,
            TYPING_START: true
        }
    });

    e.bot.on('ready', () => {
        logger.init('stupid cat> YO SHIT WADDUP ITS DA CAT HERE');
    });

    e.bot.on('messageCreate', async function(msg) {
        var prefix = config.general.isbeta ? 'catbeta' : 'cat';
        if (msg.content.startsWith(prefix)) {
            var command = msg.content.replace(prefix, '').trim();
            logger.info('stupid cat>', msg.author.username, msg.author.id, prefix, command);
            var words = command.split(' ');
            switch (words.shift().toLowerCase()) {
                case 'ping':
                    e.bot.createMessage('What is that supposed to mean?');
                    break;
                case 'eval':
                    logger.debug('evaling');
                    eval1(msg, words.join(' '));
                    break;
                case 'eval2':
                    logger.debug('eval2ing');
                    eval2(msg, words.join(' '));
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
                            e.bot.createMessage(msg.channel.id, 'No URL given.');
                        }
                        request.get(avatarUrl, function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                let data = 'data:' + response.headers['content-type'] + ';base64,' + new Buffer(body).toString('base64');
                                logger.debug(data);
                                var p1 = e.bot.editSelf({ avatar: data });
                                p1.then(function () {
                                    e.bot.createMessage(msg.channel.id, ':ok_hand: Avatar set!');
                                });
                            }
                        });
                    }
                    break;
                case 'pls': // yay markovs
                    let max = await r.table('catchat').count().run();
                    let position = (await r.table('vars').get('markovpos').run()).varvalue;
                    if (!position) {
                        position = 0;
                    }
                    logger.error(max);
                    if (max >= 300) {
                        var diff = getRandomInt(0, 300) - 150;
                        var pos = parseInt(position) + diff;
                        if (pos < 0) {
                            pos += max;
                        }
                        if (pos > max) {
                            pos -= max;
                        }
                        logger.error('Getting message at pos', pos);
                        let message = await r.table('catchat').orderBy({ index: r.desc('id') }).nth(pos);
                        var messageToSend = `${message.content} ${message.attachment == 'none' ? '' :
                            message.attachment}`;
                        e.bot.createMessage(msg.channel.id, `\u200B` + messageToSend);
                        r.table('vars').get('markovpos').update({ varvalue: message.id }).run();
                    } else {
                        e.bot.createMessage(msg.channel.id, `I don't have a big enough sample size.`);
                    }
                    break;
            }
        }
    });

    e.bot.connect();
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function eval2(msg, text) {
    if (msg.author.id == CAT_ID) {
        var commandToProcess = text.replace('eval2 ', '');
        logger.debug(commandToProcess);
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
        logger.debug('fucking fuck', text);
        var commandToProcess = text.replace('eval ', '');
        if (commandToProcess.startsWith('```js') && commandToProcess.endsWith('```'))
            commandToProcess = commandToProcess.substring(6, commandToProcess.length - 3);
        else if (commandToProcess.startsWith('```') && commandToProcess.endsWith('```'))
            commandToProcess = commandToProcess.substring(4, commandToProcess.length - 3);
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