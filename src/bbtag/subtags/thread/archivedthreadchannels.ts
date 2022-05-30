import { guard, parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { ChannelNotFoundError, InvalidChannelError, NotABooleanError } from '../../errors';
import { SubtagType } from '../../utils';

export class ArchivedThreadChannelsSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'archivedthreadchannels',
            aliases: ['archivedthreads'],
            category: SubtagType.THREAD,
            description: '`channel` defaults to the current channel.\nReturns an array of thread channel IDs.\n\n'
                + '*It should be noted that the Discord API can not guarantee *all* (public/private) archived threads will be returned. Using this subtag twice could result in more threads being returned, for more read about the `has_more` response property [here](https://discord.com/developers/docs/resources/channel#list-public-archived-threads)',
            definition: [
                {
                    parameters: ['channel?'],
                    description: 'Lists all\\*  *public* archived threads in `channel`.\nReturns an array of thread channel IDs.',
                    exampleCode: '{archivedthreads;123456789123456}',
                    exampleOut: '["123456789012345", "98765432198765"]',
                    returns: 'id[]',
                    execute: (ctx, [channel]) => this.getArchivedThreads(ctx, channel.value)
                },
                {
                    parameters: ['channel', 'private:false'],
                    description: 'If private is `true`, all\\* *private* archived threads will be listed, otherwise all public archived threads will be returned.\n`private` must be a boolean.',
                    exampleCode: 'There are {length;{archivedthreads;123456789123456;true}} private archived threads here',
                    exampleOut: 'There are 5 private archived threads here',
                    returns: 'id[]',
                    execute: (ctx, [channel, privateThreads]) => this.getArchivedThreads(ctx, channel.value, privateThreads.value)
                }
            ]
        });
    }

    public async getArchivedThreads(
        context: BBTagContext,
        channelStr: string,
        privateStr = 'false'
    ): Promise<string[]> {
        const channel = await context.queryChannel(channelStr);
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        if (!guard.isThreadableChannel(channel))
            throw new InvalidChannelError(channel.type, channel.id);

        const fetchPrivate = parse.boolean(privateStr);

        if (fetchPrivate === undefined)
            throw new NotABooleanError(privateStr);
        const fetchedArchivedThreads = await (fetchPrivate ? channel.getArchivedThreads('private') : channel.getArchivedThreads('public'));
        return fetchedArchivedThreads.threads.map(t => t.id);
    }
}
