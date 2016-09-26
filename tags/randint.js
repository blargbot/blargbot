var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `randint`;
e.args = `[min] &lt;max&gt;`;
e.usage = `{randint[;min];max}`;
e.desc = `If only max is specified, gets a random number between max and 0. If both arguments are
                                specified,
                                gets
                                a random number between them.
                            `;
e.exampleIn = `You rolled a {randint;1;6}`;
e.exampleOut = `You rolled a 5`;


e.execute = (msg, args, fallback) => {
    var replaceString = '';
    var replaceContent = false;
    if (args.length == 2) {
        replaceString = bu.getRandomInt(0, parseInt(bu.processSpecial(args[1])));
    } else if (args.length > 2) {
        replaceString = bu.getRandomInt(parseInt(bu.processSpecial(args[1])), parseInt(bu.processSpecial(args[2])));
    } else {
        replaceString = bu.tagProcessError(fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};