import type { GuildMemberActivityLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userActivityReplacer,
    names: ['userActivity', 'userGame'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases<GuildMemberActivityLocals>({
            quiet: '',
            quietNoArgs: true,
            generateCode(...args) {
                return `{${['usergame', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'My test game',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 0,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'Some cool music',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 1,
                            name: 'Some cool music'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'nothing',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves(null).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<GuildMemberActivityLocals>({
            quiet: '',
            quietNoArgs: true,
            generateCode(...args) {
                return `{${['useractivity', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'My test game',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 0,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'Some cool music',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 1,
                            name: 'Some cool music'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'nothing',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves(null).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
