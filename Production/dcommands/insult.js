var e = module.exports = {};

e.init = () => {
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
        var chosenNoun = config.insult.nouns[(bu.getRandomInt(0, config.insult.nouns.length - 1))];
        var chosenVerb = config.insult.verbs[(bu.getRandomInt(0, config.insult.verbs.length - 1))];
        var chosenAdje = config.insult.adjectives[(bu.getRandomInt(0, config.insult.adjectives.length - 1))];
        var message = `${target}${target == 'Your' ? `` : `'s`} ${chosenNoun} ${chosenVerb} ${chosenAdje}!`;
    bu.send(msg, message);
};