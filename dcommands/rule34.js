var e = module.exports = {};

var xml2js = require('xml2js');
var https = require('https');

e.init = () => {
    
    

    e.category = bu.CommandType.NSFW;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'rule34 <tags...>';
e.info = 'Gets three pictures from \'<https://rule34.xxx/>\' using given tags.';
e.longinfo = `<p>Displays three images obtained from <a href="http://rule34.xxx/">rule34.xxx</a> using the provided tags.
        The current channel needs to be marked as NSFW in order for the command to work.</p>`;

e.execute = (msg, words) => {
    bu.isNsfwChannel(msg.channel.id).then(nsfwChannel => {

        var tagList = JSON.parse(JSON.stringify(words));
        delete tagList[0];
        bu.send('230801689551175681', `**__rule34__:** \n  **tags:** \`${tagList.join(' ')}\` \n  **user:** ${msg.author.username} (${msg.author.id}) \n  **channel:** ${msg.channel.name} (${msg.channel.id}) \n  ${msg.channel.guild ? `**guild:** ${msg.channel.guild.name} (${msg.channel.guild.id})` : ''}\n  **NSFW Channel:** ${nsfwChannel}`);
        if (words.length > 1)
            for (let i = 1; i < tagList.length; i++) {
                logger.debug(`${i}: ${tagList[i]}`);

                tagList[i] = tagList[i].toLowerCase();
            }
        // listylist = tagList;
        //    logger.(`${'rating:safe' in tagList} ${'rating:s' in tagList} ${'rating:safe' in tagList || 'rating:s' in tagList} ${!('rating:safe' in tagList || 'rating:s' in tagList)}`)
        if (!nsfwChannel) {
            bu.send(msg, config.general.nsfwMessage);
            return;
        }
        var query = '';
        for (var tag in tagList) {
            query += tagList[tag] + '%20';
        }

        var url = `/index.php?page=dapi&s=post&q=index&limit=${50}&tags=${query}`;

        var message = '';
        logger.debug('url: ' + url);
        var options = {
            hostname: 'rule34.xxx',
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
                //logger.(chunk);
                body += chunk;
            });

            res.on('end', function () {
                //  logger.('body: ' + body);
                //   var xml = JSON.parse(body);
                try {
                    xml2js.parseString(body, function (err, doc) {
                        if (err != null) {
                            logger.debug('error: ' + err.message);
                        }
                        //    parsedXml = doc;
                        //logger.('result: ' + result);
                        var urlList = [];
                        //   logger.(util.inspect(doc.posts.post[0]))
                        if (doc.posts.post != null)
                            for (let i = 0; i < doc.posts.post.length; i++) {
                                var imgUrl = doc.posts.post[i].$.file_url;
                                if (imgUrl.endsWith('.gif') || imgUrl.endsWith('.jpg') || imgUrl.endsWith('.png') || imgUrl.endsWith('.jpeg'))
                                    urlList.push('http:' + doc.posts.post[i].$.file_url);
                            }
                        //    logger.(util.inspect(urlList));
                        if (urlList.length == 0) {
                            bu.send(msg, 'No results found!');
                            return;
                        } else {
                            message = `Found **${urlList.length}/50** posts\n`;
                        }
                        //   parsedUrlList = JSON.parse(JSON.stringify(urlList));

                        for (let i = 0; i < 3; i++) {
                            if (urlList.length > 0) {
                                var choice = bu.getRandomInt(0, urlList.length - 1);
                                message += urlList[choice] + '\n';
                                urlList.splice(choice, 1);
                            }
                        }
                        bu.send(msg, message);
                    });
                } catch (err) {
                    logger.error(err.stack);
                }
            });
        });
        req.end();
    });
};