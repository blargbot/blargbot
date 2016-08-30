var e = module.exports = {}
var bu = require('./../util.js')
var path = require('path')
var util = require('util')
var fs = require('fs')
var bot
e.init = (Tbot) => {
    bot = Tbot
    voiceConnections = bot.voiceConnections
}
e.requireCtx = require


e.isCommand = true
e.hidden = false
e.usage = 'music';
e.info = 'Get the music commands!';
e.category = bu.CommandType.CAT
e.requireCtx = require


var stream;
var voiceConnections;
var songs = []
var index = null
var volume = 15
e.execute = (msg, words, text) => {
    if (msg.channel.guild.id != '206097393383505920') {
        return;
    }
    bot.sendChannelTyping(msg.channel.id)

    //  voiceSettings[msg.channel.guild.id].currentChannel = msg.channel.id;
    console.log(`${msg.channel.guild.name} (${msg.channel.guild.id})> ${msg.channel.name} (${msg.channel.id}> ${msg.author.username} (${msg.author.id})> ${msg.content}`);
    //var command = msg.content.replace('=3', '').trim();
    //var words = command.split(' ');
    //  words.shift()
    if (words.length == 0) {

        return;
    }
    words.shift()
    if (words.length > 0)
        switch (words.shift().toLowerCase()) {
            case "music":
                if (words[0]) {
                    switch (words.shift()) {
                        case "eval":
                            eval1(msg, words.join(' '));
                            break;
                        case "eval2":
                            eval2(msg, words.join(' '));
                            break;
                    }
                } else
                    songs = fs.readdirSync(path.join(__dirname, '..', 'music'));
                break;
            case 'play':
                if (songs.length == 0) {
                    var fileArray = fs.readdirSync(path.join(__dirname, '..', 'music'));
                    for (var i = 0; i < fileArray.length; i++) {
                        if (fileArray[i].endsWith('.mp3')) {
                            songs.push(fileArray[i])
                        }
                    }
                }
                if (voiceConnections.get(msg.channel.guild.id) && voiceConnections.get(msg.channel.guild.id).ready) {
                    index = songs.shift()
                    voiceConnections.get(msg.channel.guild.id).playResource(path.join(__dirname, '..', 'music', index), {
                        inlineVolume: true
                    })
                    voiceConnections.get(msg.channel.guild.id).setVolume(volume / 100)
                    bu.sendMessageToDiscord(msg.channel.id, 'Now playing ' + index.replace(/\.mp3/g, ''))

                } else
                    sendMessage(msg.channel.id, `I can't play until I'm in a voice channel!`)
                break;
            //          case 'resume':
            //              if (msg.channel.guild.id in voiceConnections) {
            //                   voiceConnections[msg.channel.guild.id].resume();
            //                }
            //                break;
            case "stop":
                if (voiceConnections.get(msg.channel.guild.id).ready) {
                    if (songs.length > 0) {
                        songs.length = 0
                    }
                    voiceConnections.get(msg.channel.guild.id).stopPlaying();
                    //    delete voiceConnections[msg.channel.guild.id];
                    //sendMessage(msg.channel.id, "Ok, I'm done.");
                }
                break;
            case 'skip':
                console.log('skipping')
                if (voiceConnections.get(msg.channel.guild.id).ready) {

                    //   } else
                    voiceConnections.get(msg.channel.guild.id).stopPlaying();
                    //    delete voiceConnections[msg.channel.guild.id];
                    //sendMessage(msg.channel.id, "Ok, I'm done.");
                }
                break;
            case 'volume':
                //   if (msg.channel.guild.id in voiceConnections) {
                if (words[0]) {
                    var message = '';
                    var newVolume = parseInt(words[0]);
                    console.log(newVolume);

                    if (newVolume > 100) {
                        newVolume = 100
                        message = `I don't think I can go any louder than 100!\n`
                    } else if (newVolume < 1) {
                        newVolume = 1
                        message = `I don't think I can go any quieter than 1!\n`
                    }
                    message += `:speaker: Ok, I'll change my volume to ${newVolume}! :speaker: `
                    sendMessage(msg.channel.id, message);
                    volume = newVolume;
                    //       saveVoiceSettings();
                    if (voiceConnections.get(msg.channel.guild.id).ready) {
                        voiceConnections.get(msg.channel.guild.id).setVolume(newVolume / 100)
                    }
                } else {
                    sendMessage(msg.channel.id, `:speaker: My volume is currently ${volume} :speaker: `)
                }
                //       }
                break;
            case 'clear':
                if (songs) {
                    songs = 0;
                    sendMessage(msg.channel.id, `:ok_hand: Queue cleared! :ok_hand:`)
                }
                break;
            case "summon":
                if (msg.member.voiceState && msg.member.voiceState.channelID) {
                    if (!voiceConnections.get(msg.channel.guild.id)) {
                        var p1 = bot.joinVoiceChannel(msg.member.voiceState.channelID);
                        p1.then(function (voice) {
                            sendMessage(msg.channel.id, `I'm here!`)
                            //      var voicevoiceConnections.get(msg.channel.guild.id) = voice;
                            voice.on('connect', () => {
                                console.log(`Connected to guild ${msg.channel.guild.name} (${msg.channel.guild.id}) in channel ${bot.getChannel(msg.member.voiceState.channelID).name} (${msg.member.voiceState.channelID})`);
                            });
                            voice.on('ready', () => {
                                console.log(`Ready to guild ${msg.channel.guild.name} (${msg.channel.guild.id}) in channel ${bot.getChannel(msg.member.voiceState.channelID).name} (${msg.member.voiceState.channelID})`);
                            })
                            voice.on('error', (err) => {
                                console.log('Error: ', err);
                            })
                            voice.on('debug', (debug) => {
                                console.log('Debug: ', debug);
                            })
                            voice.on('warn', (warn) => {
                                console.log('Warning: ', warn);
                            })
                            voice.on('end', function () {
                                try {
                                    //    if (voiceConnections[msg.channel.guild.id].channelID) {
                                    //          voiceConnections[msg.channel.guild.id].connect(voiceConnections[msg.c])
                                    //       }
                                    console.log(`Finished stream in guild ${msg.channel.guild.name} (${msg.channel.guild.id})`);
                                    //${bot.getChannel(voiceConnections.get(msg.channel.guild.id).channelID).name} (${voiceConnections.get(msg.channel.guild.id).channelID})
                                    if (!bot.getChannel(voiceConnections.get(msg.channel.guild.id).channelID)) {
                                        //  sendMessage(voiceSettings[msg.channel.guild.id].currentChannel, `An error has occured!`)
                                    } else if (songs.length > 0) {
                                        setTimeout(() => {
                                            index = songs.shift()
                                            voiceConnections.get(msg.channel.guild.id).playResource(path.join(__dirname, '..', 'music', index), {
                                                inlineVolume: true
                                            })
                                            voiceConnections.get(msg.channel.guild.id).setVolume(volume / 100)
                                            bu.sendMessageToDiscord(msg.channel.id, 'Now playing ' + index.replace(/\.mp3/g, ''))
                                        }, 500)
                                        //      voice.setVolume
                                    } else {
                                        sendMessage(voiceSettings[msg.channel.guild.id].currentChannel, `Jobs done.`);

                                    }
                                } catch (err) {
                                    console.log(err);
                                }
                            });
                            voice.on('disconnect', function () {
                                console.log(`Disconnected from guild ${msg.channel.guild.name} (${msg.channel.guild.id}) in channel ${bot.getChannel(msg.member.voiceState.channelID).name} (${msg.member.voiceState.channelID})`);
                                sendMessage(voiceSettings[msg.channel.guild.id].currentChannel, "Bye!");
                            });
                        });

                    } else {
                        voice = voiceConnections.get(msg.channel.guild.id);
                        if (voice.channelID != msg.member.voiceState.channelID) {
                            //     sendMessage(msg.channel.id, 'I\'m coming!')
                            sendMessage(msg.channel.id, `I'm here!`)

                            //    voice.pause();
                            voice.switchChannel(msg.member.voiceState.channelID);
                            //   voice.resume();
                        }
                        //      voiceConnections[msg.channel.guild.id].switchChannel(msg.member.voiceState.channelID);
                        //        voiceConnections[msg.channel.guild.id].resume();
                    }
                } else {
                    sendMessage(msg.channel.id, `Join a voice channel first!`)
                }
                break;
            case 'banish':
                if (voiceConnections.get(msg.channel.guild.id).ready) {
                    //        voiceConnections.get(msg.channel.guild.id).stopPlaying();                
                    voiceConnections.get(msg.channel.guild.id).disconnect();
                    delete songs
                    // delete voiceConnections[msg.channel.guild.id]
                }
                break;

            default:
                if (words[0] && words[0] == 'shuffle') {

                    shuffle(songs)

                    var suits = [':diamonds:', ':spades:', ':clubs:', ':hearts:']
                    shuffle(suits)
                    sendMessage(msg.channel.id, `${suits[0]} Shuffling! ${suits[1]}`).then((msg2) => {
                        shuffle(suits)
                        setTimeout(() => {
                            bu.bot.editMessage(msg2.channel.id, msg2.id, `${suits[0]} Shuffling! ${suits[1]}`).then((msg2) => {
                                shuffle(suits)
                                setTimeout(() => {
                                    bu.bot.editMessage(msg2.channel.id, msg2.id, `${suits[0]} Shuffling! ${suits[1]}`).then(msg2 => {
                                        shuffle(suits)
                                        setTimeout(() => {
                                            bu.bot.editMessage(msg2.channel.id, msg2.id, `${suits[0]} Shuffling! ${suits[1]}`).then(msg2 => {
                                                shuffle(suits)
                                                setTimeout(() => {
                                                    bu.bot.editMessage(msg2.channel.id, msg2.id, `${suits[0]} Queue shuffled! ${suits[1]}`)
                                                }, 1500)
                                            })
                                        }, 1500)
                                    })
                                }, 1500)
                            })
                        }, 1500)
                    })
                } else {
                    var messageToSend = ':musical_score: Current Queue: :musical_score:\n```xl\n'

                    if (index) {

                        var line = `Right Now: ${index.replace(/\.mp3/g, '')}\n`
                        var oddApo = (line.match(/'/g) || []).length % 2
                        messageToSend += oddApo == 0 ? line : line.replace(/'/, '\u2019')
                    }

                    if (songs.length > 0) {
                        for (var i = 0; i < (songs.length <= 10 ? songs.length : 10); i++) {
                            var id = songs[i]
                            //    var requester = requesterMember.nick ? requesterMember.nick : requesterMember.user.username
                            var name = songs[i].replace(/\.mp3/g, '')
                            if (name.length > 40) {
                                name = name.substring(0, 44) + "..."
                            }
                            var line = `${(i + 1) < 10 ? ' ' + (i + 1) : i + 1}: `
                            line += name + '\n'
                            //     line = pad(line, 51)
                            var oddApo = (line.match(/'/g) || []).length % 2
                            messageToSend += oddApo == 0 ? line : line.replace(/'/, '\u2019')
                        }
                        if (songs.length > 10) {
                            messageToSend += `... and ${songs.length - 10} more!`
                        }
                    } else {
                        messageToSend += 'Nothing queued!'
                    }
                    messageToSend += '```'
                    sendMessage(msg.channel.id, messageToSend);
                }
                break;

        }
    //   saveVoiceSettings();
}

function createTimeString(d) {
    return `${d.hours() > 0 ? `${d.hours() < 10 ? `0${d.hours()}:` : `${d.hours()}:`}` : ''}${d.minutes() < 10 ? `0${d.minutes()}` : d.minutes()}:${d.seconds() < 10 ? `0${d.seconds()}` : d.seconds()}`
}

function sendMessage(channel, message) {
    //console.log(message);
    return bu.sendMessageToDiscord(channel, message);
}

function eval1(msg, text) {
    if (msg.author.id === bu.CAT_ID) {
        var commandToProcess = text.replace("eval ", "");
        try {
            sendMessage(msg.channel.id, `Input:
\`\`\`js
${commandToProcess}
\`\`\`
Output:
\`\`\`js
${eval(commandToProcess)}
\`\`\``);
        } catch (err) {
            sendMessage(msg.channel.id, `An error occured!
\`\`\`js
${err.stack}
\`\`\``);
        }
    } else {
        sendMessage(msg.channel.id, `You don't own me!`);
    }
}

function eval2(msg, text) {
    if (msg.author.id === CAT_ID) {
        var commandToProcess = text.replace("eval2 ", "");
        console.log(commandToProcess);
        try {
            sendMessage(msg.channel.id, `\`\`\`js
${eval(`${commandToProcess}.toString()`)}
\`\`\``);
        } catch (err) {
            sendMessage(msg.channel.id, err.message);
        }
    } else {
        sendMessage(msg.channel.id, `You don't own me!`);
    }
}

function shuffle(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}


function pad(value, length) {
    return (value.toString().length < length) ? pad(value + " ", length) : value;
}