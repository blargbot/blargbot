const BaseCommand = require('../structures/BaseCommand');
const util = require('util');
const xml2js = dep.xml2js;
const sf = dep.sf;

class Rule34Command extends BaseCommand {
    constructor() {
        super({
            name: 'rule34',
            category: bu.CommandType.NSFW,
            usage: 'rule34 <tags...>',
            info: 'Gets three pictures from \'<https://rule34.xxx/>\' using given tags.'
        });
    }

    async execute(msg, words, text) {
        let nsfwChannel = msg.channel.nsfw;

        var tagList = words.slice(1);

        if (words.length > 1)
            for (let i = 1; i < tagList.length; i++) {
                console.debug(`${i}: ${tagList[i]}`);

                tagList[i] = tagList[i].toLowerCase();
            }
        // listylist = tagList;
        //    console.(`${'rating:safe' in tagList} ${'rating:s' in tagList} ${'rating:safe' in tagList || 'rating:s' in tagList} ${!('rating:safe' in tagList || 'rating:s' in tagList)}`)
        if (!nsfwChannel) {
            bu.send(msg, config.general.nsfwMessage);
            return;
        }
        const usedTags = [];
        for (var tag of tagList) {
            if (!/(loli|shota|child|young)/i.test(tag)) {
                usedTags.push(tag);
            }
        }

        let res = await sf.get('http://rule34.paheal.net/api/danbooru/find_posts/index.xml').query({
            tags: usedTags.join('%20'),
            limit: 50
        });
        console.debug(res);

        xml2js.parseString(res.body, function (err, doc) {
            if (err != null) {
                console.debug('error: ' + err.message);
            }
            //    parsedXml = doc;
            //console.('result: ' + result);
            var urlList = [];
            let message;
            //   console.(util.inspect(doc.posts.post[0]))
            if (doc.posts.post != null)
                for (let i = 0; i < doc.posts.post.length; i++) {
                    var imgUrl = doc.posts.post[i].$.file_url;
                    if (imgUrl.endsWith('.gif') || imgUrl.endsWith('.jpg') || imgUrl.endsWith('.png') || imgUrl.endsWith('.jpeg'))
                        urlList.push(doc.posts.post[i].$.file_url);
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
                    urlList.splice(choice, 1);
                }
            }
            bu.send(msg, message);
        });
    }
}

module.exports = Rule34Command;
