import { Subtag } from '@blargbot/bbtag';
import { IsUserBoostingSubtag } from '@blargbot/bbtag/subtags/user/isUserBoosting.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(IsUserBoostingSubtag),
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
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.premium_since = '2021-01-01T00:00:00+0000';
                    }
                },
                {
                    expected: 'false',
                    setup(user) {
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.premium_since = null;
                    }
                },
                {
                    expected: 'false',
                    setup(user) {
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.premium_since = undefined;
                    }
                }
            ]
        })
    ]
});
