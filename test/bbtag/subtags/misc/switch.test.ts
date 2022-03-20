import { SwitchSubtag } from '@blargbot/bbtag/subtags/misc/switch';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SwitchSubtag(),
    argCountBounds: { min: 3, max: Infinity },
    cases: [
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
