import { BBTagRuntimeError } from '@bbtag/blargbot';
import { ApplySubtag } from '@bbtag/blargbot/subtags';

import { EchoArgsSubtag, makeTestDataSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: ApplySubtag,
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{apply;eval}',
            expected: '',
            errors: [
                { start: 0, end: 12, error: new MarkerError('eval', 0) }
            ]
        },
        {
            code: '{apply;testdata;1234}',
            subtags: [makeTestDataSubtag({ 1234: 'My cool test data' })],
            expected: 'My cool test data'
        },
        {
            code: '{apply;testdata;[1234]}',
            subtags: [makeTestDataSubtag({ 1234: 'My cool test data' })],
            expected: 'My cool test data'
        },
        {
            code: '{apply;testdata;["1234"]}',
            subtags: [makeTestDataSubtag({ 1234: 'My cool test data' })],
            expected: 'My cool test data'
        },
        {
            code: '{apply;echoargs;["1234","567",null];abc;def;[];["ghi",123]}',
            subtags: [EchoArgsSubtag],
            expected: '["echoargs","1234","567","","abc","def","ghi","123"]'
        },
        {
            code: '{apply;unknownsubtag}',
            expected: '`No subtag found`',
            errors: [
                { start: 0, end: 21, error: new BBTagRuntimeError('No subtag found') }
            ]
        }
    ]
});
