import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { ApplySubtag } from '@blargbot/bbtag/subtags/bot/apply';

import { EchoArgsSubtag, MarkerError, runSubtagTests, TestDataSubtag } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ApplySubtag(),
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
                { start: 0, end: 21, error: new BBTagRuntimeError('No subtag found') }
            ]
        }
    ]
});
