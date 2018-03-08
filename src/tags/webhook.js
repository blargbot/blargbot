/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:04
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-02-07 00:12:58
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('webhook')
        .withArgs(a => [
            a.require('id'),
            a.require('token'),
            a.optional('content'),
            a.optional('embed'),
            a.optional('username'),
            a.optional('avatarURL')
        ])
        .withDesc('Executes a webhook. The `embed` must be provided in a raw JSON format, properly escaped for BBTag. ' +
            'A simple escaping utility can be accessed [here](https://rewrite.blargbot.xyz/v1escaper). ' +
            'You can find an easy tool to test out embeds [here](https://leovoel.github.io/embed-visualizer/). ' +
            'Please assign your webhook credentials to private variables! Do not leave them in your code.')
        .withExample(
            '{webhook;1111111111111111;t.OK-en;Hello!}',
            'In the webhook channel: Hello!'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-7', async function (params) {
            let id = params.args[1],
                token = params.args[2],
                content = params.args[3],
                embed = bu.parseEmbed(params.args[4]),
                username = params.args[5],
                avatar = params.args[6];

            try {
                await bot.executeWebhook(id, token, {
                    username: username,
                    avatarURL: avatar,
                    content: content,
                    embeds: embed ? (Array.isArray(embed) ? embed : [embed]) : []
                });
            }
            catch (err) {
                return await Builder.util.error('Error executing webhook: ' + err.message);
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();