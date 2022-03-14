import { UserNickSubtag } from '@blargbot/cluster/subtags/user/usernick';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserNickSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['usernick', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'cooldood69',
                    setup(member) {
                        member.nick = 'cooldood69';
                    }
                },
                {
                    expected: 'aaaaaaaa',
                    setup(member) {
                        member.nick = 'aaaaaaaa';
                    }
                },
                {
                    queryString: '123456789098765432',
                    expected: 'nice',
                    setup(member) {
                        member.nick = null;
                        member.user.username = 'nice';
                        member.user.id = '123456789098765432';
                    }
                },
                {
                    queryString: '98765432234567890243',
                    expected: 'asdfgh',
                    setup(member) {
                        member.nick = undefined;
                        member.user.username = 'asdfgh';
                        member.user.id = '98765432234567890243';
                    }
                }
            ]
        })
    ]
});
