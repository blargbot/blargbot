/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:36:29
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:37:14
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

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

e.execute = async function (params) {
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
            dep.request(`https://emoji.getdango.com/api/emoji?q=${q}`, (req, res, body) => {
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
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};