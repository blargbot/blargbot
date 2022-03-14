import { RoleMentionSubtag } from '@cluster/subtags/role/rolemention';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetRolePropTestCases } from './_getRolePropTest';

runSubtagTests({
    subtag: new RoleMentionSubtag(),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['rolemention', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '<@&89176598273912362713>',
                    setup(role) {
                        role.id = '89176598273912362713';
                    },
                    assert(_, __, ctx) {
                        expect(ctx.data.allowedMentions.roles).to.include('89176598273912362713');
                    }
                }
            ]
        })
    ]
});
