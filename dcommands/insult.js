var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;

e.hidden = false;
e.usage = 'insult [name]';
e.info = 'Generates a random insult directed at the name supplied.';
e.longinfo = `<p>Generates an insult, directed at whatever name is supplied. If a name isn't supplied, defaults to 'Your'</p>`;

e.execute = (msg, words) => {
    var target = '';
    if (words.length === 1) {
        target = 'Your';
    } else {
        for (var i = 1; i < words.length; i++) {
            target += words[i] + ' ';
        }
        target = target.substring(0, target.length - 1);
    }
    var chosenNoun = bu.config.insult.nouns[(bu.getRandomInt(0, bu.config.insult.nouns.length - 1))];
    var chosenVerb = bu.config.insult.verbs[(bu.getRandomInt(0, bu.config.insult.verbs.length - 1))];
    var chosenAdje = bu.config.insult.adjectives[(bu.getRandomInt(0, bu.config.insult.adjectives.length - 1))];
    var message = `${target}${target == 'Your' ? `` : `'s`} ${chosenNoun} ${chosenVerb} ${chosenAdje}!`;
    bu.sendMessageToDiscord(msg.channel.id, message);
};