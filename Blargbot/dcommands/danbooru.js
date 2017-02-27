var e = module.exports = {};

var https = dep.https;

e.init = () => {
    e.category = bu.CommandType.NSFW;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'danbooru <tags...>';
e.info = 'Gets three pictures from \'<https://danbooru.donmai.us/>\' using given tags.';
e.longinfo = `<p>Displays three images obtained from <a href="https://danbooru.donmai.us/">danbooru.donmai.us</a> using the
        provided tags. You can use up to 2 tags at a time. Results have the possibility of being NSFW. If the current
        channel is not designated as NSFW, a user needs to include the 'rating:safe' tag in order to use the command.</p>`;

e.execute = (msg, words) => {
    bu.isNsfwChannel(msg.channel.id).then(nsfwChannel => {
        var tagList = JSON.parse(JSON.stringify(words));
        delete tagList[0];

        if (words.length > 1)
            for (let i = 1; i < tagList.length; i++) {
                logger.debug(`${i}: ${tagList[i]}`);

                tagList[i] = tagList[i].toLowerCase();
            }
        //  listylist = tagList;
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
        var query = '';
        for (var tag in tagList) {
            query += tagList[tag] + '%20';
        }

        var url = '/posts.json?limit=' + 50 + '&tags=' + query;
        var message = '';

        logger.debug('url: ' + url);
        var options = {
            hostname: 'danbooru.donmai.us',
            method: 'GET',
            port: 443,
            path: url,
            headers: {
                'User-Agent': 'blargbot/1.0 (ratismal)'
            }
        };

        var req = https.request(options, function(res) {
            var body = '';
            res.on('data', function(chunk) {
                body += chunk;
            });

            res.on('end', function() {
                try {
                    var doc = JSON.parse(body);
                    var urlList = [];
                    var ii = 0;
                    if (doc.length > 0)
                        for (i = 0; i < doc.length; i++) {
                            var imgUrl;
                            if (doc[i].file_url) {
                                imgUrl = `http://danbooru.donmai.us${doc[i].file_url}`;
                                if (imgUrl.endsWith('.gif') || imgUrl.endsWith('.jpg') || imgUrl.endsWith('.png') || imgUrl.endsWith('.jpeg')) {
                                    urlList[ii] = imgUrl;
                                    ii++;
                                }
                            }
                        }
                    logger.debug(urlList.length);
                    if (urlList.length == 0) {
                        bu.send(msg, 'No results found!');
                        return;
                    }
                    message += `Found **${urlList.length}/50** posts\n`;
                    for (var i = 0; i < 3; i++) {
                        if (urlList.length > 0) {
                            var choice = bu.getRandomInt(0, urlList.length - 1);
                            message += urlList[choice] + '\n';
                            logger.debug(`${choice} / ${urlList.length} - ${urlList[choice]}`);
                            urlList.splice(choice, 1);
                        }
                    }
                    bu.send(msg, message);
                } catch (err) {
                    logger.error(err.stack);
                }
            });
        });
        req.end();
    });

};