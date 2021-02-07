/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:04
 * @Last Modified by: RagingLink
 * @Last Modified time: 2020-06-28 20:18:43
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('webhook')
        .withArgs(a => [
            a.require('id'),
            a.require('token'),
            a.optional('content'),
            a.optional('embed'),
            a.optional('username'),
            a.optional('avatarURL'),
            a.optional('file'),
            a.optional('filename')
        ])
        .withDesc('Executes a webhook. The `embed` must be provided in a raw JSON format, properly escaped for BBTag. ' +
        'A simple escaping utility can be accessed [here](https://rewrite.blargbot.xyz/v1escaper). ' +
        'You can find an easy tool to test out embeds [here](https://leovoel.github.io/embed-visualizer/). ' +
        'Please assign your webhook credentials to private variables! Do not leave them in your code. ' +
        'If `file` starts with `buffer:`, the following text will be parsed as base64 to a raw buffer.')
        .withExample(
        '{webhook;1111111111111111;t.OK-en;Hello!}',
        'In the webhook channel: Hello!'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-8', async function (subtag, context, args) {
            let id = args[0],
                token = args[1],
                content = args[2],
                embed = bu.parseEmbed(args[3]),
                username = args[4] || undefined,
                avatar = args[5] || undefined;

            let file = args[6], filename = args[7];
            if (file && !filename) filename = 'file.txt';
            if (file) {
                if (!filename) filename = 'file.txt';
                file = { file, name: filename };

                if (file.file.startsWith('buffer:')) {
                    file.file = Buffer.from(file.file.substring(7), 'base64');
                }
            }

            try {
                await bot.executeWebhook(id, token, {
                    username: username,
                    avatarURL: avatar,
                    content: content,
                    embeds: embed ? (Array.isArray(embed) ? embed : [embed]) : [],
                    file
                });
            }
            catch (err) {
                return Builder.util.error(subtag, context, 'Error executing webhook: ' + err.message);
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();