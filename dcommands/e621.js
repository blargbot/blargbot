var e = module.exports = {};
var bu;
var xml2js = require('xml2js');
var https = require('https');

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;


    e.category = bu.CommandType.NSFW;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'e621 <tags...>';
e.info = 'Gets three pictures from \'<https://e621.net/>\' using given tags.';
e.longinfo = `<p>Displays three images obtained from <a href="http://e621.net/">e621.net</a> using the provided tags. You can use
        up to 6 tags at a time. Results have the possibility of being NSFW. If the current channel is not designated as
        NSFW, a user needs to include the 'rating:safe' tag in order to use the command.</p>`;

e.execute = (msg, words) => {
    bu.isNsfwChannel(msg.channel.id).then(nsfwChannel => {

        var tagList = JSON.parse(JSON.stringify(words));
        delete tagList[0];
        bu.send('230801689551175681', `**__e621__:** \n  **tags:** \`${tagList.join(' ')}\` \n  **user:** ${msg.author.username} (${msg.author.id}) \n  **channel:** ${msg.channel.name} (${msg.channel.id}) \n  **guild:** ${msg.channel.guild.name} (${msg.channel.guild.id}) \n  **NSFW Channel:** ${nsfwChannel}`);

        if (words.length > 1)
            for (let i = 1; i < tagList.length; i++) {
                bu.logger.debug(`${i}: ${tagList[i]}`);

                tagList[i] = tagList[i].toLowerCase();
            }
        // listylist = tagList;
        //    bu.logger.(`${'rating:safe' in tagList} ${'rating:s' in tagList} ${'rating:safe' in tagList || 'rating:s' in tagList} ${!('rating:safe' in tagList || 'rating:s' in tagList)}`)
        if (!nsfwChannel)
            if (!(tagList.indexOf('rating:safe') > -1 || tagList.indexOf('rating:s') > -1)) {
                //        bu.logger.(kek);
                bu.sendMessageToDiscord(msg.channel.id, bu.config.general.nsfwMessage);

                return;
            }

            
        var query = '';
        for (var tag in tagList) {
            query += tagList[tag] + '%20';
        }

        var url = '/post/index.xml?limit=' + 50 + '&tags=' + query;

        var message = '';
        bu.logger.debug('url: ' + url);
        var options = {
            hostname: 'e621.net',
            method: 'GET',
            port: 443,
            path: url,
            headers: {
                'User-Agent': 'blargbot/1.0 (ratismal)'
            }
        };
        var req = https.request(options, function (res) {
            var body = '';
            res.on('data', function (chunk) {
                //bu.logger.(chunk);
                body += chunk;
            });

            res.on('end', function () {
                //  bu.logger.('body: ' + body);
                //   var xml = JSON.parse(body);
                try {
                    xml2js.parseString(body, function (err, doc) {
                        if (err != null) {
                            bu.logger.error(err.stack);
                        }
                        //    parsedXml = doc;
                        //bu.logger.('result: ' + result);
                        var urlList = [];
                        if (doc.posts.post != null)
                            for (let i = 0; i < doc.posts.post.length; i++) {
                                var imgUrl = doc.posts.post[i].file_url[0];
                                //    bu.logger.(imgUrl);
                                if (imgUrl.endsWith('.gif') || imgUrl.endsWith('.jpg') || imgUrl.endsWith('.png') || imgUrl.endsWith('.jpeg'))
                                    urlList.push(doc.posts.post[i].file_url);
                            }
                        //    bu.logger.(util.inspect(urlList));
                        if (urlList.length == 0) {
                            bu.sendMessageToDiscord(msg.channel.id, 'No results found!');
                            return;
                        } else {
                            message = `Found **${urlList.length}/50** posts\n`;
                        }
                        //   parsedUrlList = JSON.parse(JSON.stringify(urlList));

                        for (let i = 0; i < 3; i++) {
                            if (urlList.length > 0) {
                                var choice = bu.getRandomInt(0, urlList.length - 1);
                                message += urlList[choice] + '\n';
                                bu.logger.debug(`${choice} / ${urlList.length} - ${urlList[choice]}`);
                                urlList.splice(choice, 1);
                            }
                        }
                        bu.sendMessageToDiscord(msg.channel.id, message);
                    });
                    // });
                } catch (err) {
                    bu.logger.debug(err.stack);
                }
            });
        });
        req.end();
    });
};