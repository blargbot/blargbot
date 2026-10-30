import { BBTagRuntimeError } from '@blargbot/bbtag-engine';
import { ApplySubtag } from '@blargbot/bbtag-engine/subtags';

import { EchoArgsSubtag, MarkerError, runSubtagTests, TestDataSubtag } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ApplySubtag(),
    argCountBounds: { min: 1, max: Infinity },
    names: ['apply'],
    cases: [
        {
            code: '{apply;eval}',
            expected: '',
            errors: [
                { error: new MarkerError('eval', 0) }
            ]
        },
        {
            code: '{apply;testdata;1234}',
            subtags: [new TestDataSubtag({ 1234: 'My cool test data' })],
            expected: 'My cool test data'
        },
        {
            code: '{apply;testdata;[1234]}',
            subtags: [new TestDataSubtag({ 1234: 'My cool test data' })],
            expected: 'My cool test data'
        },
        {
            code: '{apply;testdata;["1234"]}',
            subtags: [new TestDataSubtag({ 1234: 'My cool test data' })],
            expected: 'My cool test data'
        },
        {
            code: '{apply;echoargs;["1234","567",null];abc;def;[];["ghi",123]}',
            subtags: [new EchoArgsSubtag()],
            expected: '["echoargs","1234","567","","abc","def","ghi","123"]'
        },
        {
            code: '{apply;unknownsubtag}',
            expected: '`No subtag found`',
            errors: [
                { error: new BBTagRuntimeError('No subtag found') }
            ]
        }
    ]
});
