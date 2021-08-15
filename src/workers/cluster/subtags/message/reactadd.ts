// import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
// import { SubtagCall } from '@cluster/types';
// import { SubtagType } from '@cluster/utils';
// import { Message } from 'discord.js';

// export class ReactAddSubtag extends BaseSubtag {
//     public constructor() {
//         super({
//             name: 'reactadd',
//             category: SubtagType.API,
//             aliases: ['addreact'],
//             desc: 'Please note that to be able to add a reaction, I must be on the server that you got that reaction from. ' +
//                 'If I am not, then I will return an error if you are trying to apply the reaction to another message.',
//             definition: [//! Overwritten
//                 {
//                     parameters: ['reaction'],
//                     execute: (ctx, args, subtag) => this.addReactions(ctx, args.map(arg => arg.value), subtag)
//                 },
//                 {
//                     parameters: ['messageid', 'reaction'],
//                     execute: (ctx, args, subtag) => this.addReactions(ctx, args.map(arg => arg.value), subtag)
//                 },
//                 {
//                     parameters: ['channel', 'messageid', 'reactions+'],
//                     execute: (ctx, args, subtag) => this.addReactions(ctx, args.map(arg => arg.value), subtag)
//                 }
//             ]
//         });
//     }

//     public async addReactions(
//         context: BBTagContext,
//         args: string[],
//         subtag: SubtagCall
//     ) {
//         let message: Message | undefined;

//         // Check if the first "emote" is actually a valid channel
//         let channel = await context.getChannel(args[0], {quiet: true, suppress: true});
//         if (channel === undefined)
//             channel = context.channel;
//         else
//             args.shift();
//         if (channel === undefined)
//             return this.channelNotFound(context, subtag);
//         // Check that the current first "emote" is a message id
//         if (/^\d{17,23}$/.test(args[0])) {
//             try {
//                 message = await context.util.getMessage(channel.id, args[0]);
//             } catch (e: unknown) {
//                 // NOOP
//             }
//             if (message === undefined)
//                 return this.noMessageFound(context, subtag);
//             args.shift();
//         }

//         // Find all actual emotes in remaining emotes
//         const parsed = bu.findEmoji(emotes.join('|'), true);

//         if (parsed.length == 0 && emotes.length > 0)
//             return Builder.util.error(subtag, context, 'Invalid Emojis');

//         const messageid = message != null ? message.id : await context.state.outputMessage;

//         if (messageid != null) {
//             // Perform add of each reaction
//             const errors = await bu.addReactions(channel.id, messageid, parsed);
//             if (errors[50013])
//                 return Builder.util.error(subtag, context, 'I dont have permission to Add Reactions');
//             if (errors[10014])
//                 return Builder.util.error(subtag, context, `I cannot add '${errors[10014].reactions}' as reactions`);
//         } else {
//             // Defer reactions to output message
//             context.state.reactions.push(...parsed);
//         }
//     }
// }
// module.exports =
//     Builder.APITag('reactadd')
//         .withAlias('addreact')
//         .withArgs(a => [
//             a.optional([
//                 a.optional('channelId'),
//                 a.required('messageId')
//             ]),
//             a.required('reactions', true)
//         ])
//         .withDesc('Adds `reactions` to the given `messageId`. If the `messageId` is not supplied, ' +
//             'it instead adds the `reactions` to the output from the containing tag.\n' +
//             'Please note that to be able to add a reaction, I must be on the server that you got that reaction from. ' +
//             'If I am not, then I will return an error if you are trying to apply the reaction to another message.')
//         .withExample(
//             '{reactadd;:thinking:;:joy:}',
//             '(On message) 🤔(1) 😂(1)'
//         )
//         .whenArgs(0, Builder.errors.notEnoughArguments)
//         .whenDefault(async function (subtag, context, emotes) {
//             let channel = null;
//             let message = null;

//             // Check if the first "emote" is actually a valid channel
//             channel = bu.parseChannel(emotes[0], true);
//             if (channel == null)
//                 channel = context.channel;
//             else
//                 emotes.shift();

//             if (!channel.guild || !context.guild || channel.guild.id != context.guild.id)
//                 return Builder.errors.channelNotInGuild(subtag, context);

//             // Check that the current first "emote" is a message id
//             if (/^\d{17,23}$/.test(emotes[0])) {
//                 try {
//                     message = await bot.getMessage(channel.id, emotes[0]);
//                 } catch (e) {
//                     // NOOP
//                 }
//                 if (message == null)
//                     return Builder.errors.noMessageFound(subtag, context);
//                 emotes.shift();
//             }

//             // Find all actual emotes in remaining emotes
//             const parsed = bu.findEmoji(emotes.join('|'), true);

//             if (parsed.length == 0 && emotes.length > 0)
//                 return Builder.util.error(subtag, context, 'Invalid Emojis');

//             const messageid = message ? message.id : await context.state.outputMessage;

//             if (messageid != null) {
//                 // Perform add of each reaction
//                 const errors = await bu.addReactions(channel.id, messageid, parsed);
//                 if (errors[50013])
//                     return Builder.util.error(subtag, context, 'I dont have permission to Add Reactions');
//                 if (errors[10014])
//                     return Builder.util.error(subtag, context, `I cannot add '${errors[10014].reactions}' as reactions`);
//             } else {
//                 // Defer reactions to output message
//                 context.state.reactions.push(...parsed);
//             }
//         })
//         .build();
