import type { GuildChannelCategoryLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, ChannelNotFoundError, replacers } from '@blargbot/bbtag-engine';

import { randomSnowflake } from '../../randomSnowflake.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    replacer: replacers.channelCategoryReplacer,
    names: ['channelCategory', 'category'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases<GuildChannelCategoryLocals>({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelcategory', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '8237642839674943',
                    setup(ctx, channelId) {
                        ctx.discord.setup(m => m.getChannelCategory(channelId)).resolves(8237642839674943n).mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{channelcategory}',
            expected: '',
            errors: [
                { error: new (BBTagRuntimeError.withDisplay(''))('Channel has no parent') }
            ],
            setup(ctx) {
                const channelId = randomSnowflake('channelId');
                ctx.discord.setup((m, $) => m.queryChannel('', $({ quiet: false, throw: ChannelNotFoundError }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.getChannelCategory(channelId)).resolves(null).mustHappen(1);
            }
        }
    ]
});
