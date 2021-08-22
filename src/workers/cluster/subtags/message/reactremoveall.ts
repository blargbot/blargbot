import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ReactRemoveAllSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'reactremoveall',
            category: SubtagType.API,
            aliases: ['removereactall'],
            definition: [
                {
                    parameters: ['channelID?', 'messageID'], /*
                        TODO I hate this. Just because it's optional means there is no channel lookup at all. This should be more strongly defined as in it should allow leaving it empty, or omitting it, but if it's not empty attempt to lookup. This applies to other react subtags as well
                    */
                    description: 'Removes all reactions from `messageId`.\n`channelId` defaults to the current channel.',
                    exampleCode: '{reactremoveall;12345678901234;:thinking:}',
                    exampleOut: '(removed all the reactions)',
                    execute: async (context, [{value: channelStr}, {value: messageID}], subtag): Promise<string | void> => {
                        let message;
                        let channel;

                        channel = await context.queryChannel(channelStr, {noLookup:true});
                        if (channel === undefined)
                            channel = context.channel;

                        try {
                            message = await context.util.getMessage(channel, messageID);
                        } catch (e: unknown) {
                            // NOOP
                        }

                        if (message === undefined)
                            return this.noMessageFound(context, subtag);

                        if (!(await context.isStaff || context.ownsMessage(message.id)))
                            return this.customError('Author must be staff to modify unrelated messages', context, subtag);

                        await message.reactions.removeAll();
                        //TODO meaningful output please
                    }
                }
            ]
        });
    }
}
