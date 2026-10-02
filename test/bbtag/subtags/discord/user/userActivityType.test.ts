import type { GuildMemberActivityLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userActivityTypeReplacer,
    names: ['userActivityType', 'userGameType'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases<GuildMemberActivityLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['useractivitytype', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'playing',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 0,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'listening',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 2,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'competing',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 5,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'custom',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 4,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'streaming',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 1,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'watching',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 3,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: '',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves(null).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<GuildMemberActivityLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['usergametype', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'playing',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 0,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'listening',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 2,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'competing',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 5,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'custom',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 4,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'streaming',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 1,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: 'watching',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves({
                            type: 3,
                            name: 'My test game'
                        }).mustHappen(1);
                    }
                },
                {
                    expected: '',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getActivity(userId)).resolves(null).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
