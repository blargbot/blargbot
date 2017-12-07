/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:26
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-30 12:38:56
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'realpad';
e.args = '&lt;text&gt; &lt;length&gt; [character] [direction]';
e.usage = '{pad;text;length[;character[;direction]]}';
e.desc = 'Pads the provided text to the provided length, using the provided character and direction. Character defaults to space, direction defaults to right.<br><br>This is how padding <em>should</em> be implemented, and the {pad} subtag is a sucks. The past me who thought it would be a good idea is also a sucks.';
e.exampleIn = '{realpad;ABC;6;0;left}';
e.exampleOut = '000ABC';

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args;
    var replaceString = '';
    var replaceContent = false;
    if (params.args[1] && params.args[2]) {
        let text = args[1];
        let length = args[2];
        let character = args[3] || ' ';
        let direction = args[4] || 'right';
        if (character.length > 1) {
            replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
        } else {
            let quantity = Math.max(0, length - text.length);
            switch (direction.toLowerCase()) {
                case 'left':
                    {
                        replaceString = character.repeat(quantity) + text;
                        break;
                    }
                case 'right':
                    {
                        replaceString = text + character.repeat(quantity);
                        break;
                    }
                default:
                    {
                        replaceString = await bu.tagProcessError(params, '`Invalid direction`');
                    }
            }
        }
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};