import { NotEnoughArgumentsError } from '@cluster/bbtag/errors';
import { ModerationManager } from '@cluster/managers';
import { BanSubtag } from '@cluster/subtags/user/ban';
import { snowflake } from '@cluster/utils';
import { Constants } from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new BanSubtag(),
    setup(ctx) {
        ctx.cluster.setup(m => m.moderation).thenReturn(new ModerationManager(ctx.cluster.instance));
        ctx.guild.members ??= [];
        ctx.guild.members.push(SubtagTestContext.createApiGuildMember({}, SubtagTestContext.createApiUser({
            id: '123456',
            username: 'bannable user',
            discriminator: '0001'
        })));
    },
    cases: [
        {
            code: '{ban}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 5, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{ban;bannable user}',
            expected: 'true',
            setup(ctx) {
                const roleId = snowflake.create().toString();
                ctx.guild.roles.push(SubtagTestContext.createApiRole({ id: roleId, permissions: Constants.Permissions.banMembers.toString() }));
                ctx.botMember.roles.push(roleId);

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, '123456', 1, '[blargbot#0128] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, '123456', 1, '[blargbot#0128] Tag Ban')).once();
            }
        }
    ]
});
