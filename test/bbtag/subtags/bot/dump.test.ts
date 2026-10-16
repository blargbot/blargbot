import type { DumpThunk } from '@blargbot/bbtag/subtags';
import { DumpSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const generateDumpLink = new Mock<DumpThunk>({ id: 'generateDumpLink', callable: true });

await runSubtagTests({
    subtag: new DumpSubtag({
        generateDumpLink: generateDumpLink.instance
    }),
    argCountBounds: { min: 1, max: 1 },
    names: ['dump'],
    setup(ctx) {
        ctx.adoptMock(generateDumpLink);
    },
    cases: [
        {
            code: '{dump;abc123}',
            expected: 'https://blargbot.xyz/dumps/1271927912712712',
            setup(ctx) {
                ctx.channels.command.id = '279137289731731231';
                ctx.message.channel_id = ctx.channels.command.id;
                generateDumpLink.setup((m, $) => m($({ content: 'abc123', channelId: '279137289731731231' })))
                    .resolves(new URL('https://blargbot.xyz/dumps/1271927912712712'))
                    .mustHappen(1);
            }
        }
    ]
});
