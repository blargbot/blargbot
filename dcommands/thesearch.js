var e = module.exports = {};

var gm = require('gm');
var path = require('path');
var moment = require('moment');
var util = require('util');
const Jimp = require('jimp');

e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'thesearch [text]';
e.info = `Tells everyone about the progress of the search for intelligent life.`;
e.longinfo = `<p>Tells everyone about the progress of the search for intelligent life.</p>`;

e.execute = async function(msg, words) {
    var shitText = 'I use betterdiscord';
    if (words[1]) shitText = words.slice(1).join(' ');
    shitText = await bu.filterMentions(shitText);
    logger.debug(util.inspect(words));
    bot.sendChannelTyping(msg.channel.id);
    let code = bu.genEventCode();
    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'thesearch',
        code: code,
        text: shitText,
    });    
    bu.send(msg, undefined, {
        file: buffer,
        name: 'TheSearch.png'
    });
};