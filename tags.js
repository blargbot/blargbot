var e = module.exports = {};
var bu;
var moment = require('moment-timezone');
var fs = require('fs');
var path = require('path');
var util = require('util');

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
    for (var i = 0; i < fileArray.length; i++) {

        var tagFile = fileArray[i];
        if (/.+\.js$/.test(tagFile)) {
            var tagName = tagFile.match(/(.+)\.js$/)[1];
            loadTag(tagName);
            console.log(`${i < 10 ? ' ' : ''}${i}.`, 'Loading tag module '
                , tagName);
        } else {
            console.log('     Skipping non-tag ', tagFile);

        }
    }
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
        console.log('     Skipping non-tag ', tagName + '.js');
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
    bu.db.query('delete from rawtag', () => {
        bu.db.query(`insert into rawtag (tagname, tusage, args, description, examplein, exampleout, type) values (?, ?, ?, ?, ?, ?, ?)
           `,
            [tagName, tag.usage, tag.args, tag.desc, tag.exampleIn, tag.exampleOut, bu.tags[tagName].category]);
    });

}

e.processTag = (msg, contents, command, tagName, author) => {
    try {
        tagName = tagName || msg.channel.guild.id;
        author = author || msg.channel.guild.id;
        var words = bu.splitInput(command);

        if (contents.split(' ')[0].indexOf('help') > -1) {
            contents = '\u200B' + contents;
        }
        contents = contents.replace(new RegExp(bu.specialCharBegin, 'g'), '').replace(new RegExp(bu.specialCharDiv, 'g'), '').replace(new RegExp(bu.specialCharEnd, 'g'), '');

        var fallback = '';

        contents = bu.processTag(msg, words, contents, fallback, author, tagName);
        contents = bu.processSpecial(contents, true);

        return contents;
    } catch (err) {
        console.log(err);
    }


};

e.executeTag = (msg, tagName, command) => {
    bu.db.query(`select contents, author from tag where title=?`, [tagName], (err, row) => {
        if (!row[0])
            bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exist! ❌`);
        else {
            var nsfw = false;
            if (row[0].contents.indexOf('{nsfw}') > -1) {
                nsfw = true;
            }
            var message = e.processTag(msg, row[0].contents, command, tagName, row[0].author);
            while (/<@!?[0-9]{17,21}>/.test(message)) {
                let match = message.match(/<@!?([0-9]{17,21})>/)[1];
                console.log(match);
                let obtainedUser = bu.getUserFromName(msg, match, true);
                let name = '';
                if (obtainedUser) {
                    name = `@${obtainedUser.username}#${obtainedUser.discriminator}`;
                } else {
                    name = `@${match}`;
                }
                message = message.replace(new RegExp(`<@!?${match}>`, 'g'), name);
            }
            if (message != '')
                if (!nsfw)
                    bu.sendMessageToDiscord(msg.channel.id, message);
                else {
                    bu.db.query('select channelid from nsfwchan where channelid = ?', [msg.channel.id], (err, rows) => {
                        if (rows && rows[0]) {
                            bu.sendMessageToDiscord(msg.channel.id, message);

                        } else {
                            bu.sendMessageToDiscord(msg.channel.id, `❌ This tag contains NSFW content! Go to an NSFW channel. ❌`);
                        }
                    });
                }

        }
    });
};

