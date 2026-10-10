import type { GuildMemberBanLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, DiscordPermissions, NotANumberError, replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import type { SubtagTestContext } from '../../SubtagTestSuite.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';

function id(name: string): bigint {
    return `${name}<${random.bigint(10n ** 10n, 10n ** 20n)}>` as unknown as bigint;
}

await runSubtagTests({
    replacer: replacers.banReplacer,
    names: ['ban'],
    argCountBounds: { min: 1, max: 5 },
    cases: [
        {
            code: '{ban;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 9, error: new UserNotFoundError('abc') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryUser('abc', $({ global: true, throw: UserNotFoundError })))
                    .rejects(new UserNotFoundError('abc'))
                    .mustHappen();
            }
        },
        {
            code: '{ban;other user}',
            expected: 'false',
            setup(ctx) {
                const { targetId, userId } = setupBanAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(false).mustHappen(1);
            }
        },
        {
            title: 'Successful ban',
            code: '{ban;other user}',
            expected: 'true',
            setup(ctx) {
                const { targetId, userId } = setupBanAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Bot lacks ban permissions',
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to ban users!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
            }
        },
        {
            title: 'Cannot ban guild owner',
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions', 'You cannot ban the guild owner!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(ownerId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
            }
        },
        {
            title: 'Cannot ban yourself',
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions', 'You cannot ban yourself!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
            }
        },
        {
            title: 'Cannot ban the bot',
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('Bot has no permissions', 'I cannot ban myself!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(botId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
            }
        },
        {
            title: 'Moderator lacks ban permissions',
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to ban users!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions(0n)).mustHappen(1);
            }
        },
        {
            title: 'Moderator is not high enough',
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions', 'You can only ban users whos top role is below your top role!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(5).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(5).mustHappen(1);
            }
        },
        {
            title: 'Bot is not high enough',
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('Bot has no permissions', 'I can only ban users whos top role is below my top role!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(8).mustHappen(1);
            }
        },
        {
            title: 'Ban with temporary duration',
            code: '{ban;other user;;;5 days}',
            expected: (5 * 24 * 60 * 60_000).toString(),
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: 5 * 24 * 60 * 60_000
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Ban as authorizer',
            code: '{ban;other user;;;;yes}',
            expected: 'true',
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(authorizerId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Moderator has permission through ban override',
            code: '{ban;other user}',
            expected: 'true',
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions('MANAGE_GUILD')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('MANAGE_GUILD')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError }))).returns(targetId).mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Moderator lacks all ban permissions',
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to ban users!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions(0n)).mustHappen(1);

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
            }
        },
        {
            title: 'Moderator and target have equal role positions',
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions', 'You can only ban users whos top role is below your top role!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(8).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(1);
            }
        },
        {
            title: 'Moderator is exactly one role above target',
            code: '{ban;other user}',
            expected: 'true',
            setup(ctx) {
                const { targetId, userId } = setupBanAuthorization(ctx, 'user', {
                    moderatorPosition: 1,
                    targetPosition: 0,
                    botPosition: 2
                });

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Bot and target have equal role positions',
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('Bot has no permissions', 'I can only ban users whos top role is below my top role!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(8).mustHappen(1);
            }
        },
        {
            title: 'Bot is exactly one role above target',
            code: '{ban;other user}',
            expected: 'true',
            setup(ctx) {
                const { targetId, userId } = setupBanAuthorization(ctx, 'user', {
                    moderatorPosition: 1,
                    targetPosition: 0,
                    botPosition: 1
                });

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Guild owner can ban without moderator permissions',
            code: '{ban;other user}',
            expected: 'true',
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(1);

                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: ownerId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Bot can act as moderator without moderator checks',
            code: '{ban;other user}',
            expected: 'true',
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);

                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: botId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Any matching ban override permission is sufficient',
            code: '{ban;other user}',
            expected: 'true',
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions('MANAGE_GUILD', 'VIEW_CHANNEL')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('VIEW_CHANNEL')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);

                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Failed ban with duration returns false',
            code: '{ban;other user;;;2 hours}',
            expected: 'false',
            setup(ctx) {
                const { targetId, userId } = setupBanAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: 2 * 60 * 60_000
                }))).resolves(false).mustHappen(1);
            }
        },
        {
            title: 'Custom delete days',
            code: '{ban;other user;5}',
            expected: 'true',
            setup(ctx) {
                const { targetId, userId } = setupBanAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: 5,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Negative delete days',
            code: '{ban;other user;-1}',
            expected: 'true',
            setup(ctx) {
                const { targetId, userId } = setupBanAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: -1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Invalid delete days',
            code: '{ban;other user;abc}',
            expected: 'false',
            errors: [
                { start: 0, end: 20, error: new (NotANumberError.withDisplay('false'))('abc') }
            ],
            setup(ctx) {
                const targetId = id('targetId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
            }
        },
        {
            title: 'Custom reason',
            code: '{ban;other user;;My custom reason}',
            expected: 'true',
            setup(ctx) {
                const { targetId, userId } = setupBanAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: 1,
                    reason: 'My custom reason',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Custom delete days and reason',
            code: '{ban;other user;7;My custom reason}',
            expected: 'true',
            setup(ctx) {
                const { targetId, userId } = setupBanAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: 7,
                    reason: 'My custom reason',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Temporary ban',
            code: '{ban;other user;;;5 days}',
            expected: '432000000',
            setup(ctx) {
                const { targetId, userId } = setupBanAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: 5 * 24 * 60 * 60_000
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Temporary ban with custom reason',
            code: '{ban;other user;7;My custom reason;2 hours}',
            expected: '7200000',
            setup(ctx) {
                const { targetId, userId } = setupBanAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: userId,
                    daysToDelete: 7,
                    reason: 'My custom reason',
                    duration: 2 * 60 * 60_000
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with noPerms',
            code: '{ban;other user;;;;x}',
            expected: 'true',
            setup(ctx) {
                const { targetId, authorizerId } = setupBanAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with false noPerms',
            code: '{ban;other user;;;;false}',
            expected: 'true',
            setup(ctx) {
                const { targetId, authorizerId } = setupBanAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with true noPerms',
            code: '{ban;other user;;;;true}',
            expected: 'true',
            setup(ctx) {
                const { targetId, authorizerId } = setupBanAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Temporary ban with compound duration',
            code: '{ban;other user;4;My custom reason;2 hours 30s;abc}',
            expected: '7230000',
            setup(ctx) {
                const { targetId, authorizerId } = setupBanAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    daysToDelete: 4,
                    reason: 'My custom reason',
                    duration: 2 * 60 * 60_000 + 30_000
                }))).resolves(true).mustHappen(1);
            }
        }
    ]
});

function setupBanAuthorization(
    ctx: SubtagTestContext<GuildMemberBanLocals>,
    moderator: 'user' | 'authorizer',
    {
        botId = id('botId'),
        targetId = id('targetId'),
        userId = id('userId'),
        ownerId = id('ownerId'),
        authorizerId = id('authorizerId'),
        botPosition = 10,
        moderatorPosition = 9,
        targetPosition = 8
    } = {}
): { botId: bigint; targetId: bigint; userId: bigint; ownerId: bigint; authorizerId: bigint; } {
    const moderatorId = moderator === 'user' ? userId : authorizerId;

    ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
    ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
    ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
    ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
    ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);

    ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
    ctx.discord.setup(m => m.getPermissions(moderatorId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);

    ctx.discord.setup(m => m.getTopRolePosition(moderatorId)).resolves(moderatorPosition).mustHappen(1);
    ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(targetPosition).mustHappen(2);
    ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(botPosition).mustHappen(1);

    return { botId, targetId, userId, ownerId, authorizerId };
}
