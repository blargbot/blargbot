var e = module.exports = {};

const { xml2js, sf } = dep;

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

e.execute = async (msg, words) => {
    let nsfwChannel = msg.channel.nsfw;

    var tagList = words.slice(1);

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
    logger.debug(res);

    xml2js.parseString(res.body, function (err, doc) {
        if (err != null) {
            logger.debug('error: ' + err.message);
        }
        //    parsedXml = doc;
        //logger.('result: ' + result);
        var urlList = [];
        //   logger.(dep.util.inspect(doc.posts.post[0]))
        if (doc.posts.post != null)
            for (let i = 0; i < doc.posts.post.length; i++) {
                var imgUrl = doc.posts.post[i].$.file_url;
                if (imgUrl.endsWith('.gif') || imgUrl.endsWith('.jpg') || imgUrl.endsWith('.png') || imgUrl.endsWith('.jpeg'))
                    urlList.push(doc.posts.post[i].$.file_url);
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
                urlList.splice(choice, 1);
            }
        }
        bu.send(msg, message);
    });

};