/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:48:30
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:48:30
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};
e.init = () => {
    e.category = bu.TagType.COMPLEX;
};
e.requireCtx = require;
e.isTag = true;

e.name = 'inject';
e.args = '&lt;code&gt;';
e.usage = '{inject;code}';
e.desc = 'Injects code into the tag. For example, doing {inject;{args}} will let any user execute any code. Use with caution.';
e.exampleIn = 'Random Number: {inject;{lb}randint{semi}1{semi}4{lb}}';
e.exampleOut = 'Random Number: 3';

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    if (params.args[1]) {
        let newStuff = bu.processSpecial(params.args[1], true);
        logger.debug('Thonkang', params.args, newStuff);
        params.content = newStuff;
        replaceString = await bu.processTagInner(params);
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};