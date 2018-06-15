/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:16
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-04 11:39:28
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    bbEngine = require('../structures/bbtag/Engine');

module.exports =
    Builder.AutoTag('exec')
        .withArgs(a => [a.require('tag'), a.optional('args')])
        .withDesc('Executes another `tag`, giving it `args` as the input. Useful for modules.')
        .withExample(
            'Let me do a tag for you. {exec;f}',
            'Let me do a tag for you. User#1111 has paid their respects. Total respects given: 5'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenDefault(async function(subtag, context, args){
             let tag = await r.table('tag').get(args[0]).run();

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
                     return await this.execTag(subtag, context, tag.content, args[1]);
                 default:
                     let a = Builder.util.flattenArgArrays(args.slice(1));
                     return await this.execTag(subtag, context, tag.content, '"'+a.join('" "')+'"');
             }
         })
        .withProp('execTag', async function (subtag, context, tagContent, input) {
            if (context.state.stackSize >= 200) {
                context.state.return = -1;
                return Builder.util.error(subtag, context, 'Terminated recursive tag after ' + context.state.stackSize + ' execs.');
            }

            let childContext = context.makeChild({ input });

            context.state.stackSize += 1;
            let result;
            if (typeof tagContent == "string" || tagContent == null)
                result = await bbEngine.execString(tagContent || '', childContext);
            else
                result = await bbEngine.execute(tagContent, context);
            context.state.stackSize -= 1;

            context.errors.push({
                tag: subtag,
                error: childContext.errors
            });
            if (context.state.return > 0) context.state.return--;

            return result;
        }).build();
