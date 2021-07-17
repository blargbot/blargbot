import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { Constants } from 'eris';

const channelTypes: { [key in Constants['ChannelTypes']['string']]: string } = {
    [Constants.ChannelTypes.GUILD_TEXT]: 'text',
    [Constants.ChannelTypes.DM]: 'dm',
    [Constants.ChannelTypes.GUILD_VOICE]: 'voice',
    [Constants.ChannelTypes.GROUP_DM]: 'group-dm',
    [Constants.ChannelTypes.GUILD_CATEGORY]: 'category',
    [Constants.ChannelTypes.GUILD_NEWS]: 'news',
    [Constants.ChannelTypes.GUILD_STORE]: 'store'
};

export class ChannelTypeSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channeltype',
            category: SubtagType.API,
            desc: 'Possible results: ' + Object.values(channelTypes).map(t => '`' + t + '`').join(', '),
            definition: [
                {
                    parameters: [],
                    description: 'Returns the type the current channel.',
                    exampleCode: '{channeltype}',
                    exampleOut: 'text',
                    execute: (ctx) => channelTypes[ctx.channel.type]
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the type the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channeltype;cool channel}\n{channeltype;some channel that doesn\'t exist;true}',
                    exampleOut: 'voice\n(nothing is returned here)',
                    execute: (ctx, [channel, quiet], subtag) => this.getChannelId(ctx, channel.value, quiet.value, subtag)

                }
            ]
        });
    }

    public async getChannelId(
        context: BBTagContext,
        channelStr: string,
        quietStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr.length > 0;
        const channel = await context.getChannel(channelStr, { quiet, suppress: context.scope.suppressLookup });
        if (channel === undefined)
            return quiet ? '' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        return channelTypes[channel.type];
    }
}
