/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:16
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-05-11 18:50:57
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const { FlowState } = require('../structures/bbtag/FlowControl');
const Builder = require('../structures/TagBuilder'),
    bbEngine = require('../structures/bbtag/Engine');

module.exports =
    Builder.BotTag('exec')
        .withArgs(a => [a.require('tag'), a.optional('args')])
        .withDesc('Executes another `tag`, giving it `args` as the input. Useful for modules.')
        .withExample(
            'Let me do a tag for you. {exec;f}',
            'Let me do a tag for you. User#1111 has paid their respects. Total respects given: 5'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let tag = await context.getCached(`tag_${args[0]}`, () => r.table('tag').get(args[0]).run());

            if (tag == null)
                return Builder.util.error(subtag, context, 'Tag not found: ' + args[0]);


            let name = args[0];
            if (!context._cooldowns[context.msg.guild.id][false])
                context._cooldowns[context.msg.guild.id][false] = {};
            if (!context._cooldowns[context.msg.guild.id][false][context.msg.author.id])
                context._cooldowns[context.msg.guild.id][false][context.msg.author.id] = {};
            let cd = context._cooldowns[context.msg.guild.id][false][context.msg.author.id];
            if (cd) {
                let cdDate = cd[name] + (tag.cooldown || 0);
                let diff = Date.now() - cdDate;
                if (diff < 0) {
                    return Builder.util.error(subtag, context, 'Cooldown: ' + (diff * -1));
                }
            }
            cd[name] = Date.now();

            switch (args.length) {
                case 1:
                    return await this.execTag(subtag, context, tag.content, '');
                case 2:
                    return await this.execTag(subtag, context, tag.content, args[1], tag.flags);
                default:
                    let a = Builder.util.flattenArgArrays(args.slice(1));
                    return await this.execTag(subtag, context, tag.content, '"' + a.join('" "') + '"', tag.flags);
            }
        })
        .withProp('execTag', async function (subtag, /** @type {import('../structures/bbtag/Context')} */context, tagContent, input, flags) {
            let result;
            if (typeof tagContent == "string" || tagContent == null) {
                let parsed = bbEngine.parse(tagContent || '');
                if (!parsed.success)
                    return Builder.util.error(subtag, context, parsed.error);
                tagContent = parsed.bbtag;
            }

            let childContext = context.makeChild({ input, flags });
            childContext.state.tagResults.push(null);
            if (tagContent != null)
                result = await this.executeArg(subtag, tagContent, childContext);

            context.errors.push({
                tag: subtag,
                error: childContext.errors
            });

            switch (context.state.flowState) {
                case FlowState.KILL_TAG:
                case FlowState.CONTINUE_LOOP:
                case FlowState.BREAK_LOOP:
                    context.state.flowState = FlowState.NORMAL;
            }
            const tagRes = childContext.state.tagResults.pop();
            if (typeof tagRes === 'string')
                result = tagRes;

            return result;
        }).build();
