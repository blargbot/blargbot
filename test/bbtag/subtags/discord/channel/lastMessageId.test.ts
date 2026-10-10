import type { ChannelTypeName, GuildChannelLastMessageIdLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, ChannelNotFoundError, ChannelType, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    replacer: replacers.lastMessageIdReplacer,
    names: ['lastMessageId'],
    argCountBounds: { min: 0, max: 1 },
    cases: [
        ...createGetChannelPropTestCases<GuildChannelLastMessageIdLocals>({
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['lastmessageid', ...args].join(';')}}`;
            },
            notFound: ChannelNotFoundError,
            cases: Object.entries({
                GUILD_TEXT: true,
                DM: true,
                GUILD_VOICE: true,
                GROUP_DM: true,
                GUILD_CATEGORY: false,
                GUILD_ANNOUNCEMENT: true,
                ANNOUNCEMENT_THREAD: true,
                PUBLIC_THREAD: true,
                PRIVATE_THREAD: true,
                GUILD_STAGE_VOICE: true,
                GUILD_DIRECTORY: false,
                GUILD_FORUM: false,
                GUILD_MEDIA: false
            } satisfies Record<ChannelTypeName, boolean>).map(([key, success]) => ({
                title: `Channel is a ${key} (${ChannelType[key]})`,
                expected: success ? '8943579385985739' : '`Channel must be a textable channel`',
                error: success ? undefined : new BBTagRuntimeError('Channel must be a textable channel'),
                setup(ctx, channelId) {
                    ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType[key]).mustHappen(1);
                    if (success)
                        ctx.discord.setup(m => m.getLastMessageId(channelId)).resolves(8943579385985739n).mustHappen(1);
                }
            }))
        })
    ]
});
