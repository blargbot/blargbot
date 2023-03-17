import { ReplaceSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: ReplaceSubtag,
    argCountBounds: { min: 2, max: 3 },
    cases: [
        {
            code: '{replace;abc;123}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.runtime.outputOptions.replace).to.deep.equal({ regex: 'abc', with: '123' });
            }
        },
        { code: '{replace;This is a test;is;aaaa}', expected: 'Thaaaa is a test' }
    ]
});
