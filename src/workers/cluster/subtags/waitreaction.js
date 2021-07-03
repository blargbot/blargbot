/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:21:36
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:18:07
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    bbengine = require('../structures/bbtag/Engine'),
    waitMessage = require('./waitmessage');

function padEmoji(emoji) {
    if (emoji.includes(':'))
        return `<${emoji}>`;
    return emoji;
}

module.exports =
    Builder.BotTag('waitreaction')
        .withAlias('waitreact')
        .withArgs(a => [
            a.required('messages'),
            a.optional('users'),
            a.optional('reactions'),
            a.optional('condition'),
            a.optional('timeout')])
        .withDesc('Pauses the command until one of the given users adds any given reaction on any of the given messages. ' +
            'When a reaction is added, `condition` will be run to determine if the reaction can be accepted. ' +
            'If no reaction has been accepted within `timeout` then the subtag returns `Wait timed out`, otherwise it returns an array containing ' +
            'the channel Id, the message Id, the user id and the reaction, in that order. ' +
            '\n\n`users` defaults to the current user.' +
            '\n`reactions` defaults to any reaction.' +
            '\n`condition` must return `true` or `false` and defaults to `true`' +
            '\n`timeout` is a number of seconds. This defaults to 60 and is limited to 300' +
            '\n\n While inside the `condition` parameter, none of the following subtags may be used: `' + waitMessage.overrideSubtags.join(', ') + '`' +
            '\nAlso, the current message becomes the message the reaction was added to, and the user becomes the person who sent the message. ' +
            'This means that `{channelid}`, `{messageid}`, `{userid}` and all related subtags will change their values.' +
            '\nFinally, while inside the `condition` parameter, you can use the temporary subtag `{reaction}` to get the current reaction ' +
            'and the `{reactuser}` temporary subtag to get the user who reacted.')
        .withExample(
            '{waitreaction;{messageid};{userid};;{if;{reaction};startswith;<;false;true};300}',
            '(Reaction is added)',
            '["111111111111111","2222222222222","3333333333333","🤔"]'
        )
        .resolveArgs(0, 1, 2, 4)
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenArgs('1-5', async function (subtag, context, args) {
            let messages, users, reactions, checkBBTag, timeout, failure;

            // get messages
            messages = Builder.util.flattenArgArrays([args[0]]);

            // parse users
            if (args[1]) {
                users = Builder.util.flattenArgArrays([args[1]]);
                users = await Promise.all(users.map(async input => await context.getUser(input, { quiet: true, suppress: true })));
                if (users.find(user => user == null))
                    return Builder.errors.noUserFound(subtag, context);
                users = users.map(user => user.id);
            } else {
                users = [context.user.id];
            }

            // parse reactions
            if (args[2]) {
                reactions = Builder.util.flattenArgArrays([args[2]]);
                reactions = [...new Set(reactions.map(bu.findEmoji).reduce((p, c) => (p.push(...c), p), []))];
                if (reactions.length == 0)
                    return Builder.util.error(subtag, context, 'Invalid Emojis');
            } else {
                reactions = undefined;
            }

            // parse check code
            if (args[3]) {
                checkBBTag = args[3];
            } else {
                checkBBTag = bbengine.parse('true').bbtag;
            }

            // parse timeout
            if (args[4]) {
                timeout = bu.parseFloat(args[4]);
                if (isNaN(timeout))
                    return Builder.errors.notANumber(subtag, context);
                if (timeout < 0)
                    timeout = 0;
                if (timeout > 300)
                    timeout = 300;
            } else {
                timeout = 60;
            }

            let reactionSubtag = context.override('reaction', undefined);
            let checkFunc = waitMessage.createCheck(subtag, context, checkBBTag, (msg, user, emoji) => {
                context.override('reaction', () => padEmoji(emoji));
                context.override('reactuser', () => user.id);
                return context.makeChild({ msg });
            });

            try {
                let result = await bu.awaitReact(messages, users, reactions, checkFunc, timeout * 1000);
                return JSON.stringify([result.channel.id, result.message.id, result.user.id, padEmoji(result.emoji)]);
            } catch (err) {
                if (typeof err == 'function') {
                    return err(subtag, context);
                }
                if (err instanceof bu.TimeoutError) {
                    return Builder.util.error(subtag, context, `Wait timed out after ${err.timeout}`);
                }
                throw err;
            } finally {
                reactionSubtag.revert();
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();