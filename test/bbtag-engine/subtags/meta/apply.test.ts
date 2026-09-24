import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { createTestDataReplacer, echoReplacer, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.applyReplacer,
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
            replacers: [createTestDataReplacer({ 1234: 'My cool test data' })],
            expected: 'My cool test data'
        },
        {
            code: '{apply;testdata;[1234]}',
            replacers: [createTestDataReplacer({ 1234: 'My cool test data' })],
            expected: 'My cool test data'
        },
        {
            code: '{apply;testdata;["1234"]}',
            replacers: [createTestDataReplacer({ 1234: 'My cool test data' })],
            expected: 'My cool test data'
        },
        {
            code: '{apply;echoargs;["1234","567",null];abc;def;[];["ghi",123]}',
            replacers: [echoReplacer],
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
