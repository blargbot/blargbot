/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:04
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-08-30 11:17:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('dump')
        .withArgs(a => [
            a.require('text')
        ])
        .withDesc('Dumps the provided text to a blargbot output page.')
        .withExample(
        '{dump;Hello, world!}',
        'https://blargbot.xyz/output/1111111111111111'
        )
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            let content = args[0],
                embed = bu.parseEmbed(args[1]);
            // if (embed) embed = [embed];

            let id = await bu.generateOutputPage({
                content
            }, context.channel);
            return (config.general.isbeta ? 'http://localhost:8085/output/' : 'https://blargbot.xyz/output/') + id;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();