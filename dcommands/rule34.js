var e = module.exports = {}
var bu = require('./../util.js')
var xml2js = require('xml2js')
var https = require('https')
var util = require('util')
var bot
e.init = (Tbot) => {
    bot = Tbot
}
e.requireCtx = require

e.isCommand = true
e.hidden = false
e.usage = 'rule34 <tags...>';
e.info = 'Gets three pictures from \'<https://rule34.xxx/>\' using given tags.';
e.category = bu.CommandType.GENERAL

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
    // listylist = tagList;
    //    console.log(`${'rating:safe' in tagList} ${'rating:s' in tagList} ${'rating:safe' in tagList || 'rating:s' in tagList} ${!('rating:safe' in tagList || 'rating:s' in tagList)}`)
    if (!nsfwChannel)
        //   if (!(tagList.indexOf('rating:safe') > -1 || tagList.indexOf('rating:s') > -1)) {
        //        console.log(kek);
        if (!bu.hasPerm(msg, 'Porn Summoner')) {
            return;
            //    }
        }
    var query = '';
    for (var tag in tagList) {
        query += tagList[tag] + "%20";
    }

    var url = `/index.php?page=dapi&s=post&q=index&limit=${50}&tags=${query}`;

    var message = '';
    console.log("url: " + url);
    var options = {
        hostname: 'rule34.xxx',
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
                xml2js.parseString(body, function (err, doc) {
                    if (err != null) {
                        console.log("error: " + err.message);
                    }
                    //    parsedXml = doc;
                    //console.log("result: " + result);
                    var urlList = [];
                    //   console.log(util.inspect(doc.posts.post[0]))
                    if (doc.posts.post != null)
                        for (i = 0; i < doc.posts.post.length; i++) {
                            var imgUrl = doc.posts.post[i]['$'].file_url;
                            console.log(imgUrl);
                            if (imgUrl.endsWith('.gif') || imgUrl.endsWith('.jpg') || imgUrl.endsWith('.png') || imgUrl.endsWith('.jpeg'))
                                urlList.push('http:' + doc.posts.post[i]['$'].file_url);
                        }
                    //    console.log(util.inspect(urlList));
                    if (urlList.length == 0) {
                        bu.sendMessageToDiscord(msg.channel.id, "No results found!");
                        return;
                    } else {
                        message = `Found ${urlList.length}/50 posts\n`;
                    }
                    //   parsedUrlList = JSON.parse(JSON.stringify(urlList));

                    for (i = 0; i < 3; i++) {
                        if (urlList.length > 0) {
                            var choice = bu.getRandomInt(0, urlList.length - 1);
                            message += urlList[choice] + "\n";
                            console.log(`${choice} / ${urlList.length} - ${urlList[choice]}`);
                            urlList.splice(choice, 1);
                        }
                    }
                    bu.sendMessageToDiscord(msg.channel.id, message);
                });
                // });
            } catch (err) {
                console.log(err.stack);
            }
        });
    });
    req.end();
}