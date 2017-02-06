var e = module.exports = {};

e.processTag = async function(msg, contents, command, tagName, author, isCcommand) {
    try {
        author = author || msg.channel.guild.id;
        logger.debug(command);
        var words = bu.splitInput(command);

        if (contents.split(' ')[0].indexOf('help') > -1) {
            contents = '\u200B' + contents;
        }
        contents = contents.replace(new RegExp(bu.specialCharBegin, 'g'), '').replace(new RegExp(bu.specialCharDiv, 'g'), '').replace(new RegExp(bu.specialCharEnd, 'g'), '');

        contents = await bu.processTag({
            msg,
            words,
            contents,
            author,
            tagName,
            ccommand: isCcommand
        });
        contents = bu.processSpecial(contents.contents, true);
    } catch (err) {
        logger.error(err);
    }
    return contents;
};

e.executeTag = async function(msg, tagName, command) {
    let tag = await r.table('tag').get(tagName).run();
    if (!tag)
        bu.send(msg, `❌ That tag doesn't exist! ❌`);
    else {
        if (tag.content.toLowerCase().indexOf('{nsfw}') > -1) {
            let nsfwChan = await bu.isNsfwChannel(msg.channel.id);
            if (!nsfwChan) {
                bu.send(msg, `❌ This tag contains NSFW content! Go to an NSFW channel. ❌`);
                return;
            }
        }
        r.table('tag').get(tagName).update({
            uses: tag.uses + 1,
            lastuse: r.now()
        }).run();
        var message = await e.processTag(msg, tag.content, command, tagName, tag.author);
        while (/<@!?[0-9]{17,21}>/.test(message)) {
            let match = message.match(/<@!?([0-9]{17,21})>/)[1];
            logger.debug(match);
            let obtainedUser = await bu.getUser(msg, match, true);
            let name = '';
            if (obtainedUser) {
                name = `@${obtainedUser.username}#${obtainedUser.discriminator}`;
            } else {
                name = `@${match}`;
            }
            message = message.replace(new RegExp(`<@!?${match}>`, 'g'), name);
        }
        if (message != '')
            bu.send(msg, message);
    }
};