import type { DiscordMentionsLocals, DiscordUserLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userMentionReplacer,
    names: ['userMention'],
    argCountBounds: { min: 0, max: 3 },
    cases: [
        ...createGetUserPropTestCases<DiscordMentionsLocals & DiscordUserLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['usermention', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '<a mention>',
                    setup(ctx, userId) {
                        this.expected = `<@${userId}>`;
                        const mentions = ctx.createMock<DiscordMentionsLocals['mentions']>();
                        const userMentions = ctx.createMock<Set<bigint>>();
                        ctx.locals.setup(m => m.mentions).returns(mentions.instance).mustHappen(1);
                        mentions.setup(m => m.users).returns(userMentions.instance).mustHappen(1);
                        userMentions.setup(m => m.add(userId)).returns(userMentions.instance).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<DiscordMentionsLocals & DiscordUserLocals>({
            quiet: '',
            generateCode(userStr = '', quietStr = '') {
                return `{usermention;${userStr};${quietStr};false}`;
            },
            cases: [
                {
                    expected: '<a mention>',
                    setup(ctx, userId) {
                        this.expected = `<@${userId}>`;
                        const mentions = ctx.createMock<DiscordMentionsLocals['mentions']>();
                        const userMentions = ctx.createMock<Set<bigint>>();
                        ctx.locals.setup(m => m.mentions).returns(mentions.instance).mustHappen(1);
                        mentions.setup(m => m.users).returns(userMentions.instance).mustHappen(1);
                        userMentions.setup(m => m.add(userId)).returns(userMentions.instance).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<DiscordMentionsLocals & DiscordUserLocals>({
            quiet: '',
            generateCode(userStr = '', quietStr = '') {
                return `{usermention;${userStr};${quietStr};true}`;
            },
            cases: [
                {
                    expected: '<a mention>',
                    setup(_, userId) {
                        this.expected = `<@${userId}>`;
                    }
                }
            ]
        })
    ]
});
