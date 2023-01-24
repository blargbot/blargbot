import { Subtag } from '@blargbot/bbtag';
import { ReplaceSubtag } from '@blargbot/bbtag/subtags/misc/replace.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ReplaceSubtag),
    argCountBounds: { min: 2, max: 3 },
    cases: [
        {
            code: '{replace;abc;123}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.data.replace).to.deep.equal({ regex: 'abc', with: '123' });
            }
        },
        { code: '{replace;This is a test;is;aaaa}', expected: 'Thaaaa is a test' }
    ]
});
