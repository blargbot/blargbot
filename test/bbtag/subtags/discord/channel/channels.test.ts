import type { GuildChannelListLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    replacer: replacers.channelsReplacer,
    names: ['channels'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases<GuildChannelListLocals>({
            quiet: '',
            includeNoArgs: false,
            generateCode(...args) {
                return `{${['channels', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '["2398462398472","23098475928447"]',
                    setup(ctx, channelId) {
                        ctx.discord.setup(m => m.listChannels(channelId)).resolves([2398462398472n, 23098475928447n]).mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{channels}',
            expected: '["23489762384769837","342789565384956435"]',
            setup(ctx) {
                ctx.discord.setup(m => m.listChannels()).resolves([23489762384769837n, 342789565384956435n]).mustHappen(1);
            }
        }
    ]
});
