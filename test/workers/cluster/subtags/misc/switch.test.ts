import { NotEnoughArgumentsError } from '@cluster/bbtag/errors';
import { SwitchSubtag } from '@cluster/subtags/misc/switch';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SwitchSubtag(),
    cases: [
        {
            code: '{switch}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 8, error: new NotEnoughArgumentsError(3, 0) }
            ]
        },
        {
            code: '{switch;{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) },
                { start: 0, end: 15, error: new NotEnoughArgumentsError(3, 1) }
            ]
        },
        {
            code: '{switch;{eval};{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) },
                { start: 15, end: 21, error: new MarkerError('eval', 15) },
                { start: 0, end: 22, error: new NotEnoughArgumentsError(3, 2) }
            ]
        },
        { code: '{switch;abc;abc;aaaa;def;{fail};ghi;{fail}}', expected: 'aaaa' },
        { code: '{switch;def;abc;{fail};def;bbbb;ghi;{fail}}', expected: 'bbbb' },
        { code: '{switch;ghi;abc;{fail};def;{fail};ghi;cccc}', expected: 'cccc' },
        { code: '{switch;jkl;abc;{fail};def;{fail};ghi;{fail}}', expected: '' },
        { code: '{switch;abc;abc;aaaa;def;{fail};ghi;{fail};{fail}}', expected: 'aaaa' },
        { code: '{switch;def;abc;{fail};def;bbbb;ghi;{fail};{fail}}', expected: 'bbbb' },
        { code: '{switch;ghi;abc;{fail};def;{fail};ghi;cccc;{fail}}', expected: 'cccc' },
        { code: '{switch;jkl;abc;{fail};def;{fail};ghi;{fail};xyz}', expected: 'xyz' },
        { code: '{switch;1;0;{fail};[1,2,3];Success!;1;{fail};2;{fail};{fail}}', expected: 'Success!' }
    ]
});
