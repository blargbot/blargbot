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
        var tagList = words.slice(1);

        if (words.length > 1)
            for (let i = 1; i < tagList.length; i++) {
                console.debug(`${i}: ${tagList[i]}`);

                tagList[i] = tagList[i].toLowerCase();
            }
        //  listylist = tagList;
        //    console.(`${'rating:safe' in tagList} ${'rating:s' in tagList} ${'rating:safe' in tagList || 'rating:s' in tagList} ${!('rating:safe' in tagList || 'rating:s' in tagList)}`)
        if (!nsfwChannel)
            if (!(tagList.indexOf('rating:safe') > -1 || tagList.indexOf('rating:s') > -1)) {
                //        console.(kek);
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
        var url = '/posts.json?limit=' + 50 + '&tags=' + usedTags.join('%20');
        var message = '';

        console.debug('url: ' + url);
        var options = {
            hostname: 'danbooru.donmai.us',
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
                body += chunk;
            });

            res.on('end', function () {
                try {
                    var doc = JSON.parse(body);
                    var urlList = [];
                    var ii = 0;
                    if (doc.length > 0)
                        for (i = 0; i < doc.length; i++) {
                            var imgUrl;
                            if (doc[i].file_url) {
                                if ((doc[i].file_url).startsWith('https//')) {
                                    imgUrl = `https://${(doc[i].file_url).substring(7)}`;
                                } else if ((doc[i].file_url).startsWith('http//')) {
                                    imgUrl = `http://${(doc[i].file_url).substring(6)}`;
                                }
                                if (imgUrl.endsWith('.gif') || imgUrl.endsWith('.jpg') || imgUrl.endsWith('.png') || imgUrl.endsWith('.jpeg')) {
                                    urlList[ii] = imgUrl;
                                    ii++;
                                }
                            }
                        }
                    console.debug(urlList.length);
                    if (urlList.length == 0) {
                        bu.send(msg, 'No results found!');
                        return;
                    }
                    message += `Found **${urlList.length}/50** posts for tags \`${usedTags.join(' ')}\`\n`;
                    for (var i = 0; i < 3; i++) {
                        if (urlList.length > 0) {
                            var choice = bu.getRandomInt(0, urlList.length - 1);
                            message += urlList[choice] + '\n';
                            console.debug(`${choice} / ${urlList.length} - ${urlList[choice]}`);
                            urlList.splice(choice, 1);
                        }
                    }
                    bu.send(msg, message);
                } catch (err) {
                    console.error(err.stack);
                }
            });
        });
        req.end();
    });

};
