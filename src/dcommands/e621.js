var e = module.exports = {};

var xml2js = dep.xml2js;
var https = dep.https;

e.init = () => {
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

        var tagList = words.slice(1);

        if (words.length > 1)
            for (let i = 0; i < tagList.length; i++) {
                logger.debug(`${i}: ${tagList[i]}`);

                tagList[i] = tagList[i].toLowerCase();
            }
        // listylist = tagList;
        //    logger.(`${'rating:safe' in tagList} ${'rating:s' in tagList} ${'rating:safe' in tagList || 'rating:s' in tagList} ${!('rating:safe' in tagList || 'rating:s' in tagList)}`)
        if (!nsfwChannel)
            if (!(tagList.indexOf('rating:safe') > -1 || tagList.indexOf('rating:s') > -1)) {
                //        logger.(kek);
                bu.send(msg, config.general.nsfwMessage);

                return;
            } else {
                tagList.sort((a, b) => {
                    if (/rating\:s(afe)?/.test(a)) {
                        return 1000;
                    }
                    if (/rating\:s(afe)?/.test(b)) {
                        return -1000;
                    }
                    return a - b;
                });
            }


        const usedTags = [];
        for (var tag of tagList) {
            if (!/(loli|shota|child|young)/i.test(tag)) {
                usedTags.push(tag);
            }
        }

        var url = '/post/index.xml?limit=' + 50 + '&tags=' + usedTags.join('%20');

        var message = '';
        logger.debug('url: ' + url);
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
                //logger.(chunk);
                body += chunk;
            });

            res.on('end', function () {
                //  logger.('body: ' + body);
                //   var xml = JSON.parse(body);
                try {
                    xml2js.parseString(body, function (err, doc) {
                        if (err != null) {
                            logger.error(err.stack);
                        }
                        //    parsedXml = doc;
                        //logger.('result: ' + result);
                        var urlList = [];
                        if (doc.posts.post != null)
                            for (let i = 0; i < doc.posts.post.length; i++) {
                                var imgUrl = doc.posts.post[i].file_url[0];
                                //    logger.(imgUrl);
                                if (imgUrl.endsWith('.gif') || imgUrl.endsWith('.jpg') || imgUrl.endsWith('.png') || imgUrl.endsWith('.jpeg'))
                                    urlList.push(doc.posts.post[i].file_url);
                            }
                        //    logger.(dep.util.inspect(urlList));
                        if (urlList.length == 0) {
                            bu.send(msg, 'No results found!');
                            return;
                        } else {
                            message = `Found **${urlList.length}/50** posts for tags \`${usedTags.join(' ')}\`\n`;
                        }
                        //   parsedUrlList = JSON.parse(JSON.stringify(urlList));

                        for (let i = 0; i < 3; i++) {
                            if (urlList.length > 0) {
                                var choice = bu.getRandomInt(0, urlList.length - 1);
                                message += urlList[choice] + '\n';
                                logger.debug(`${choice} / ${urlList.length} - ${urlList[choice]}`);
                                urlList.splice(choice, 1);
                            }
                        }
                        bu.send(msg, message);
                    });
                    // });
                } catch (err) {
                    logger.debug(err.stack);
                }
            });
        });
        req.end();
    });
};