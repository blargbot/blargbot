import type { GetWarnings } from '@blargbot/bbtag/subtags';
import { WarningsSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const getWarnings = new Mock<GetWarnings>({ id: 'getWarnings', callable: true });

await runSubtagTests({
    subtag: new WarningsSubtag({
        getWarnings: getWarnings.instance
    }),
    argCountBounds: { min: 0, max: 2 },
    names: ['warnings'],
    setup(ctx) {
        ctx.adoptMock(getWarnings);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: undefined,
            generateCode(...args) {
                return `{${['warnings', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '0',
                    setup(member, ctx) {
                        getWarnings.setup(m => m(ctx.guild.id, member.user.id)).resolves(undefined);
                    }
                },
                {
                    expected: '0',
                    setup(member, ctx) {
                        getWarnings.setup(m => m(ctx.guild.id, member.user.id)).resolves(0);
                    }
                },
                {
                    expected: '1234',
                    setup(member, ctx) {
                        getWarnings.setup(m => m(ctx.guild.id, member.user.id)).resolves(1234);
                    }
                }
            ]
        })
    ]
});
