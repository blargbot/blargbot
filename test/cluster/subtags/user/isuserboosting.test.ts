import { IsUserBoostingSubtag } from '@blargbot/cluster/subtags/user/isuserboosting';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new IsUserBoostingSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['isuserboosting', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(user) {
                        user.premium_since = '2021-01-01T00:00:00+0000';
                    }
                },
                {
                    expected: 'false',
                    setup(user) {
                        user.premium_since = null;
                    }
                },
                {
                    expected: 'false',
                    setup(user) {
                        user.premium_since = undefined;
                    }
                }
            ]
        })
    ]
});
