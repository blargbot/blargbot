var e = module.exports = {}
var bu = require('./../util.js')
var fs = require('fs');
var util = require('util');
var Eris = require('eris');
var moment = require('moment');
var mkdirp = require('mkdirp');
var path = require('path');
var http = require('http');
var https = require('https');
var xml2js = require('xml2js');
var gm = require('gm');
var CAT_ID = "103347843934212096";
var youtube = require('./../youtube.js');
var reload = require('require-reload')

var bot
e.init = (Tbot) => {
    bot = Tbot
    voiceConnections = bot.voiceConnections
    youtube.init(bot, voiceConnections, voiceSettings)

}

e.isCommand = true
e.hidden = false
e.usage = 'music';
e.info = 'Get the music commands!';
e.sub = {
    summon: {
        usage: 'summon',
        info: 'Summons me to your voice channel'
    },
    banish: {
        usage: 'banish',
        info: 'Removes me from your voice channel'
    },
    play: {
        usage: 'play <url or search>',
        info: 'Adds a song from youtube to the queue'
    },
    stop: {
        usage: 'stop',
        info: 'Stops the current song and clears the queue'
    },
    skip: {
        usage: 'skip',
        info: 'Skips the current song'
    },
    volume: {
        usage: 'volume [number]',
        info: 'Gets or sets the volume (out of 100)'
    },
    clear: {
        usage: 'clear',
        info: 'Clears the queue'
    },
    queue: {
        usage: 'queue [shuffle]',
        info: 'Shows the current queue, or shuffles it'
    }
}
e.category = bu.CommandType.MUSIC
e.requireCtx = require


var stream;
var voiceConnections;
if (fs.existsSync(path.join(__dirname, '../voiceSettings.json'))) {
    var voiceFile = fs.readFileSync(path.join(__dirname, '../voiceSettings.json'), 'utf8');
    var voiceSettings = JSON.parse(voiceFile);
} else {
    voiceSettings = {}
    saveVoiceSettings();
}
function reloadVoiceSettings() {
    fs.readFile(path.join(__dirname, '../voiceSettings.json'), 'utf8', function (err, data) {
        if (err) throw err;
        voiceSettings = JSON.parse(data);
    });
}

function saveVoiceSettings() {
    fs.writeFile(path.join(__dirname, '../voiceSettings.json'), JSON.stringify(voiceSettings, null, 4));
}

