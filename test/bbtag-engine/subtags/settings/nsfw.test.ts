import type { NsfwLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.nsfwReplacer,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{nsfw}',
            expected: '',
            setup(ctx) {
                const nsfw = ctx.createMock<NsfwLocals['nsfw']>();
                ctx.locals.setup(m => m.nsfw).returns(nsfw.instance);
                nsfw.setupSet(m => m.value = '❌ This contains NSFW content! Go to a NSFW channel. ❌').returns(true).mustHappen();
            }
        },
        {
            code: '{nsfw;}',
            expected: '',
            setup(ctx) {
                const nsfw = ctx.createMock<NsfwLocals['nsfw']>();
                ctx.locals.setup(m => m.nsfw).returns(nsfw.instance);
                nsfw.setupSet(m => m.value = '❌ This contains NSFW content! Go to a NSFW channel. ❌').returns(true).mustHappen();
            }
        },
        {
            code: '{nsfw;Buddy you need a bonk}',
            expected: '',
            setup(ctx) {
                const nsfw = ctx.createMock<NsfwLocals['nsfw']>();
                ctx.locals.setup(m => m.nsfw).returns(nsfw.instance);
                nsfw.setupSet(m => m.value = 'Buddy you need a bonk').returns(true).mustHappen();
            }
        }
    ]
});
