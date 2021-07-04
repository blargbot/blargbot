const BaseCommand = require('../structures/BaseCommand');
const https = require('https');
const newbutils = require('../newbu');

class DanbooruCommand extends BaseCommand {
    constructor() {
        super({
            name: 'danbooru',
            category: newbutils.commandTypes.NSFW,
            usage: 'danbooru <tags...>',
            info: 'Gets three pictures from \'<https://danbooru.donmai.us/>\' using given tags.'
        });
    }

    async execute(msg, words) {
        bu.isNsfwChannel(msg.channel.id).then(nsfwChannel => {
            let tagList = words.slice(1);

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
                        if (/rating:s(afe)?/.test(a)) {
                            return 1000;
                        }
                        if (/rating:s(afe)?/.test(b)) {
                            return -1000;
                        }
                        return a - b;
                    });
                }
            const usedTags = [];
            for (let tag of tagList) {
                if (!/(loli|shota|child|young)/i.test(tag)) {
                    usedTags.push(tag);
                }
            }
            let url = '/posts.json?limit=' + 50 + '&tags=' + usedTags.join('%20');
            let message = '';

            console.debug('url: ' + url);
            let options = {
                hostname: 'danbooru.donmai.us',
                method: 'GET',
                port: 443,
                path: url,
                headers: {
                    'User-Agent': 'blargbot/1.0 (ratismal)'
                }
            };

            let req = https.request(options, function (res) {
                let body = '';
                res.on('data', function (chunk) {
                    body += chunk;
                });

                res.on('end', function () {
                    try {
                        let doc = JSON.parse(body);
                        let urlList = [];
                        let ii = 0;
                        if (doc.length > 0)
                            for (i = 0; i < doc.length; i++) {
                                if (doc[i].file_url) {
                                    let imgUrl = doc[i].file_url;
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
                        for (let i = 0; i < 3; i++) {
                            if (urlList.length > 0) {
                                let choice = bu.getRandomInt(0, urlList.length - 1);
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
    }
}

module.exports = DanbooruCommand;
