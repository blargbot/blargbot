var e = module.exports = {}
var bu = require('./../util.js')
var https = require('https')

var bot
e.init = (Tbot) => {
    bot = Tbot
}

e.requireCtx = require

e.isCommand = true
e.hidden = false
e.usage = 'danbooru <tags...>';
e.info = 'Gets three pictures from \'<https://danbooru.donmai.us/>\' using given tags.';
e.category = bu.CommandType.NSFW

e.execute = (msg, words, text) => {
    var nsfwChannel = false;
    if (bu.config.discord.servers[msg.channel.guild.id])
        if (bu.config.discord.servers[msg.channel.guild.id].nsfw && bu.config.discord.servers[msg.channel.guild.id].nsfw[msg.channel.id])
            nsfwChannel = true;
    var tagList = JSON.parse(JSON.stringify(words));
    delete tagList[0];
    if (words.length > 1)
        for (i = 1; i < tagList.length; i++) {
            console.log(`${i}: ${tagList[i]}`);

            tagList[i] = tagList[i].toLowerCase();
        }
    //  listylist = tagList;
    //    console.log(`${'rating:safe' in tagList} ${'rating:s' in tagList} ${'rating:safe' in tagList || 'rating:s' in tagList} ${!('rating:safe' in tagList || 'rating:s' in tagList)}`)
    if (!nsfwChannel)
        if (!(tagList.indexOf('rating:safe') > -1 || tagList.indexOf('rating:s') > -1)) {
            //        console.log(kek); 
            bu.sendMessageToDiscord(msg.channel.id, `:scream_cat: I can't post something like that here! Go to an NSFW channel :scream_cat:`)

            return;
        }
    var query = '';
    for (var tag in tagList) {
        query += tagList[tag] + "%20";
    }

    var url = "/posts.json?limit=" + 50 + "&tags=" + query;
    var message = '';

    console.log("url: " + url);
    var options = {
        hostname: 'danbooru.donmai.us',
        method: 'GET',
        port: 443,
        path: url,
        headers: {
            "User-Agent": "blargbot/1.0 (ratismal)"
        }
    };

    var req = https.request(options, function (res) {
        var body = '';
        res.on('data', function (chunk) {
            //console.log(chunk);
            body += chunk;
        });

        res.on('end', function () {
            //  console.log("body: " + body);
            //   var xml = JSON.parse(body);
            try {
                //  if (err != null) {
                //      console.log("error: " + err.message);
                //  }
                var doc = JSON.parse(body);
                //             danbooruDoc = doc;
                //      parsedXml = doc;
                //console.log("result: " + result);
                var urlList = [];
                var ii = 0;
                if (doc.length > 0)
                    for (i = 0; i < doc.length; i++) {
                        var imgUrl;
                        if (doc[i].file_url) {
                            //       console.log(doc[i].file_url);
                            imgUrl = `http://danbooru.donmai.us${doc[i].file_url}`;
                            //    console.log(imgUrl);
                            if (imgUrl.endsWith('.gif') || imgUrl.endsWith('.jpg') || imgUrl.endsWith('.png') || imgUrl.endsWith('.jpeg')) {
                                urlList[ii] = imgUrl;
                                ii++;
                                //      console.log(ii);
                            }
                        }
                    }
                console.log(urlList.length);
                if (urlList.length == 0) {
                    bu.sendMessageToDiscord(msg.channel.id, "No results found!");
                    return;
                }
                //    parsedUrlList = JSON.parse(JSON.stringify(urlList));
                //      danbooruUrl = parsedUrlList;
                for (var i = 0; i < 3; i++) {
                    if (urlList.length > 0) {
                        var choice = bu.getRandomInt(0, urlList.length - 1);
                        message += urlList[choice] + "\n";
                        console.log(`${choice} / ${urlList.length} - ${urlList[choice]}`);
                        urlList.splice(choice, 1);
                    }
                }
                bu.sendMessageToDiscord(msg.channel.id, message);
                // });
            } catch (err) {
                console.log(err.stack);
            }
        });
    });
    req.end();
}