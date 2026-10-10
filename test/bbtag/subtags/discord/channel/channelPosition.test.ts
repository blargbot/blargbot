import type { ChannelTypeName, GuildChannelPositionLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, ChannelType, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    replacer: replacers.channelPositionReplacer,
    names: ['channelPosition', 'categoryPosition', 'channelPos', 'categoryPos'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases<GuildChannelPositionLocals>({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelpos', ...args].join(';')}}`;
            },
            cases: Object.entries({
                GUILD_TEXT: true,
                DM: true,
                GUILD_VOICE: true,
                GROUP_DM: true,
                GUILD_CATEGORY: true,
                GUILD_ANNOUNCEMENT: true,
                ANNOUNCEMENT_THREAD: false,
                PUBLIC_THREAD: false,
                PRIVATE_THREAD: false,
                GUILD_STAGE_VOICE: true,
                GUILD_DIRECTORY: true,
                GUILD_FORUM: true,
                GUILD_MEDIA: true
            } satisfies Record<ChannelTypeName, boolean>).map(([key, success]) => ({
                title: `Channel is a ${key} (${ChannelType[key]})`,
                expected: success ? '324' : '`Threads dont have a position`',
                error: success ? undefined : (c = '') => new BBTagRuntimeError('Threads dont have a position', `${c} is a thread and doesnt have a position`),
                setup(ctx, channelId) {
                    ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType[key]).mustHappen(1);
                    if (success)
                        ctx.discord.setup(m => m.getChannelPosition(channelId)).resolves(324).mustHappen(1);
                }
            }))
        })
    ]
});
