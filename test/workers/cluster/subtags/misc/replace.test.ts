import { ReplaceSubtag } from '@cluster/subtags/misc/replace';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ReplaceSubtag(),
    argCountBounds: { min: 2, max: 3 },
    cases: [
        {
            code: '{replace;abc;123}',
            expected: '',
            assert(ctx) {
                expect(ctx.state.replace).to.deep.equal({ regex: 'abc', with: '123' });
            }
        },
        { code: '{replace;This is a test;is;aaaa}', expected: 'Thaaaa is a test' }
    ]
});
