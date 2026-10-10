import type { DiscordUserMentionLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

type Mentions = DiscordUserMentionLocals['discord']['mentions'];

await runSubtagTests({
    replacer: replacers.userMentionReplacer,
    names: ['userMention'],
    argCountBounds: { min: 0, max: 3 },
    cases: [
        ...createGetUserPropTestCases<DiscordUserMentionLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['usermention', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '<a mention>',
                    setup(ctx, userId) {
                        this.expected = `<@${userId}>`;
                        const mentions = ctx.createMock<Mentions>();
                        const userMentions = ctx.createMock<Set<bigint>>();
                        ctx.discord.setup(m => m.mentions).returns(mentions.instance).mustHappen(1);
                        mentions.setup(m => m.users).returns(userMentions.instance).mustHappen(1);
                        userMentions.setup(m => m.add(userId)).returns(userMentions.instance).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<DiscordUserMentionLocals>({
            quiet: '',
            generateCode(userStr = '', quietStr = '') {
                return `{usermention;${userStr};${quietStr};false}`;
            },
            cases: [
                {
                    expected: '<a mention>',
                    setup(ctx, userId) {
                        this.expected = `<@${userId}>`;
                        const mentions = ctx.createMock<Mentions>();
                        const userMentions = ctx.createMock<Set<bigint>>();
                        ctx.discord.setup(m => m.mentions).returns(mentions.instance).mustHappen(1);
                        mentions.setup(m => m.users).returns(userMentions.instance).mustHappen(1);
                        userMentions.setup(m => m.add(userId)).returns(userMentions.instance).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<DiscordUserMentionLocals>({
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
