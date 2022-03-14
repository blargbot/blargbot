import { RoleMembersSubtag } from '@blargbot/cluster/subtags/role/rolemembers';
import { RequestGuildMembersReturn } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetRolePropTestCases } from './_getRolePropTest';

runSubtagTests({
    subtag: new RoleMembersSubtag(),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['rolemembers', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(role, ctx) {
                        role.id = '92348672342308424';
                        ctx.shard.setup(m => m.requestGuildMembers(ctx.guild.id, undefined))
                            .thenResolve(Object.values(ctx.members).map(m => ctx.createGuildMember(undefined, m, m.user)) as unknown as RequestGuildMembersReturn);
                    }
                },
                {
                    expected: '["23908467240974"]',
                    setup(role, ctx) {
                        role.id = '29384723084374304';
                        ctx.users.other.id = '23908467240974';
                        ctx.members.other.roles.push(role.id);

                        ctx.shard.setup(m => m.requestGuildMembers(ctx.guild.id, undefined))
                            .thenResolve(Object.values(ctx.members).map(m => ctx.createGuildMember(undefined, m, m.user)) as unknown as RequestGuildMembersReturn);
                    }
                },
                {
                    expected: '["23908467240974","98347593834657389"]',
                    setup(role, ctx) {
                        role.id = '29384723084374304';
                        ctx.users.other.id = '23908467240974';
                        ctx.users.bot.id = '98347593834657389';
                        ctx.members.other.roles.push(role.id);
                        ctx.members.bot.roles.push(role.id);

                        ctx.shard.setup(m => m.requestGuildMembers(ctx.guild.id, undefined))
                            .thenResolve(Object.values(ctx.members).map(m => ctx.createGuildMember(undefined, m, m.user)) as unknown as RequestGuildMembersReturn);
                    }
                }
            ]
        })
    ]
});