e.execute = (msg, words, text) => {
    if (!bu.config.discord.musicGuilds[msg.channel.guild.id]) {
        return;
    }
    bot.sendChannelTyping(msg.channel.id)
    if (!voiceSettings[msg.channel.guild.id]) {
        voiceSettings[msg.channel.guild.id] = {
            volume: 50,
            //  currentChannel: msg.channel.guild.defaultChannel,
            specialUsers: [],
            blacklist: true
        }
    }
    voiceSettings[msg.channel.guild.id].currentChannel = msg.channel.id;
    console.log(`${msg.channel.guild.name} (${msg.channel.guild.id})> ${msg.channel.name} (${msg.channel.id}> ${msg.author.username} (${msg.author.id})> ${msg.content}`);
    //var command = msg.content.replace('=3', '').trim();
    //var words = command.split(' ');
    //  words.shift()
    if (words.length == 0) {
        var messageToSend = ':musical_score: Current Queue: :musical_score:\n```xl\n'

        if (youtube.current[msg.channel.guild.id]) {
            var currentSong = youtube.current[msg.channel.guild.id]
            var timeDiff = moment.duration(moment().diff(moment(currentSong.start)))
            var timeLength = moment.duration(currentSong.duration)
            messageToSend += `Right Now: ${currentSong.name} [${createTimeString(timeDiff)}/${createTimeString(timeLength)}]\n`
        }

        if (youtube.queue.hasOwnProperty(msg.channel.guild.id) && youtube.queue[msg.channel.guild.id].length > 0) {
            for (var i = 0; i < youtube.queue[msg.channel.guild.id].length; i++) {
                messageToSend += `${(i + 1) < 10 ? ' ' + (i + 1) : i + 1}: ${youtube.queue[msg.channel.guild.id][i].name} - [${createTimeString(moment.duration(youtube.queue[msg.channel.guild.id][i].duration))}]\n`
            }
        } else {
            messageToSend += 'Nothing queued!'
        }
        messageToSend += '```'
        sendMessage(msg.channel.id, messageToSend);
        return;
    }
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
                sendMessage(msg.channel.id, `\`\`\`xl
Commands:
 music - shows this message
 summon - summons me to your voice channel
 banish - removes me from your voice channel
 play <url or search> - adds a song from youtube to the queue
 stop - stops the current song and clears the queue
 skip - skips the current song
 volume [number] - gets or sets the volume (out of 100)
 clear - clears the queue
 queue [shuffle]- shows the current queue, or shuffles it
\`\`\``);
            break;

        case 'play':
            if (voiceConnections.get(msg.channel.guild.id) && voiceConnections.get(msg.channel.guild.id).ready)
                youtube.handleMusicCommand(msg, words, msg.content, voiceConnections)
            else
                sendMessage(msg.channel.id, `I can't play until I'm in a voice channel!`)
            break;
        //          case 'resume':
        //              if (msg.channel.guild.id in voiceConnections) {
        //                   voiceConnections[msg.channel.guild.id].resume();
        //                }
        //                break;
        case "stop":
            if (voiceConnections.get(msg.channel.guild.id).ready) {
                if (youtube.queue.hasOwnProperty(msg.channel.guild.id)) {
                    youtube.queue[msg.channel.guild.id].length = 0
                }
                voiceConnections.get(msg.channel.guild.id).stopPlaying();
                //    delete voiceConnections[msg.channel.guild.id];
                //sendMessage(msg.channel.id, "Ok, I'm done.");
            }
            break;
        case 'skip':
            console.log('skipping')
            if (voiceConnections.get(msg.channel.guild.id).ready) {
                //     if (youtube.queue.hasOwnProperty(msg.channel.guild.id)) {
                if (words[0] == 'force' && bu.hasPerm(msg, 'Bot Commander')) {
                    voiceConnections.get(msg.channel.guild.id).stopPlaying();
                    return;                    
                }
                //   } else
                var votesNeeded = youtube.current[msg.channel.guild.id].votesNeeded
                if (!youtube.current[msg.channel.guild.id].votes) {
                    youtube.current[msg.channel.guild.id].votes = []
                }
                if (youtube.current[msg.channel.guild.id].votes.indexOf(msg.author.id) > -1) {
                    bu.sendMessageToDiscord(msg.channel.id, `:no_good: You've already voted to skip! :no_good: `)
                    return;
                }
                youtube.current[msg.channel.guild.id].votes.push(msg.author.id)

                if (youtube.current[msg.channel.guild.id].votes.length >= votesNeeded) {
                    bu.sendMessageToDiscord(msg.channel.id, `:umbrella2: Skipping the song \`${youtube.cache[youtube.current[msg.channel.guild.id].id].name}\` after ${votesNeeded} votes. :umbrella2:`)
                    voiceConnections.get(msg.channel.guild.id).stopPlaying();

                } else {
                    bu.sendMessageToDiscord(msg.channel.id, `:closed_umbrella: ${msg.member.nick
                        ? msg.member.nick
                        : msg.author.username} has voted to skip the song \`${
                        youtube.cache[youtube.current[msg.channel.guild.id].id].name}\`. **${
                        votesNeeded - youtube.current[msg.channel.guild.id].votes.length
                        }** more votes are needed to skip the song. :closed_umbrella: `)

                }
                // voiceConnections.get(msg.channel.guild.id).stopPlaying();
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
                voiceSettings[msg.channel.guild.id].volume = newVolume;
                //       saveVoiceSettings();
                if (voiceConnections.get(msg.channel.guild.id).ready) {

                    voiceConnections.get(msg.channel.guild.id).setVolume(newVolume / 100)
                }
            } else {
                sendMessage(msg.channel.id, `:speaker: My volume is currently ${voiceSettings[msg.channel.guild.id].volume} :speaker: `)
            }
            //       }
            break;
        case 'clear':
            if (youtube.queue.hasOwnProperty(msg.channel.guild.id)) {
                youtube.queue[msg.channel.guild.id].length = 0;
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
                            try {
                            console.log(`Connected to guild ${msg.channel.guild.name} (${msg.channel.guild.id}) in channel ${bot.getChannel(bot.voiceConnections[msg.channel.guild.id].channelID).name} (${bot.voiceConnections[msg.channel.guild.id].channelID})`);
                            } catch (err) {
                                console.log(err)
                            }  
                      });
                        voice.on('ready', () => {
                            try {
                            console.log(`Ready to guild ${msg.channel.guild.name} (${msg.channel.guild.id}) in channel ${bot.getChannel(bot.voiceConnections[msg.channel.guild.id].channelID).name} (${bot.voiceConnections[msg.channel.guild.id].channelID})`);
                            } catch (err) {
                                console.log(err)
                            }   
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
                                } else if (youtube.queue[msg.channel.guild.id] && youtube.queue[msg.channel.guild.id].length > 0) {
                                    //     nextSong = youtube.queue[msg.channel.guild.id].shift();
                                    setTimeout(() => {
                                        youtube.nextSong(msg);
                                    }, 500)
                                    //      voice.setVolume
                                } else {
                                    sendMessage(voiceSettings[msg.channel.guild.id].currentChannel, `Jobs done.`);
                                    delete youtube.current[msg.channel.guild.id]
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
                delete youtube.current[msg.channel.guild.id]
                // delete voiceConnections[msg.channel.guild.id]
            }
            break;

        default:
            if (words[0] && words[0] == 'shuffle') {
                // console.log(util.inspect(youtube.queue[msg.channel.guild.id]))
                for (var i = 0; i < youtube.queue[msg.channel.guild.id].length; i++) {
                    console.log(youtube.cache[youtube.queue[msg.channel.guild.id][i].id].name)
                }
                console.log('------------------------------------------------------')
                shuffle(youtube.queue[msg.channel.guild.id])
                for (var i = 0; i < youtube.queue[msg.channel.guild.id].length; i++) {
                    console.log(youtube.cache[youtube.queue[msg.channel.guild.id][i].id].name)
                }
                //    console.log(util.inspect(youtube.queue[msg.channel.guild.id]))
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
                var queue = youtube.queue[msg.channel.guild.id]
                youtube.saveVideo(msg, queue[0].id, youtube.cache[queue[0].id].name, youtube.cache[queue[0].id].duration)
            } else {
                var messageToSend = ':musical_score: Current Queue: :musical_score:\n```xl\n'

                if (youtube.current[msg.channel.guild.id]) {
                    var currentSong = youtube.current[msg.channel.guild.id]
                    var timeDiff = moment.duration(moment().diff(moment(currentSong.start)))
                    var timeLength = moment.duration(youtube.cache[currentSong.id].duration)
                    console.log(currentSong.requester)
                    var requesterMember = msg.channel.guild.members.get(currentSong.requester);
                    var requester = requesterMember.nick ? requesterMember.nick : requesterMember.user.username
                    var line = `Right Now: ${youtube.cache[currentSong.id].name} [${
                        createTimeString(timeDiff)}/${createTimeString(timeLength)}] \n           Requested by ${requester}\n`
                    var oddApo = (line.match(/'/g) || []).length % 2
                    messageToSend += oddApo == 0 ? line : line.replace(/'/, '\u2019')
                }

                if (youtube.queue.hasOwnProperty(msg.channel.guild.id) && youtube.queue[msg.channel.guild.id].length > 0) {
                    for (var i = 0; i < (youtube.queue[msg.channel.guild.id].length <= 10 ? youtube.queue[msg.channel.guild.id].length : 10); i++) {
                        var id = youtube.queue[msg.channel.guild.id][i].id
                        var requesterMember = msg.channel.guild.members.get(youtube.queue[msg.channel.guild.id][i].requester);
                        var requester = requesterMember.nick ? requesterMember.nick : requesterMember.user.username
                        var name = youtube.cache[id].name
                        if (name.length > 40) {
                            name = name.substring(0, 44) + "..."
                        }
                        var line = `${(i + 1) < 10 ? ' ' + (i + 1) : i + 1}: `
                        line += name
                        line = pad(line, 51)
                        line += ` - [${createTimeString(moment.duration(youtube.cache[id].duration))}] (${requester})\n`
                        var oddApo = (line.match(/'/g) || []).length % 2
                        messageToSend += oddApo == 0 ? line : line.replace(/'/, '\u2019')
                    }
                    if (youtube.queue[msg.channel.guild.id].length > 10) {
                        messageToSend += `... and ${youtube.queue[msg.channel.guild.id].length - 10} more!`
                    }
                } else {
                    messageToSend += 'Nothing queued!'
                }
                messageToSend += '```'
                sendMessage(msg.channel.id, messageToSend);
            }
            break;

    }
    saveVoiceSettings();
}

function createTimeString(d) {
    return `${d.hours() > 0 ? `${d.hours() < 10 ? `0${d.hours()}:` : `${d.hours()}:`}` : ''}${d.minutes() < 10 ? `0${d.minutes()}` : d.minutes()}:${d.seconds() < 10 ? `0${d.seconds()}` : d.seconds()}`
}

function sendMessage(channel, message) {
    //console.log(message);
    return bu.sendMessageToDiscord(channel, message);
}

function eval1(msg, text) {
    if (msg.author.id === CAT_ID) {
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