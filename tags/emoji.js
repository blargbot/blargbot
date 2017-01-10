var e = module.exports = {};
const request = require('request');

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'emoji';
e.args = '&lt;text&gt; [amount]';
e.usage = '{emoji;text[;amount]}';
e.desc = 'Gets <code>amount</code> (or 5 if <code>amount</code> isn&apos;t specified) emojis related to the given text. There\'s a limit of 10 emojis.';
e.exampleIn = '{emoji;I am hungry;5}';
e.exampleOut = '🍔 🍕 😩 🍴 😐';

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    let parsedFallback = parseInt(params.fallback);
    if (args[1]) {
        let q = encodeURIComponent(args[1]);
        let amount = parseInt(args[2]) || parsedFallback;
        if (amount > 10) amount = 10;
        else if (amount < 1) amount = 1;
        let emojis = await new Promise((resolve, reject) => {
            request(`https://emoji.getdango.com/api/emoji?q=${q}`, (req, res, body) => {
                body = JSON.parse(body);
                resolve(body.results.map(result => result.text));
            });
        });
        emojis.splice(amount);
        replaceString = emojis.join(' ');
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};