import type { GetPrefixThunk } from '@blargbot/bbtag/subtags';
import { PrefixSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const getPrefix = new Mock<GetPrefixThunk>({ id: 'getPrefix', callable: true });

await runSubtagTests({
    subtag: new PrefixSubtag({
        defaultPrefix: 'b!',
        getPrefix: getPrefix.instance
    }),
    argCountBounds: { min: 0, max: 0 },
    names: ['prefix'],
    setup(ctx) {
        ctx.adoptMock(getPrefix);
    },
    cases: [
        {
            code: '{prefix}',
            expected: 'b!',
            setup(ctx) {
                getPrefix.setup(m => m(ctx.guild.id)).resolves(undefined);
            }
        },
        {
            code: '{prefix}',
            expected: 'abc',
            setup(ctx) {
                getPrefix.setup(m => m(ctx.guild.id)).resolves('abc');
            }
        },
        {
            code: '{prefix}',
            expected: 'def',
            setup(ctx) {
                getPrefix.setup(m => m(ctx.guild.id)).resolves(['def', 'ghi']);
            }
        },
        {
            code: '{prefix}',
            expected: 'ghi',
            setup(ctx) {
                ctx.input.prefix = 'ghi';
            }
        }
    ]
});
