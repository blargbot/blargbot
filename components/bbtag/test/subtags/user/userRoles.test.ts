import { Subtag } from '@blargbot/bbtag';
import { UserRolesSubtag } from '@blargbot/bbtag/subtags/user/userRoles.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserRolesSubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['userroles', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.roles = [];
                    }
                },
                {
                    expected: '["098765434512212678"]',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.roles = ['098765434512212678'];
                    }
                },
                {
                    expected: '["098765434512212678","1234567890987654"]',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.roles = ['098765434512212678', '1234567890987654'];
                    }
                }
            ]
        })
    ]
});
