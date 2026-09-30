import type { DiscordUserNicknameLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userNicknameReplacer,
    names: ['userNickname', 'userNick', 'userNickname.global', 'userNick.global'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases<DiscordUserNicknameLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['usernick', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'cooldood69',
                    setup(ctx, userId) {
                        ctx.locals.setup((m, $) => m.getNickname($({ userId, globalOnly: false }))).resolves('cooldood69').mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<DiscordUserNicknameLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['userNickname', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'cooldood69',
                    setup(ctx, userId) {
                        ctx.locals.setup((m, $) => m.getNickname($({ userId, globalOnly: false }))).resolves('cooldood69').mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<DiscordUserNicknameLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['usernick.global', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'cooldood69',
                    setup(ctx, userId) {
                        ctx.locals.setup((m, $) => m.getNickname($({ userId, globalOnly: true }))).resolves('cooldood69').mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<DiscordUserNicknameLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['userNickname.global', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'cooldood69',
                    setup(ctx, userId) {
                        ctx.locals.setup((m, $) => m.getNickname($({ userId, globalOnly: true }))).resolves('cooldood69').mustHappen(1);
                    }
                }
            ]
        })
    ]
});
