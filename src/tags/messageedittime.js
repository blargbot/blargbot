/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:03
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('messageedittime')
        .withArgs(a => [a.optional([a.optional('channel'), a.require('messageid')]), a.optional('format')])
        .withDesc('Returns the edit time of the given message in the given channel using the given format.' +
            '\n`channel` defaults to the current channel' +
            '\n`messageid` defaults to the executing message id' +
            '\n`format` defaults to `x`')
        .withExample(
            'That was edited at "{messageedittime;DD/MM/YYYY HH:mm:ss}"',
            'That was sent at "10/06/2018 10:07:44"'
        )
        .whenArgs("0-3", async function (subtag, context, args) {
            let channel = context.channel,
                message = context.msg,
                format = "x";

            switch (args.length) {
                case 1:
                    if (/^\d{17,23}$/.test(args[0]))
                        message = await bu.getMessage(channel.id, args[0]);
                    else
                        format = args[0];
                    break;
                case 2:
                    channel = Builder.util.parseChannel(context, args[0]);
                    let i = 1;
                    if (typeof channel == "function") {
                        channel = context.channel;
                        format = args[(i = 0) + 1];
                    }
                    message = await bu.getMessage(channel.id, args[i]);
                    break;
                case 3:
                    channel = Builder.util.parseChannel(context, args[0]);
                    if (typeof channel == "function")
                        return channel(subtag, context);
                    message = await bu.getMessage(channel.id, args[1]);
                    format = args[2];
                    break;
            }
            if (message == null)
                return Builder.errors.noMessageFound(subtag, context);
            return dep.moment(message.editedTimestamp).format(format);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();