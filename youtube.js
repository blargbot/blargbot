var youtubeStream = require('youtube-audio-stream')
var util = require('util');
var fs = require('fs');
var google = require('googleapis')
var youtube = google.youtube('v3')
var path = require('path')
var moment = require('moment')
var bu = require('./util.js')

var exports = module.exports = {}
var bot;
var connections;

var keys;
var i = 0;

function getKey() {
    return keys.key
}
// TODO: Make a cache json file with all the song info. Then, make the queue an array of only video IDs.
// TODO: That way we don't have to find info about the songs every time

exports.queue = {}
exports.current = {}
var cache = {}

exports.init = function (bot, connections, voiceSettings) {
    exports.bot = bot;
    exports.connections = connections;
    exports.settings = voiceSettings
    if (fs.existsSync(path.join(__dirname, 'keys.json'))) {
        var keysFile = fs.readFileSync(path.join(__dirname, 'keys.json'), 'utf8');
        keys = JSON.parse(keysFile);
    }
    if (!fs.existsSync(path.join(__dirname, 'cache'))) {
        fs.mkdirSync(path.join(__dirname, 'cache'));

    }
    if (fs.existsSync(path.join(__dirname, 'cache', 'cache.json'))) {
        var cacheFile = fs.readFileSync(path.join(__dirname, 'cache', 'cache.json'), 'utf8');
        cache = JSON.parse(cacheFile);
        exports.cache = cache
    } else {
        saveCache()
    }
    //  console.log(util.inspect(keys))
}

function saveCache() {
    fs.writeFile(path.join(__dirname, 'cache', 'cache.json'), JSON.stringify(cache, null, 4));
}

exports.handleMusicCommand = function (msg, words, text, connections) {
    //   this.connections = connections;
    //    console.log(util.inspect(this.connections))
    if (connections.get(msg.channel.guild.id).ready) {
        //  var voice = connections[msg.channel.guild.id];
        var query = ''
        for (i = 0; i < words.length; i++) {
            query += `${words[i]} `
        }
        if (/https:\/\/www.youtube.com\//.test(query)) {
            if (/v=(.+?)(&|$)/.test(query)) {
                var id = query.match(/v=(.+?)(&|$)/)[1];
                //    console.log(id);
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
                        //          console.log(util.inspect(res))
                        //        console.log(util.inspect(res.items))
                        //              console.log(util.inspect(res.items[0]))
                        //
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
                        addToQueue(msg, res.items[0].id.videoId, res.items[0].snippet.title, res2.items[0].contentDetails.duration);

                        //    exports.saveVideo(msg, id, res.items[0].snippet.title, res.items[0].contentDetails.duration);
                    })
                }
                else
                    addToQueue(msg, id, cache[id].name, cache[id].duration);
            })
        //voice.playStream(stream, { inlineVolume: 0.3 });
    }
}

exports.nextSong = (msg) => {
    var nextSong = exports.queue[msg.channel.guild.id].shift()
    var currectNext = exports.current[msg.channel.guild.id] = nextSong;
    //   if (!fs.existsSync(cache[nextSong].path)) {
    //  console.log(nextSong)
    exports.saveVideo(msg, nextSong.id, cache[nextSong.id].name, cache[nextSong.id].duration, () => {
        var requesterMember = msg.channel.guild.members.get(nextSong.requester);
        var requester = requesterMember.nick ? requesterMember.nick : requesterMember.user.username
        try {
            bu.sendMessageToDiscord(msg.channel.id, `:musical_note: Now playing \`${cache[nextSong.id].name}\` in #${
                exports.bot.getChannel(exports.connections.get(msg.channel.guild.id).channelID).name} - requested by ${requester} :musical_note: `)
                .then(msg2 => {
                    setTimeout(() => {
                        bu.bot.deleteMessage(msg2.channel.id, msg2.id)
                    }, 60000)
                });
        } catch (err) {
            console.log(err);
        }
        exports.connections.get(msg.channel.guild.id).playResource(cache[nextSong.id].path, { inlineVolume: exports.settings[msg.channel.guild.id].volume / 100 })
        exports.connections.get(msg.channel.guild.id).setVolume(exports.settings[msg.channel.guild.id].volume / 100)
        currectNext.start = moment()
        if (exports.queue[msg.channel.guild.id][0]) {
            var id = exports.queue[msg.channel.guild.id][0].id
            exports.saveVideo(msg, id, cache[id].name, cache[id].duration)
        }
    });
    /*   } else {
           try {
               exports.bot.createMessage(msg.channel.id, `:musical_note: Now playing \`${nextSong.name}\` in #${exports.bot.getChannel(exports.connections[msg.channel.guild.id].channelID).name} :musical_note: `);
           } catch (err) {
               console.log(err);
           }
           exports.connections[msg.channel.guild.id].playResource(nextSong.path, { inlineVolume: exports.settings[msg.channel.guild.id].volume / 100 })
           exports.connections[msg.channel.guild.id].setVolume(exports.settings[msg.channel.guild.id].volume / 100)
           nextSong.start = moment()
           if (exports.queue[msg.channel.id][0]) {
               exports.saveVideo(msg, exports.queue[msg.channel.id][0].id, exports.queue[msg.channel.id][0].name, exports.queue[msg.channel.id][0].duration)
           }*/

}

