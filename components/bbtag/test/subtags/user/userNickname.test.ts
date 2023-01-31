import { Subtag } from '@blargbot/bbtag';
import { UserNicknameSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserNicknameSubtag),
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
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.nick = 'cooldood69';
                    }
                },
                {
                    expected: 'aaaaaaaa',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.nick = 'aaaaaaaa';
                    }
                },
                {
                    queryString: '123456789098765432',
                    expected: 'nice',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.nick = null;
                        member.username = 'nice';
                        member.id = '123456789098765432';
                    }
                },
                {
                    queryString: '98765432234567890243',
                    expected: 'asdfgh',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.nick = undefined;
                        member.username = 'asdfgh';
                        member.id = '98765432234567890243';
                    }
                }
            ]
        })
    ]
});
