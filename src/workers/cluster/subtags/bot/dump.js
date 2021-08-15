/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:04
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-12 08:32:58
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.BotTag('dump')
        .withArgs(a => [
            a.required('text')
        ])
        .withDesc('Dumps the provided text to a blargbot output page. These expire after 7 days.')
        .withExample(
            '{dump;Hello, world!}',
            'https://blargbot.xyz/output/1111111111111111'
        )
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            let content = args[0];
            let id = await bu.generateOutputPage({
                content
            }, context.channel);
            return `${config.website.secure ? 'https' : 'http'}://${config.website.host}/output/${id}`;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