exports.saveVideo = (msg, id, name, duration, callback) => {
    console.log(id);
    if (!id) {
        exports.bot.createMessage(msg.channel.id, `:cry: Error finding song! :cry:`);
        return;
    }
    //  if (!url)
    url = `https://www.youtube.com/watch?v=${id}`

    console.log(url);
    var filepath = path.join(__dirname, 'cache', `${id}.mp3`)
    if (!fs.existsSync(filepath)) {
        exports.bot.createMessage(msg.channel.id, `:cd: Downloading song \`${name}\`... :cd: `).then((newmessage) => {
            var stream = getStreamFromURL(url);
            //  console.log(util.inspect(stream));
            var writeStream = fs.createWriteStream(filepath);
            stream.pipe(writeStream);
            stream.on('end', () => {
                console.log('done');
                //    addToQueue(msg, filepath, name, duration);
                exports.bot.editMessage(msg.channel.id, newmessage.id, `:dvd: Finished downloading \`${name}\`! :dvd:`)
                setTimeout(() => {
                    exports.bot.deleteMessage(msg.channel.id, newmessage.id);
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
}

function addToQueue(msg, id, name, duration) {

    //   console.log(util.inspect(exports.connections))
    //  exports.connections[msg.channel.guild.id].playResource(filepath, { inlineVolume: 0.3 })
    //   exports.connections[msg.channel.guild.id].setVolume(0.3);
    if (!exports.queue.hasOwnProperty(msg.channel.guild.id)) {
        exports.queue[msg.channel.guild.id] = [];
    }
    var queue = exports.queue[msg.channel.guild.id]
    var init = moment.duration(0);
    //  console.log(init.hours(), init.minutes(), init.seconds())

    for (var i = 0; i < queue.length; i++) {
        init.add(moment.duration(cache[queue[i].id].duration))
        console.log(i, ':', init.hours(), init.minutes(), init.seconds())
    }
    //   console.log(init.hours(), init.minutes(), init.seconds())
    if (exports.current[msg.channel.guild.id]) {
        init.add(moment.duration(cache[exports.current[msg.channel.guild.id].id].duration))
        init.subtract(moment.duration(moment().diff(exports.current[msg.channel.guild.id].start)))
    }

    //  console.log(init.hours(), init.minutes(), init.seconds())

    var lengthUntilString = `${init.hours() > 0 ? `${init.hours()} hours, ` : ''}${init
        .minutes() > 0 ? `${init.minutes()} minutes, and ` : ''}${init.seconds()} seconds`
    queue.push({ id: id, requester: msg.author.id })
    if (!cache[id]) {
        cache[id] = {
            name: name,
            path: path.join(__dirname, 'cache', `${id}.mp3`),
            duration: duration
            //   requester: msg.author.id
        }
        saveCache()
    }
    exports.bot.createMessage(msg.channel.id, `:white_check_mark:  Added \`${name}\` to the queue.`
        + ` It will play in ${lengthUntilString}! :white_check_mark:`).then((newmessage) => {
            setTimeout(() => {
                exports.bot.deleteMessage(msg.channel.id, newmessage.id)
            }, 15000);
        });
    // console.log(duration);
    if (!exports.current[msg.channel.guild.id]) {
        exports.nextSong(msg)
    } else {
        if (queue.length == 1) {
            var id = queue[0].id
            exports.saveVideo(msg, id, cache[id].name, cache[id].duration);
        }
    }
}

function findVideo(msg, text, callback) {
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
            exports.bot.createMessage('No results found!')
        } else
            callback(res)
    })
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
                if (!exports.queue[msg.channel.guild.id])
                    exports.queue[msg.channel.guild.id] = []
                exports.queue[msg.channel.guild.id].push(newQueue[i]);
            }
            bu.bot.editMessage(msg2.channel.id, msg2.id, `:heavy_check_mark: Added ${newQueue.length} items to the queue :heavy_check_mark:`)
            setTimeout(() => {
                bu.bot.deleteMessage(msg2.channel.id, msg2.id)
            }, 15000)
            if (!exports.current[msg.channel.guild.id]) {
                exports.nextSong(msg)
            } else {
                if (exports.queue.length == 1) {
                    var id = exports.queue[0].id
                    exports.saveVideo(msg, id, cache[id].name, cache[id].duration);
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

