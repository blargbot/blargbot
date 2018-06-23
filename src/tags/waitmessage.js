/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:21:36
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:18:07
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    bbengine = require('../structures/bbtag/Engine');

const overrideSubtags = [
    // API subtags
    'dm',
    'send',
    'edit',
    'delete',
    'kick',
    'ban',
    'reactadd',
    'reactremove',
    'roleadd',
    'rolecreate',
    'roledelete',
    'roleremove',
    'rolesetmentionable',
    'webhook',

    // Moderation subtags
    'warn',
    'modlog',
    'pardon',

    // Misc subtags
    'embed',
    'waitmessage',
    'waitreact'
];

module.exports =
    Builder.APITag('waitmessage')
        .withArgs(a => [
            a.optional('channels'),
            a.optional('users'),
            a.optional('condition'),
            a.optional('timeout')])
        .withDesc('Pauses the command until one of the given users sends a message in any of the given channels. ' +
            'When a message is sent, `condition` will be run to determine if the message can be accepted. ' +
            'If no message has been accepted within `timeout` then the subtag returns `Wait timed out`, otherwise it returns an array containing ' +
            'the channel Id, then the message Id. ' +
            '\n\n`channels` defaults to the current channel.' +
            '\n`users` defaults to the current user.' +
            '\n`condition` must return `true` or `false` and defaults to `true`' +
            '\n`timeout` is a number of seconds. This defaults to 60 and is limited to 300' +
            '\n\n While inside the `condition` parameter, none of the following subtags may be used: `' + overrideSubtags.join(', ') + '`' +
            '\nAlso, the current message becomes the users message that is to be checked. This means that ' +
            '`{channelid}`, `{messageid}`, `{userid}` and all related subtags will change their values.')
        .withExample(
            '{waitmessage;{channelid};{userid};{bool;{messagetext};startswith;Hi};300}',
            'Hi how you doing?',
            '["111111111111111","2222222222222"]'
        )
        .resolveArgs(0, 1, 3)
        .whenArgs('0-4', async function (subtag, context, args) {
            let channels, users, checkBBTag, timeout, failure;

            // parse channels
            if (args[0]) {
                channels = Builder.util.flattenArgArrays([args[0]]);
                channels = await Promise.all(channels.map(async input => await Builder.util.parseChannel(context, input)));
                if (failure = channels.find(channel => typeof channel == "function"))
                    return failure(subtag, context);
                channels = channels.map(channel => channel.id);
            }
            else {
                channels = [context.channel.id];
            }

            // parse users
            if (args[1]) {
                users = Builder.util.flattenArgArrays([args[1]]);
                users = await Promise.all(users.map(async input => await bu.getUser(context.msg, input, { quiet: true, suppress: true })));
                if (users.find(user => user == null))
                    return Builder.errors.noUserFound(subtag, context);
                users = users.map(user => user.id);
            } else {
                users = [context.user.id];
            }

            // parse check code
            if (args[2]) {
                checkBBTag = args[2];
            } else {
                checkBBTag = bbengine.parse("true").bbtag;
            }

            // parse timeout
            if (args[3]) {
                timeout = bu.parseFloat(args[3]);
                if (isNaN(timeout))
                    return Builder.errors.notANumber(subtag, context);
                if (timeout < 0)
                    timeout = 0;
                if (timeout > 300)
                    timeout = 300;
            } else {
                timeout = 60;
            }

            let checkFunc = this.createCheck(subtag, context, checkBBTag, msg => context.makeChild({ msg }));

            try {
                let result = await bu.awaitMessage(channels, users, checkFunc, timeout * 1000);
                return JSON.stringify([result.channel.id, result.id]);
            } catch (err) {
                if (typeof err == "function") {
                    return err(subtag, context);
                }
                if (err instanceof bu.TimeoutError) {
                    return Builder.util.error(subtag, context, `Wait timed out after ${err.timeout}`);
                }
                throw err;
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .withProp('overrideSubtags', overrideSubtags)
        .withProp('createCheck', function (subtag, context, checkBBtag, makeChild) {
            let overrideSubtags = this.overrideSubtags;
            return async function (...args) {
                let overrides = [];
                try {
                    for (const name of overrideSubtags) {
                        overrides.push(context.override(name, function (_subtag, _context) {
                            return Builder.util.error(_subtag, _context, `Subtag {${_subtag.name}} is disabled inside {${subtag.name}}`);
                        }));
                    }
                    let childContext = makeChild(...args);
                    let result = await this.executeArg(subtag, checkBBtag, childContext);
                    context.errors.push(...childContext.errors);
                    let bool = bu.parseBoolean(result.trim());
                    if (bool == null)
                        throw (subtag, context) => Builder.util.error(
                            subtag,
                            context,
                            `Condition must return 'true' or 'false'`
                        );
                    return bool;
                }
                finally {
                    for (const override of overrides) {
                        override.revert();
                    }
                }
            };
        })
        .build();