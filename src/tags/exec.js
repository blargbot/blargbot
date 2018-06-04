/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:16
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-04 10:20:08
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    bbEngine = require('../structures/BBTagEngine');

module.exports =
    Builder.AutoTag('exec')
        .withArgs(a => [a.require('tag'), a.optional('args')])
        .withDesc('Executes another `tag`, giving it `args` as the input. Useful for modules.')
        .withExample(
        'Let me do a tag for you. {exec;f}',
        'Let me do a tag for you. User#1111 has paid their respects. Total respects given: 5'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            let tag = await r.table('tag').get(args[0]).run();
            if (tag == null)
                return Builder.util.error(subtag, context, 'Tag not found: ' + args[0]);

            let name = args[0];
            let cd = context._cooldowns[context.msg.guild.id][fakse][context.msg.author.id];
            if (cd) {
                let cdDate = cd[name] + (tag.cooldown || 500);
                let diff = Date.now() - cdDate;
                if (diff < 0) {
                    let f = Math.floor(diff / 100) / 10;
                    return Builder.util.error(subtag, context, 'Cooldown: ' + diff);
                }
            }
            cd[name] = Date.now();

            return await this.execTag(subtag, context, tag.content, args[1] || '');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .withProp('execTag', async function (subtag, context, tagContent, input) {
            if (context.state.stackSize >= 200) {
                context.state.return = -1;
                return Builder.util.error(subtag, context, 'Terminated recursive tag after ' + context.state.stackSize + ' execs.');
            }

            let childContext = context.makeChild({ input });

            context.state.stackSize += 1;
            let result = await bbEngine.execString(tagContent || '', childContext);
            context.state.stackSize -= 1;

            context.errors.push({
                tag: subtag,
                error: childContext.errors
            });
            if (context.state.return > 0) context.state.return--;

            return result;
        }).build();