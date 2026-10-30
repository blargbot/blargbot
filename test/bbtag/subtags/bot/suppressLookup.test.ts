import { NotABooleanError } from '@blargbot/bbtag-engine';
import { SuppressLookupSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new SuppressLookupSubtag(),
    argCountBounds: { min: 0, max: 1 },
    names: ['suppressLookup'],
    cases: [
        {
            code: '{suppresslookup}',
            expected: '',
            setup(ctx) {
                ctx.root.setupSet(m => m.noLookupErrors = true).returns(true).mustHappen(1);
            }
        },
        {
            code: '{suppresslookup;true}',
            expected: '',
            setup(ctx) {
                ctx.root.setupSet(m => m.noLookupErrors = true).returns(true).mustHappen(1);
            }
        },
        {
            code: '{suppresslookup;false}',
            expected: '',
            setup(ctx) {
                ctx.root.setupSet(m => m.noLookupErrors = false).returns(true).mustHappen(1);
            }
        },
        {
            code: '{suppresslookup;abc}',
            expected: '`Not a boolean`',
            errors: [
                { error: new NotABooleanError('abc') }
            ]
        }
    ]
});
