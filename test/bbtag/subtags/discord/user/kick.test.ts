import type { GuildMemberKickLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, DiscordPermissions, replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import type { SubtagTestContext } from '../../SubtagTestSuite.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';

function id(name: string): bigint {
    return `${name}<${random.bigint(10n ** 10n, 10n ** 20n)}>` as unknown as bigint;
}

await runSubtagTests({
    replacer: replacers.kickReplacer,
    names: ['kick'],
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{kick;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 10, error: new UserNotFoundError('abc') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryUser('abc', $({ quiet: true, throw: UserNotFoundError })))
                    .rejects(new UserNotFoundError('abc'))
                    .mustHappen();
            }
        },
        {
            code: '{kick;other user}',
            expected: '`Kick failed`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Kick failed') }
            ],
            setup(ctx) {
                const { targetId, userId } = setupKickAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.kick($({
                    userId: targetId,
                    moderatorId: userId,
                    reason: 'Tag Kick'
                }))).resolves(false).mustHappen(1);
            }
        },
        {
            title: 'Successful kick',
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, userId } = setupKickAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.kick($({
                    userId: targetId,
                    moderatorId: userId,
                    reason: 'Tag Kick'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Bot lacks kick permissions',
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick users!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
            }
        },
        {
            title: 'Cannot kick guild owner',
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You cannot kick the guild owner!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(ownerId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
            }
        },
        {
            title: 'Cannot kick yourself',
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You cannot kick yourself!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
            }
        },
        {
            title: 'Cannot kick the bot',
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Bot has no permissions', 'I cannot kick myself!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(botId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
            }
        },
        {
            title: 'Moderator lacks kick permissions',
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick users!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions(0n)).mustHappen(1);
            }
        },
        {
            title: 'Moderator is not high enough',
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You can only kick users whos top role is below your top role!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(5).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(5).mustHappen(1);
            }
        },
        {
            title: 'Bot is not high enough',
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Bot has no permissions', 'I can only kick users whos top role is below my top role!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(8).mustHappen(1);
            }
        },
        {
            title: 'Kick as authorizer',
            code: '{kick;other user;;yes}',
            expected: 'Success',
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(authorizerId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);
                ctx.discord.setup((m, $) => m.kick($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    reason: 'Tag Kick'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Moderator has permission through kick override',
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');
                const kickOverrides = new DiscordPermissions('MANAGE_GUILD');

                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(kickOverrides).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('MANAGE_GUILD')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError }))).returns(targetId).mustHappen();
                ctx.discord.setup((m, $) => m.kick($({
                    userId: targetId,
                    moderatorId: userId,
                    reason: 'Tag Kick'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Moderator lacks all kick permissions',
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick users!') }
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
                ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions(0n)).mustHappen(1);

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
            }
        },
        {
            title: 'Moderator and target have equal role positions',
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You can only kick users whos top role is below your top role!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(8).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(1);
            }
        },
        {
            title: 'Moderator is exactly one role above target',
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, userId } = setupKickAuthorization(ctx, 'user', {
                    moderatorPosition: 1,
                    targetPosition: 0,
                    botPosition: 2
                });

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.kick($({
                    userId: targetId,
                    moderatorId: userId,
                    reason: 'Tag Kick'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Bot and target have equal role positions',
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Bot has no permissions', 'I can only kick users whos top role is below my top role!') }
            ],
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(8).mustHappen(1);
            }
        },
        {
            title: 'Bot is exactly one role above target',
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, userId } = setupKickAuthorization(ctx, 'user', {
                    moderatorPosition: 1,
                    targetPosition: 0,
                    botPosition: 1
                });

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.kick($({
                    userId: targetId,
                    moderatorId: userId,
                    reason: 'Tag Kick'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Guild owner can kick without moderator permissions',
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(1);

                ctx.discord.setup((m, $) => m.kick($({
                    userId: targetId,
                    moderatorId: ownerId,
                    reason: 'Tag Kick'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Bot can act as moderator without moderator checks',
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);

                ctx.discord.setup((m, $) => m.kick($({
                    userId: targetId,
                    moderatorId: botId,
                    reason: 'Tag Kick'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Any matching kick override permission is sufficient',
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                const botId = id('botId');
                const targetId = id('targetId');
                const userId = id('userId');
                const ownerId = id('ownerId');
                const authorizerId = id('authorizerId');
                const kickOverrides = new DiscordPermissions('MANAGE_GUILD', 'VIEW_CHANNEL');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.ownerId).returns(ownerId).mustHappen(1);
                ctx.discord.setup(m => m.kickOverrides).returns(kickOverrides).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('VIEW_CHANNEL')).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);

                ctx.discord.setup((m, $) => m.kick($({
                    userId: targetId,
                    moderatorId: userId,
                    reason: 'Tag Kick'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Custom reason',
            code: '{kick;other user;My custom reason}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, userId } = setupKickAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.kick($({
                    userId: targetId,
                    moderatorId: userId,
                    reason: 'My custom reason'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with noPerms',
            code: '{kick;other user;;x}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, authorizerId } = setupKickAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.kick($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    reason: 'Tag Kick'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with false noPerms',
            code: '{kick;other user;;false}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, authorizerId } = setupKickAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.kick($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    reason: 'Tag Kick'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with true noPerms',
            code: '{kick;other user;;true}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, authorizerId } = setupKickAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.kick($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    reason: 'Tag Kick'
                }))).resolves(true).mustHappen(1);
            }
        }
    ]
});

function setupKickAuthorization(
    ctx: SubtagTestContext<GuildMemberKickLocals>,
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
    ctx.discord.setup(m => m.kickOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);

    ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);
    ctx.discord.setup(m => m.getPermissions(moderatorId)).resolves(new DiscordPermissions('KICK_MEMBERS')).mustHappen(1);

    ctx.discord.setup(m => m.getTopRolePosition(moderatorId)).resolves(moderatorPosition).mustHappen(1);
    ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(targetPosition).mustHappen(2);
    ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(botPosition).mustHappen(1);

    return { botId, targetId, userId, ownerId, authorizerId };
}
