/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:04
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-30 11:34:56
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `webhook`;
e.args = `&lt;id&gt; &lt;token&gt; [content] [embed] [username] [avatarURL]`;
e.usage = `{webhook;id;token[;content[;embed[;username[;avatarURL]]]]}`;
e.desc = `Executes a webhook. The <code>embed</code> must be provided in a raw JSON format, properly escaped for BBTag. A simple escaping utility can be accessed <a href='https://rewrite.blargbot.xyz/v1escaper'>here</a>. Please assign your webhook credentials to private variables! Do not leave them in your code.`;
e.exampleIn = `{webhook;1111111111111111;t.OK-en;Hello!}`;
e.exampleOut = `In the webhook channel: Hello!`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;

    if (params.args.length < 2) {
        replaceString = bu.tagProcessError(params, `\`Not enough args\``)
    } else
        try {
            let embed;
            if (params.args[4]) {
                params.args[4] = bu.processSpecial(params.args[4], true);

                try {
                    embed = JSON.parse(params.args[4]);
                } catch (err) {
                    embed = {
                        fields: [{ name: 'Malformed JSON', value: params.args[4] }]
                    }
                }
            }
            await bot.executeWebhook(params.args[1], params.args[2], {
                username: params.args[5],
                avatarURL: params.args[6],
                content: params.args[3] || '',
                embeds: embed ? [embed] : []
            });
        } catch (err) {
            replaceString = bu.tagProcessError(params, `\`Error executing webhook: ${err.message}\``)
        }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};