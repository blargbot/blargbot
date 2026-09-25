import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.lockReplacer,
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    cases: [
        {
            code: '{lock;read;~test;Success!}',
            expected: 'Success!',
            setup(ctx) {
                const lockHandle = ctx.createMock<AsyncDisposable>();
                ctx.locals.setup(m => m.lock('read', '~test')).resolves(lockHandle.instance).mustHappen(1);
                lockHandle.setupAsyncDispose().resolves().mustHappen(1);
                ctx.locals.setup(m => m.inLock).returns(false).mustHappen(1);
                ctx.locals.setupSet(m => m.inLock = true).returns(true).mustHappen(1);
                ctx.locals.setupSet(m => m.inLock = false).returns(true).mustHappen(1);
            }
        },
        {
            code: '{lock;read;~test;{lock;read;~other;{fail}}}',
            expected: '`Lock cannot be nested`',
            errors: [
                { start: 17, end: 42, error: new BBTagRuntimeError('Lock cannot be nested') }
            ],
            setup(ctx) {
                ctx.locals.setupProperty('inLock', false);
                const lockHandle = ctx.createMock<AsyncDisposable>();
                ctx.locals.setup(m => m.lock('read', '~test')).resolves(lockHandle.instance).mustHappen(1);
                lockHandle.setupAsyncDispose().resolves().mustHappen(1);
                ctx.locals.setupSet(m => m.inLock = true).mustHappen(1);
                ctx.locals.setupSet(m => m.inLock = false).mustHappen(1);
            }
        },
        {
            code: '{lock;reading;~test;{fail}}',
            expected: '`Mode must be \'read\' or \'write\'`',
            errors: [
                { start: 0, end: 27, error: new BBTagRuntimeError('Mode must be \'read\' or \'write\'', 'reading') }
            ],
            setup(ctx) {
                ctx.locals.setup(m => m.inLock).returns(false).mustHappen(1);
            }
        },
        {
            code: '{lock;writing;~test;{fail}}',
            expected: '`Mode must be \'read\' or \'write\'`',
            errors: [
                { start: 0, end: 27, error: new BBTagRuntimeError('Mode must be \'read\' or \'write\'', 'writing') }
            ],
            setup(ctx) {
                ctx.locals.setup(m => m.inLock).returns(false).mustHappen(1);
            }
        },
        {
            code: '{lock;read;;{fail}}',
            expected: '`Key cannot be empty`',
            errors: [
                { start: 0, end: 19, error: new BBTagRuntimeError('Key cannot be empty') }
            ],
            setup(ctx) {
                ctx.locals.setup(m => m.inLock).returns(false).mustHappen(1);
            }
        }
    ]
});
