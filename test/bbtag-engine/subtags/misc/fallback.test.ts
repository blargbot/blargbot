import { replacers, UnknownSubtagError } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.fallbackReplacer,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{fallback}{xyz}',
            expected: '`Unknown subtag xyz`',
            errors: [
                { start: 10, end: 15, error: new UnknownSubtagError('xyz') }
            ],
            setup(ctx) {
                ctx.locals.setupProperty('fallback', undefined);
                ctx.locals.setupSet(m => m.fallback = undefined).mustHappen(1);
            }
        },
        {
            code: '{fallback;abc}{xyz}',
            expected: 'abc',
            errors: [
                { start: 14, end: 19, error: new UnknownSubtagError('xyz') }
            ],
            setup(ctx) {
                ctx.locals.setupProperty('fallback', undefined);
                ctx.locals.setupSet(m => m.fallback = 'abc').mustHappen(1);
            }
        },
        {
            code: '{fallback;This tag failed} {abc} {fallback} {xyz}',
            expected: ' This tag failed  `Unknown subtag xyz`',
            errors: [
                { start: 27, end: 32, error: new UnknownSubtagError('abc') },
                { start: 44, end: 49, error: new UnknownSubtagError('xyz') }
            ],
            setup(ctx) {
                ctx.locals.setupProperty('fallback', undefined);
                ctx.locals.setupSet(m => m.fallback = 'This tag failed').mustHappen(1);
                ctx.locals.setupSet(m => m.fallback = undefined).mustHappen(1);
            }
        }
    ]
});
