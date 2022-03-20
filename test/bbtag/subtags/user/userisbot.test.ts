import { UserIsBotSubtag } from '@blargbot/bbtag/subtags/user/userisbot';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserIsBotSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['userisbot', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(member) {
                        member.user.bot = true;
                    }
                },
                {
                    expected: 'false',
                    setup(member) {
                        member.user.bot = false;
                    }
                },
                {
                    expected: 'false',
                    setup(member) {
                        member.user.bot = undefined;
                    }
                }
            ]
        })
    ]
});
