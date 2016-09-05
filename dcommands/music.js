var e = module.exports = {}
var bu = require('./../util.js')
var fs = require('fs');
var util = require('util');
var Eris = require('eris');
var mkdirp = require('mkdirp');
var path = require('path');
var http = require('http');
var https = require('https');
var xml2js = require('xml2js');
var gm = require('gm');
var CAT_ID = "103347843934212096";
//var youtube = require('./../js');
var reload = require('require-reload')
var youtubeStream = require('youtube-audio-stream')
var google = require('googleapis')
var youtube = google.youtube('v3')
var moment = require('moment')
var SC = require('node-soundcloud')
var request = require('request')

SC.init({
    id: bu.config.general.soundcloud.id,
    secret: bu.config.general.soundcloud.secret,
    uri: bu.config.general.soundcloud.uri,
    accessToken: bu.config.general.soundcloud.accessToken
});

var dl = {}
var queue = {}
var current = {}
var cache = {}
var bot
e.init = (Tbot) => {
    bot = Tbot
    voiceConnections = bot.voiceConnections
    init(bot, voiceConnections, voiceSettings)

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
    bot.sendChannelTyping(msg.channel.id).then(() => {


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

            if (current[msg.channel.guild.id]) {
                var currentSong = current[msg.channel.guild.id]
                var timeDiff = moment.duration(moment().diff(moment(currentSong.start)))
                var timeLength = moment.duration(currentSong.duration)
                messageToSend += `Right Now: ${currentSong.name} [${createTimeString(timeDiff)}/${createTimeString(timeLength)}]\n`
            }

            if (queue.hasOwnProperty(msg.channel.guild.id) && queue[msg.channel.guild.id].length > 0) {
                for (var i = 0; i < queue[msg.channel.guild.id].length; i++) {
                    messageToSend += `${(i + 1) < 10 ? ' ' + (i + 1) : i + 1}: ${queue[msg.channel.guild.id][i].name} - [${createTimeString(moment.duration(queue[msg.channel.guild.id][i].duration))}]\n`
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
                        case 'setchannel':
                            if (!bu.config.discord.servers[msg.channel.guild.id]) {
                                bu.config.discord.servers[msg.channel.guild.id] = {}
                            }
                            if (bu.config.discord.servers[msg.channel.guild.id].musicChannel == msg.channel.id) {
                                delete bu.config.discord.servers[msg.channel.guild.id].musicChannel
                                bu.sendMessageToDiscord(msg.channel.id, 'This is no longer my music channel.')

                            } else {
                                bu.config.discord.servers[msg.channel.guild.id].musicChannel = msg.channel.id
                                bu.sendMessageToDiscord(msg.channel.id, 'This is now my music channel.')

                            }
                            bu.saveConfig()
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
                    handleMusicCommand(msg, words, msg.content, voiceConnections)
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
                    if (queue.hasOwnProperty(msg.channel.guild.id)) {
                        queue[msg.channel.guild.id].length = 0
                    }
                    voiceConnections.get(msg.channel.guild.id).stopPlaying();
                    //    delete voiceConnections[msg.channel.guild.id];
                    //sendMessage(msg.channel.id, "Ok, I'm done.");
                }
                break;
            case 'skip':
                console.log('skipping')
                if (voiceConnections.get(msg.channel.guild.id).ready) {
                    //     if (queue.hasOwnProperty(msg.channel.guild.id)) {
                    if (words[0] == 'force' && bu.hasPerm(msg, 'Bot Commander')) {
                        voiceConnections.get(msg.channel.guild.id).stopPlaying();
                        return;
                    }
                    //   } else
                    var votesNeeded = current[msg.channel.guild.id].votesNeeded
                    if (!current[msg.channel.guild.id].votes) {
                        current[msg.channel.guild.id].votes = []
                    }
                    if (current[msg.channel.guild.id].votes.indexOf(msg.author.id) > -1) {
                        bu.sendMessageToDiscord(msg.channel.id, `:no_good: You've already voted to skip! :no_good: `)
                        return;
                    }
                    current[msg.channel.guild.id].votes.push(msg.author.id)

                    if (current[msg.channel.guild.id].votes.length >= votesNeeded) {
                        bu.sendMessageToDiscord(msg.channel.id, `:umbrella2: Skipping the song \`${cache[current[msg.channel.guild.id].id].name}\` after ${votesNeeded} votes. :umbrella2:`)
                        voiceConnections.get(msg.channel.guild.id).stopPlaying();

                    } else {
                        bu.sendMessageToDiscord(msg.channel.id, `:closed_umbrella: ${msg.member.nick
                            ? msg.member.nick
                            : msg.author.username} has voted to skip the song \`${
                            cache[current[msg.channel.guild.id].id].name}\`. **${
                            votesNeeded - current[msg.channel.guild.id].votes.length
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
                if (queue.hasOwnProperty(msg.channel.guild.id)) {
                    queue[msg.channel.guild.id].length = 0;
                    sendMessage(msg.channel.id, `:ok_hand: Queue cleared! :ok_hand:`)
                }
                break;
            case "summon":
                if (msg.member.voiceState && msg.member.voiceState.channelID) {
                    if (!voiceConnections.get(msg.channel.guild.id)) {
                        var p1 = bot.joinVoiceChannel(msg.member.voiceState.channelID);
                        p1.then(function (voice) {
                            sendMessage(msg.channel.id, `I'm here!`)
                            var channel = msg.channel.id
                            if (!bu.config.discord.servers[msg.channel.guild.id]) {
                                bu.config.discord.servers[msg.channel.guild.id] = {}
                            }
                            if (bu.config.discord.servers[msg.channel.guild.id].musicChannel) {
                                var channel = bu.config.discord.servers[msg.channel.guild.id].musicChannel
                            }
                            //      var voicevoiceConnections.get(msg.channel.guild.id) = voice;
                            voice.on('start', () => {

                            })
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
                                    console.log(`Finished stream in guild ${msg.channel.guild.name} (${msg.channel.guild.id})`);
                                    if (!bot.getChannel(voiceConnections.get(msg.channel.guild.id).channelID)) {
                                        //  sendMessage(voiceSettings[msg.channel.guild.id].currentChannel, `An error has occured!`)
                                    } else if (queue[msg.channel.guild.id] && queue[msg.channel.guild.id].length > 0) {
                                        setTimeout(() => {
                                            nextSong(msg);
                                        }, 500)
                                    } else {
                                        sendMessage(channel, `Jobs done.`);
                                        delete current[msg.channel.guild.id]
                                    }
                                } catch (err) {
                                    console.log(err);
                                }
                            });
                            voice.on('disconnect', function () {
                                console.log(`Disconnected from guild ${msg.channel.guild.name} (${msg.channel.guild.id}) in channel ${bot.getChannel(msg.member.voiceState.channelID).name} (${msg.member.voiceState.channelID})`);
                                sendMessage(voiceSettings[msg.channel.guild.id].currentChannel, "Bye!");
                            });
                            return voice;
                        }).catch((err) => {
                            console.log(err)
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
                    delete current[msg.channel.guild.id]
                    // delete voiceConnections[msg.channel.guild.id]
                }
                break;

            default:
                if (words[0]) {
                    switch (words[0]) {
                        case 'shuffle':
                            for (var i = 0; i < queue[msg.channel.guild.id].length; i++) {
                                console.log(cache[queue[msg.channel.guild.id][i].id].name)
                            }
                            console.log('------------------------------------------------------')
                            shuffle(queue[msg.channel.guild.id])
                            for (var i = 0; i < queue[msg.channel.guild.id].length; i++) {
                                console.log(cache[queue[msg.channel.guild.id][i].id].name)
                            }
                            //    console.log(util.inspect(queue[msg.channel.guild.id]))
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
                            var subqueue = queue[msg.channel.guild.id]
                            var channel = msg.channel.id
                            if (bu.config.discord.servers[msg.channel.guild.id] && bu.config.discord.servers[msg.channel.guild.id].musicChannel) {
                                channel = bu.config.discord.servers[msg.channel.guild.id].musicChannel
                            }
                            saveVideo(msg, channel, subqueue[0].id, cache[subqueue[0].id].name, cache[subqueue[0].id].duration)
                            break;
                        case 'remove':
                            if (bu.hasPerm(msg, 'Bot Commander')) {
                                if (words[1]) {
                                    var index = parseInt(words[1]) - 1;
                                    if (queue[msg.channel.guild.id][index]) {
                                        var removed = queue[msg.channel.guild.id].splice(index, 1)

                                        var removedSong = cache[removed[0].id].name
                                        //        console.log(util.inspect(removed))
                                        bu.sendMessageToDiscord(msg.channel.id, `:umbrella: Removed the song **${removedSong}** :umbrella:`)

                                    }
                                }
                            } else {
                                bu.sendMessageToDiscord(msg.channel.id, `:no_good: You don't have permissions to remove a song from the queue :no_good:`)
                            }
                            break;
                    }
                    // console.log(util.inspect(queue[msg.channel.guild.id]))

                } else {
                    var messageToSend = ':musical_score: Current Queue: :musical_score:\n```xl\n'

                    if (current[msg.channel.guild.id]) {
                        var currentSong = current[msg.channel.guild.id]
                        var timeDiff = moment.duration(moment().diff(moment(currentSong.start)))
                        var timeLength = moment.duration(cache[currentSong.id].duration)
                        console.log(currentSong.requester)
                        var requesterMember = msg.channel.guild.members.get(currentSong.requester);
                        var requester = requesterMember.nick ? requesterMember.nick : requesterMember.user.username
                        var line = `Right Now: ${cache[currentSong.id].name} [${
                            createTimeString(timeDiff)}/${createTimeString(timeLength)}] \n           Requested by ${requester}\n`
                        var oddApo = (line.match(/'/g) || []).length % 2
                        messageToSend += oddApo == 0 ? line : line.replace(/'/, '\u2019')
                    }

                    if (queue.hasOwnProperty(msg.channel.guild.id) && queue[msg.channel.guild.id].length > 0) {
                        for (var i = 0; i < (queue[msg.channel.guild.id].length <= 10 ? queue[msg.channel.guild.id].length : 10); i++) {
                            var id = queue[msg.channel.guild.id][i].id
                            var requesterMember = msg.channel.guild.members.get(queue[msg.channel.guild.id][i].requester);
                            var requester = requesterMember.nick ? requesterMember.nick : requesterMember.user.username
                            var name = cache[id].name
                            if (name.length > 40) {
                                name = name.substring(0, 44) + "..."
                            }
                            var line = `${(i + 1) < 10 ? ' ' + (i + 1) : i + 1}: `
                            line += name
                            line = pad(line, 51)
                            line += ` - [${createTimeString(moment.duration(cache[id].duration))}] (${requester})\n`
                            var oddApo = (line.match(/'/g) || []).length % 2
                            messageToSend += oddApo == 0 ? line : line.replace(/'/, '\u2019')
                        }
                        if (queue[msg.channel.guild.id].length > 10) {
                            messageToSend += `... and ${queue[msg.channel.guild.id].length - 10} more!`
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
    })
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


/**
 * DL SHIT
 */

var keys;
var i = 0;

function getKey() {
    return keys.key
}


function init(bot, connections, voiceSettings) {

    if (fs.existsSync(path.join(__dirname, '..', 'keys.json'))) {
        var keysFile = fs.readFileSync(path.join(__dirname, '..', 'keys.json'), 'utf8');
        keys = JSON.parse(keysFile);
    }
    if (!fs.existsSync(path.join(__dirname, '..', 'cache'))) {
        fs.mkdirSync(path.join(__dirname, '..', 'cache'));
    }
    if (!fs.existsSync(path.join(__dirname, '..', 'cache', 'yt'))) {
        fs.mkdirSync(path.join(__dirname, '..', 'cache', 'yt'));
    }
    if (!fs.existsSync(path.join(__dirname, '..', 'cache', 'sc'))) {
        fs.mkdirSync(path.join(__dirname, '..', 'cache', 'sc'));
    }
    if (fs.existsSync(path.join(__dirname, '..', 'cache', 'cache.json'))) {
        var cacheFile = fs.readFileSync(path.join(__dirname, '..', 'cache', 'cache.json'), 'utf8');
        cache = JSON.parse(cacheFile);
        cache = cache
    } else {
        saveCache()
    }
    //  console.log(util.inspect(keys))
}

function saveCache() {
    fs.writeFile(path.join(__dirname, '..', 'cache', 'cache.json'), JSON.stringify(cache, null, 4));
}

function handleMusicCommand(msg, words, text, connections) {
    if (connections.get(msg.channel.guild.id).ready) {
        var query = ''
        for (i = 0; i < words.length; i++) {
            query += `${words[i]} `
        }
        if (/<.+>/.test(query)) {
            query = query.match(/<(.+)>/)[1]
        }
        if (/https:\/\/soundcloud.com/.test(query)) { //SC playlist
            handleSoundcloud(msg, query)
        } else if (/https:\/\/www.youtube.com\//.test(query)) {
            if (/v=(.+?)(&|$)/.test(query)) {
                var id = query.match(/v=(.+?)(&|$)/)[1];
                if (!cache[id]) {
                    youtube.videos.list({
                        key: getKey(),
                        id: id,
                        part: 'snippet,contentDetails'
                    }, (err, res) => {
                        if (err) {
                            console.log(err);
                            bu.sendMessageToDiscord(msg.channel.id, 'An internal API error occurred.')
                            return;
                        }
                        if (!res.items[0]) {
                            bu.sendMessageToDiscord(msg.channel.id, 'No results found!')
                            return;
                        }
                        addToQueue(msg, id, res.items[0].snippet.title, res.items[0].contentDetails.duration);
                    })
                }
                else
                    addToQueue(msg, id, cache[id].name, cache[id].duration);
            } else if (/list=(.+?)(&|$)/.test(query)) {
                var id = query.match(/list=(.+?)(&|$)/)[1];
                console.log(id)
                youtube.playlists.list({
                    key: getKey(),
                    id: id,
                    part: 'snippet,contentDetails'
                }, (err, res) => {
                    if (err) {
                        console.log(err);
                        bu.sendMessageToDiscord(msg.channel.id, 'An internal API error occurred.')
                        return;
                    }
                    if (!res.items[0]) {
                        bu.sendMessageToDiscord(msg.channel.id, 'No results found!')
                        return;
                    }
                    console.log(util.inspect(res))
                    addPlaylistToQueue(msg, id, res);
                })
            }
        } else if (/https:\/\/youtu.be\//.test(query)) {
            var id = query.match(/be\/(.+?)(\?|$)/)[1];
            if (!cache[id]) {
                youtube.videos.list({
                    key: getKey(),
                    id: id,
                    part: 'snippet,contentDetails'
                }, (err, res) => {
                    if (err) {
                        console.log(err);
                        bu.sendMessageToDiscord(msg.channel.id, 'An internal API error occurred.')
                        return;
                    }
                    if (!res.items[0]) {
                        bu.sendMessageToDiscord(msg.channel.id, 'No results found!')
                        return;
                    }
                    addToQueue(msg, id, res.items[0].snippet.title, res.items[0].contentDetails.duration);
                })
            }
            else
                addToQueue(msg, id, cache[id].name, cache[id].duration);
        } else
            findVideo(msg, query, (res) => {

                var id = res.items[0].id.videoId

                if (!cache[id]) {
                    youtube.videos.list({
                        key: getKey(),
                        id: res.items[0].id.videoId,
                        part: 'contentDetails'
                    }, (err, res2) => {
                        if (err) {
                            console.log(err);
                            bu.sendMessageToDiscord(msg.channel.id, 'An internal API error occurred.')
                            return;
                        }
                        if (!res2.items[0]) {
                            bu.sendMessageToDiscord(msg.channel.id, 'No results found!')
                            return;
                        }
                        addToQueue(msg, res.items[0].id.videoId, res.items[0].snippet.title, res2.items[0].contentDetails.duration);
                    })
                }
                else
                    addToQueue(msg, id, cache[id].name, cache[id].duration);
            })
    }
}
function saveSoundcloud(msg, id, callback) {
    var url = `https://api.soundcloud.com/tracks/${id}/stream` + '?client_id=' + bu.config.general.soundcloud.id
    var writeStream = fs.createWriteStream(cache[id].path);

    https.get(url, res => {
        var body = ''
        res.on('data', (chunk) => {
            //  writeStream.write(chunk)
            body += chunk
        })
        res.on('end', () => {
            var location = JSON.parse(body)
            https.get(location.location, res => {
                var body

                res.on('data', chunk => {
                    writeStream.write(chunk)
                    body += chunk
                })
                res.on('end', () => {
                    console.log('done')
                    //     console.log(body)
                    writeStream.end()
                    callback()
                })
            })


        })
    })
}

function handleSoundcloud(msg, query) {
    //   console.log(uriquery)
    SC.get(`/resolve?url=${encodeURIComponent(query)}`, (err, track) => {
        if (err) {
            console.log(err)
            bu.sendMessageToDiscord(msg.channel.id, 'No results found!')
            return;
        }
        var type = track.location.match(/\.com\/(.+?)\//)[1]
        var id = track.location.match(/([0-9]+)\.json/)[1]
        console.log(type, id)

        switch (type) {
            case 'playlists':
                SC.get(`/playlists/${id}`, (err, track) => {
                    if (err) {
                        console.log(err)
                        console.log('Nothing found');
                        bu.sendMessageToDiscord(msg.channel.id, `No results found.`)
                        return;
                    }
                    //     console.log(track)
                    var added = 0
                    bu.sendMessageToDiscord(msg.channel.id, 'Processing playlist...').then((msg2) => {

                        for (var i = 0; i < track.tracks.length; i++) {
                            var curTrack = track.tracks[i]
                            console.log(curTrack.id)
                            if (curTrack.streamable) {
                                if (!cache[curTrack.id]) {
                                    cache[curTrack.id] = {
                                        name: curTrack.title,
                                        path: path.join(__dirname, '..', 'cache', 'sc', `${curTrack.id}.mp3`),
                                        duration: moment.duration(curTrack.duration).toJSON(),
                                        sc: true
                                    }
                                }
                                if (!queue[msg.channel.guild.id]) {
                                    queue[msg.channel.guild.id] = []
                                }
                                added++
                                queue[msg.channel.guild.id].push({
                                    id: curTrack.id,
                                    requester: msg.author.id
                                })
                            }
                        }
                        bot.editMessage(msg.channel.id, msg2.id, `:heavy_check_mark: Added **${added}** items to the queue :heavy_check_mark:`)
                        setTimeout(() => {
                            bot.deleteMessage(msg2.channel.id, msg2.id)
                        }, 15000)
                        console.log('done')
                        saveCache()
                        if (!current[msg.channel.guild.id]) {
                            nextSong(msg)
                        } else {
                            if (queue[msg.channel.guild.id].length == 1) {
                                var id = queue[msg.channel.guild.isd][0].id
                                var channel = msg.channel.id
                                if (bu.config.discord.servers[msg.channel.guild.id] && bu.config.discord.servers[msg.channel.guild.id].musicChannel) {
                                    channel = bu.config.discord.servers[msg.channel.guild.id].musicChannel
                                }
                                saveVideo(msg, channel, id, cache[id].name, cache[id].duration);
                            }
                        }
                    })

                })
                break;
            case 'tracks': //msg, id, name, duration, sc
                SC.get(`/tracks/${id}`, (err, track) => {
                    if (err) {
                        console.log('Nothing found');
                        bu.sendMessageToDiscord(msg.channel.id, `No results found.`)
                        return;
                    }
                    console.log(track)
                    if (!track.streamable) {
                        bu.sendMessageToDiscord(msg.channel.id, `I can't play that song!`)
                        return;
                    }
                    var duration = moment.duration(track.duration).toJSON()
                    var name = track.title
                    addToQueue(msg, id, name, duration, true)
                })
                break;
        }
    })
}

function nextSong(msg) {
    var channel = msg.channel.id
    if (bu.config.discord.servers[msg.channel.guild.id] && bu.config.discord.servers[msg.channel.guild.id].musicChannel) {
        channel = bu.config.discord.servers[msg.channel.guild.id].musicChannel
    }
    //  console.log(channel)
    var nextSong = queue[msg.channel.guild.id].shift()
    var currectNext = current[msg.channel.guild.id] = nextSong;

    saveVideo(msg, channel, nextSong.id, cache[nextSong.id].name, cache[nextSong.id].duration, () => {
        var requesterMember = msg.channel.guild.members.get(nextSong.requester);
        var requester = requesterMember.nick ? requesterMember.nick : requesterMember.user.username
        try {
            bu.sendMessageToDiscord(channel, `:musical_note: Now playing \`${cache[nextSong.id].name}\` in #${
                bot.getChannel(voiceConnections.get(msg.channel.guild.id).channelID).name} - requested by **${requester}** :musical_note: `)
                .then(msg2 => {
                    setTimeout(() => {
                        bu.bot.deleteMessage(channel, msg2.id)
                    }, 60000)
                });

            voiceConnections.get(msg.channel.guild.id).playResource(cache[nextSong.id].path, { inlineVolume: voiceSettings[msg.channel.guild.id].volume / 100 })
            voiceConnections.get(msg.channel.guild.id).setVolume(voiceSettings[msg.channel.guild.id].volume / 100)
            currectNext.start = moment()
            var membersInChannel = bot.getChannel(bot.voiceConnections.get(msg.channel.guild.id).channelID)
                .voiceMembers.size - 1
            var votesNeeded = Math.ceil(membersInChannel / 3)
            currectNext.votesNeeded = votesNeeded > 0 ? votesNeeded : 1
            if (queue[msg.channel.guild.id][0]) {
                var id = queue[msg.channel.guild.id][0].id
                saveVideo(msg, channel, id, cache[id].name, cache[id].duration)
            }
        } catch (err) {
            console.log(err);
        }

    });
    /*   } else {
           try {
               bot.createMessage(msg.channel.id, `:musical_note: Now playing \`${nextSong.name}\` in #${bot.getChannel(connections[msg.channel.guild.id].channelID).name} :musical_note: `);
           } catch (err) {
               console.log(err);
           }
           connections[msg.channel.guild.id].playResource(nextSong.path, { inlineVolume: settings[msg.channel.guild.id].volume / 100 })
           connections[msg.channel.guild.id].setVolume(settings[msg.channel.guild.id].volume / 100)
           nextSong.start = moment()
           if (queue[msg.channel.id][0]) {
               saveVideo(msg, queue[msg.channel.id][0].id, queue[msg.channel.id][0].name, queue[msg.channel.id][0].duration)
           }*/

}

function saveVideo(msg, channel, id, name, duration, callback) {

    console.log(id);
    if (!id) {
        bot.createMessage(channel, `:cry: Error finding song! :cry:`);
        return;
    }
    //  if (!url)
    if (!cache[id].sc) {
        url = `https://www.youtube.com/watch?v=${id}`

        console.log(url);
        var filepath = path.join(__dirname, '..', 'cache', 'yt', `${id}.mp3`)
        if (!fs.existsSync(filepath)) {
            bot.createMessage(channel, `:cd: Downloading song \`${name}\`... :cd: `).then((newmessage) => {
                var stream = getStreamFromURL(url);
                //  console.log(util.inspect(stream));
                var writeStream = fs.createWriteStream(filepath);
                stream.pipe(writeStream);
                stream.on('end', () => {
                    console.log('done');
                    //    addToQueue(msg, filepath, name, duration);
                    bot.editMessage(channel, newmessage.id, `:dvd: Finished downloading \`${name}\`! :dvd:`)
                    setTimeout(() => {
                        bot.deleteMessage(channel, newmessage.id);
                    }, 5000)
                    if (callback) {
                        callback()
                    }
                })
                writeStream.on('error', (err) => {
                    console.log(err);
                })
            });

        } else {
            if (callback) {
                callback()
            }
        }
    } else {
        //  url = getSoundcloudUrl(`https://api.soundcloud.com/tracks/${id}/stream`)
        if (!fs.existsSync(cache[id].path))
            bot.createMessage(channel, `:cd: Downloading song \`${name}\`... :cd: `).then((newmessage) => {
                saveSoundcloud(msg, id, () => {
                    bot.editMessage(channel, newmessage.id, `:dvd: Finished downloading \`${name}\`! :dvd:`)
                    setTimeout(() => {
                        bot.deleteMessage(channel, newmessage.id);
                    }, 5000)
                    if (callback) callback();
                })
            })
        else {
            if (callback) callback()
        }
    }
}



function addToQueue(msg, id, name, duration, sc) {

    //   console.log(util.inspect(connections))
    //  connections[msg.channel.guild.id].playResource(filepath, { inlineVolume: 0.3 })
    //   connections[msg.channel.guild.id].setVolume(0.3);
    if (!queue.hasOwnProperty(msg.channel.guild.id)) {
        queue[msg.channel.guild.id] = [];
    }
    var subqueue = queue[msg.channel.guild.id]
    var init = moment.duration(0);
    //  console.log(init.hours(), init.minutes(), init.seconds())

    for (var i = 0; i < subqueue.length; i++) {
        init.add(moment.duration(cache[subqueue[i].id].duration))
        console.log(i, ':', init.hours(), init.minutes(), init.seconds())
    }
    //   console.log(init.hours(), init.minutes(), init.seconds())
    if (current[msg.channel.guild.id]) {
        init.add(moment.duration(cache[current[msg.channel.guild.id].id].duration))
        init.subtract(moment.duration(moment().diff(current[msg.channel.guild.id].start)))
    }

    //  console.log(init.hours(), init.minutes(), init.seconds())

    var lengthUntilString = `${init.hours() > 0 ? `${init.hours()} hours, ` : ''}${init
        .minutes() > 0 ? `${init.minutes()} minutes, and ` : ''}${init.seconds()} seconds`
    subqueue.push({ id: id, requester: msg.author.id })
    if (!cache[id]) {
        cache[id] = {
            name: name,
            path: path.join(__dirname, '..', 'cache', sc ? 'sc' : 'yt', `${id}.mp3`),
            duration: duration,
            sc: sc
            //   requester: msg.author.id
        }
        saveCache()
    }
    bot.createMessage(msg.channel.id, `:white_check_mark:  Added \`${name}\` to the queue.`
        + ` It will play in ${lengthUntilString}! :white_check_mark:`).then((newmessage) => {
            setTimeout(() => {
                bot.deleteMessage(msg.channel.id, newmessage.id)
            }, 15000);
        });
    // console.log(duration);
    if (!current[msg.channel.guild.id]) {
        nextSong(msg)
    } else {
        if (subqueue.length == 1) {
            var id = subqueue[0].id
            var channel = msg.channel.id
            if (bu.config.discord.servers[msg.channel.guild.id] && bu.config.discord.servers[msg.channel.guild.id].musicChannel) {
                channel = bu.config.discord.servers[msg.channel.guild.id].musicChannel
            }
            saveVideo(msg, channel, id, cache[id].name, cache[id].duration);
        }
    }
}

function findVideo(msg, text, callback) {
    try {
        youtube.search.list({
            key: getKey(),
            maxResults: 1,
            q: text,
            part: 'snippet',
            order: 'relevance',
            type: 'video'
        }, (err, res) => {
            if (err) {
                console.log(err);
                bu.sendMessageToDiscord(msg.channel.id, 'An internal API error occurred.')
                return;
            }
            //     console.log(util.inspect(res))
            //      console.log(util.inspect(res.items[0].id))
            //    console.log(util.inspect(res.items[0].snippet))
            if (res.items.length == 0) {
                bu.sendMessageToDiscord(msg.channel.id, 'No results found!')
            } else
                callback(res)
        })
    } catch (err) {
        console.log(err)
        bu.sendMessageToDiscord(msg.channel.id, 'Something went wrong!')
    }
}

function play() {

}



function getStreamFromURL(url) {
    try {
        return youtubeStream(url);
    } catch (err) {
        console.log(err);
    }
}

function addPlaylistToQueue(msg, id, res) {
    var playlist = res.items[0];

    bu.sendMessageToDiscord(msg.channel.id, `Processing playlist \`${playlist.snippet.title}\` with ${playlist.contentDetails.itemCount} items.`).then((msg2) => {
        console.log('starting processplaylist')

        processPlaylist([], msg.author.id, id, playlist, null, (newQueue) => {
            console.log('processplaylist done')
            saveCache()
            //  console.log(util.inspect(newQueue))
            for (var i = 0; i < newQueue.length; i++) {
                if (!queue[msg.channel.guild.id])
                    queue[msg.channel.guild.id] = []
                queue[msg.channel.guild.id].push(newQueue[i]);
            }
            bu.bot.editMessage(msg2.channel.id, msg2.id, `:heavy_check_mark: Added **${newQueue.length}** items to the queue :heavy_check_mark:`)
            setTimeout(() => {
                bu.bot.deleteMessage(msg2.channel.id, msg2.id)
            }, 15000)
            if (!current[msg.channel.guild.id]) {
                nextSong(msg)
            } else {
                if (queue[msg.channel.guild.isd].length == 1) {
                    var id = queue[msg.channel.guild.isd][0].id
                    var channel = msg.channel.id
                    if (bu.config.discord.servers[msg.channel.guild.id] && bu.config.discord.servers[msg.channel.guild.id].musicChannel) {
                        channel = bu.config.discord.servers[msg.channel.guild.id].musicChannel
                    }
                    saveVideo(msg, channel, id, cache[id].name, cache[id].duration);
                }
            }
        })
    })


}

function processPlaylist(subqueue, requesterid, id, playlist, nextPageToken, callback) {
    var onComplete = function (newsubqueue, newpagetoken) {
        console.log('done a batch', newsubqueue.length, '/', playlist.contentDetails.itemCount)
        if (newsubqueue.length == playlist.contentDetails.itemCount) {
            callback(newsubqueue)
        } else {
            processPlaylist(newsubqueue, requesterid, id, playlist, newpagetoken, callback)
        }
    }
    if (subqueue.length < playlist.contentDetails.itemCount) {
        var param = {
            playlistId: id,
            key: getKey(),
            part: 'contentDetails',
            maxResults: 50
        }
        if (nextPageToken)
            param.pageToken = nextPageToken

        youtube.playlistItems.list(param, (err, res) => {

            var tasksToGo = res.items.length
            if (tasksToGo == 0) {
                onComplete(subqueue, res.nextPageToken);
            }

            if (err) {
                console.log(err);
                bu.sendMessageToDiscord(msg.channel.id, 'An internal API error occurred.')
                return;
            }            //    console.log(util.inspect(res.items))

            for (var i = 0; i < res.items.length; i++) {
                // var pause = true
                //    var ii = i;
                //    console.log(i, res.items.length)
                if (!cache[res.items[i].contentDetails.videoId]) {
                    youtube.videos.list({
                        key: getKey(),
                        id: res.items[i].contentDetails.videoId,
                        part: 'snippet,contentDetails'
                    }, (err, res2) => {
                        if (err) {
                            console.log(err);
                            bu.sendMessageToDiscord(msg.channel.id, 'An internal API error occurred.')
                            return;
                        }
                        console.log(tasksToGo)
                        //          console.log(util.inspect(res))
                        //        console.log(util.inspect(res.items))
                        //              console.log(util.inspect(res.items[0]))
                        //
                        // addToQueue(msg, id, res.items[0].snippet.title, res.items[0].contentDetails.duration);
                        //      console.log(ii)
                        //     if (i < 50) {
                        subqueue.push({ id: res2.items[0].id, requester: requesterid })

                        cache[res2.items[0].id] = {
                            name: res2.items[0].snippet.title,
                            id: res2.items[0].id,
                            path: path.join(__dirname, 'cache', `${res2.items[0].id}.mp3`),
                            //  requester: requesterid,
                            duration: res2.items[0].contentDetails.duration
                        }
                        //     }
                        if (--tasksToGo === 0) {
                            onComplete(subqueue, res.nextPageToken);
                        }
                        //  console.log(tasksToGo, res.nextPageToken)
                        // //  pause = false

                    })
                } else {
                    subqueue.push({ id: res.items[i].contentDetails.videoId, requester: requesterid })
                    if (--tasksToGo === 0) {
                        onComplete(subqueue, res.nextPageToken);
                    }
                }
                //  while (pause) {

                //   }
            }//
            //  if (i >= res.items.length) {
            //           processPlaylist(subqueue, requesterid, id, playlist, res.nextPageToken, callback)
            //          }
        })
    } else {
        if (callback) {
            callback(subqueue)
        }
    }
}

