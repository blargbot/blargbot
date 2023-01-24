import { Subtag } from '@blargbot/bbtag';
import { UserStatusSubtag } from '@blargbot/bbtag/subtags/user/userStatus.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserStatusSubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['userstatus', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'dnd',
                    postSetup(member) {
                        member.update({
                            status: 'dnd'
                        });
                    }
                },
                {
                    expected: 'idle',
                    postSetup(member) {
                        member.update({
                            status: 'idle'
                        });
                    }
                },
                {
                    expected: 'offline',
                    postSetup(member) {
                        member.update({
                            status: 'offline'
                        });
                    }
                },
                {
                    expected: 'online',
                    postSetup(member) {
                        member.update({
                            status: 'online'
                        });
                    }
                }
            ]
        })
    ]
});
