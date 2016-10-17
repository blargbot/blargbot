var e = module.exports = {};
var bu;
var moment = require('moment-timezone');
var fs = require('fs');
var path = require('path');
var util = require('util');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

var bot;
e.init = (Tbot, blargutil) => {
    bu = blargutil;
    bot = Tbot;
    initTags();
};


/**
 * Initializes every command found in the dcommands directory 
 * - hooray for modules!
 */
function initTags() {
    var fileArray = fs.readdirSync(path.join(__dirname, 'tags'));
    bu.r.table('rawtag').delete().run().then(() => {
        for (var i = 0; i < fileArray.length; i++) {

            var tagFile = fileArray[i];
            if (/.+\.js$/.test(tagFile)) {
                var tagName = tagFile.match(/(.+)\.js$/)[1];
                loadTag(tagName);
                bu.logger.init(`${i < 10 ? ' ' : ''}${i}.`, 'Loading tag module '
                    , tagName);
            } else {
                bu.logger.init('     Skipping non-tag ', tagFile);
            }
        }
    });
}

/**
 * Loads a specific command
 * @param commandName - the name of the command to load (String)
 */
function loadTag(tagName) {

    bu.tags[tagName] = require(`./tags/${tagName}.js`);
    if (bu.tags[tagName].isTag) {
        buildTag(tagName);
    } else {
        bu.logger.init('     Skipping non-tag ', tagName + '.js');
    }
}

// Refactored a major part of loadCommand and reloadCommand into this
function buildTag(tagName) {
    bu.tags[tagName].init(bot, bu);
    var tag = {
        tagName: tagName,
        args: bu.tags[tagName].args,
        usage: bu.tags[tagName].usage,
        desc: bu.tags[tagName].desc,
        exampleIn: bu.tags[tagName].exampleIn,
        exampleOut: bu.tags[tagName].exampleOut
    };
    bu.tagList[bu.tags[tagName].name] = tag;
    bu.r.table('rawtag').insert({
        name: tagName,
        usage: tag.usage,
        args: tag.args,
        info: tag.desc,
        examplein: tag.exampleIn,
        exampleout: tag.exampleOut,
        type: bu.tags[tagName].category
    }).run();
}

e.processTag = async((msg, contents, command, tagName, author) => {
    try {
        tagName = tagName || msg.channel.guild.id;
        author = author || msg.channel.guild.id;
        var words = bu.splitInput(command);

        if (contents.split(' ')[0].indexOf('help') > -1) {
            contents = '\u200B' + contents;
        }
        contents = contents.replace(new RegExp(bu.specialCharBegin, 'g'), '').replace(new RegExp(bu.specialCharDiv, 'g'), '').replace(new RegExp(bu.specialCharEnd, 'g'), '');

        var fallback = '';

        contents = await(bu.processTag(msg, words, contents, fallback, author, tagName));
        contents = bu.processSpecial(contents, true);
    } catch (err) {
        bu.logger.error(err);
    }
    return contents;
});

e.executeTag = async((msg, tagName, command) => {
    let tag = await(bu.r.table('tag').get(tagName).run());
    if (!tag)
        bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exist! ❌`);
    else {
        if (tag.content.toLowerCase().indexOf('{nsfw}') > -1) {
            let nsfwChan = await(bu.isNsfwChannel(msg.channel.id));
            if (!nsfwChan) {
                bu.sendMessageToDiscord(msg.channel.id, `❌ This tag contains NSFW content! Go to an NSFW channel. ❌`);
                return;
            }
        }
        bu.r.table('tag').get(tagName).update({
            uses: tag.uses + 1
        }).run();
        var message = await(e.processTag(msg, tag.content, command, tagName, tag.author));
        while (/<@!?[0-9]{17,21}>/.test(message)) {
            let match = message.match(/<@!?([0-9]{17,21})>/)[1];
            bu.logger.debug(match);
            let obtainedUser = await(bu.getUser(msg, match, true));
            let name = '';
            if (obtainedUser) {
                name = `@${obtainedUser.username}#${obtainedUser.discriminator}`;
            } else {
                name = `@${match}`;
            }
            message = message.replace(new RegExp(`<@!?${match}>`, 'g'), name);
        }
        if (message != '')
            bu.sendMessageToDiscord(msg.channel.id, message);
    }
});

