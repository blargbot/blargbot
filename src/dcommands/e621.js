const BaseCommand = require('../structures/BaseCommand');
const util = require('util');
const xml2js = require('xml2js');
const https = dep.https;

class E621Command extends BaseCommand {
    constructor() {
        super({
            name: 'e621',
            category: bu.CommandType.NSFW,
            usage: 'e621 <tags...>',
            info: 'Gets three pictures from \'<https://e621.net/>\' using given tags.'
        });
    }

    async execute(msg, words, text) {
        bu.isNsfwChannel(msg.channel.id).then(nsfwChannel => {

            var tagList = words.slice(1);

            if (words.length > 1)
                for (let i = 0; i < tagList.length; i++) {
                    console.debug(`${i}: ${tagList[i]}`);

                    tagList[i] = tagList[i].toLowerCase();
                }
            // listylist = tagList;
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

            var url = '/post/index.xml?limit=' + 50 + '&tags=' + usedTags.join('%20');

            var message = '';
            console.debug('url: ' + url);
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
                    //console.(chunk);
                    body += chunk;
                });

                res.on('end', function () {
                    //  console.('body: ' + body);
                    //   var xml = JSON.parse(body);
                    try {
                        xml2js.parseString(body, function (err, doc) {
                            if (err != null) {
                                console.error(err.stack);
                            }
                            //    parsedXml = doc;
                            //console.('result: ' + result);
                            var urlList = [];
                            if (doc.posts.post != null)
                                for (let i = 0; i < doc.posts.post.length; i++) {
                                    var imgUrl = doc.posts.post[i].file_url[0];
                                    //    console.(imgUrl);
                                    if (imgUrl.endsWith('.gif') || imgUrl.endsWith('.jpg') || imgUrl.endsWith('.png') || imgUrl.endsWith('.jpeg'))
                                        urlList.push(doc.posts.post[i].file_url);
                                }
                            //    console.(util.inspect(urlList));
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
                                    console.debug(`${choice} / ${urlList.length} - ${urlList[choice]}`);
                                    urlList.splice(choice, 1);
                                }
                            }
                            bu.send(msg, message);
                        });
                        // });
                    } catch (err) {
                        console.debug(err.stack);
                    }
                });
            });
            req.end();
        });
    }
}

module.exports = E621Command;
