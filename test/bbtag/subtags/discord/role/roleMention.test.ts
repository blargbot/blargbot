import type { GuildRoleMentionLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

type Mentions = GuildRoleMentionLocals['discord']['mentions'];

await runSubtagTests({
    replacer: replacers.roleMentionReplacer,
    names: ['roleMention'],
    argCountBounds: { min: 1, max: 3 },
    cases: [
        ...createGetRolePropTestCases<GuildRoleMentionLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['rolemention', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '<a mention>',
                    setup(ctx, roleId) {
                        this.expected = `<@&${roleId}>`;
                        const mentions = ctx.createMock<Mentions>();
                        const roleMentions = ctx.createMock<Set<bigint>>();
                        ctx.discord.setup(m => m.mentions).returns(mentions.instance).mustHappen(1);
                        mentions.setup(m => m.roles).returns(roleMentions.instance).mustHappen(1);
                        roleMentions.setup(m => m.add(roleId)).returns(roleMentions.instance).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases<GuildRoleMentionLocals>({
            quiet: '',
            generateCode(userStr = '', quietStr = '') {
                return `{rolemention;${userStr};${quietStr};false}`;
            },
            cases: [
                {
                    expected: '<a mention>',
                    setup(ctx, roleId) {
                        this.expected = `<@&${roleId}>`;
                        const mentions = ctx.createMock<Mentions>();
                        const roleMentions = ctx.createMock<Set<bigint>>();
                        ctx.discord.setup(m => m.mentions).returns(mentions.instance).mustHappen(1);
                        mentions.setup(m => m.roles).returns(roleMentions.instance).mustHappen(1);
                        roleMentions.setup(m => m.add(roleId)).returns(roleMentions.instance).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases<GuildRoleMentionLocals>({
            quiet: '',
            generateCode(userStr = '', quietStr = '') {
                return `{rolemention;${userStr};${quietStr};true}`;
            },
            cases: [
                {
                    expected: '<a mention>',
                    setup(_, userId) {
                        this.expected = `<@&${userId}>`;
                    }
                }
            ]
        })
    ]
});
