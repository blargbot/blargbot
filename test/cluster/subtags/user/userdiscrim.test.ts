import { UserDiscrimSubtag } from '@cluster/subtags/user/userdiscrim';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserDiscrimSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['userdiscrim', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '1234',
                    setup(member) {
                        member.user.discriminator = '1234';
                    }
                },
                {
                    expected: '5678',
                    setup(member) {
                        member.user.discriminator = '5678';
                    }
                },
                {
                    expected: '0000',
                    setup(member) {
                        member.user.discriminator = '0000';
                    }
                }
            ]
        })
    ]
});
