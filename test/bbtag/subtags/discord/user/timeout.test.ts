import type { GuildMemberTimeoutLocals } from '@blargbot/bbtag-engine';
import {
    BBTagRuntimeError,
    DiscordPermissions,
    InvalidDurationError,
    replacers,
    UserNotFoundError
} from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import type { SubtagTestContext } from '../../SubtagTestSuite.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';

function id(name: string): bigint {
    return `${name}<${random.bigint(10n ** 10n, 10n ** 20n)}>` as unknown as bigint;
}

await runSubtagTests({
    replacer: replacers.timeoutReplacer,
    names: ['timeout'],
    argCountBounds: { min: 2, max: 4 },
    cases: [
        {
            code: '{timeout;other user;abc}',
            expected: '`Invalid duration`',
            errors: [
                { start: 0, end: 24, error: new InvalidDurationError('abc') }
            ]
        },
        {
            code: '{timeout;abc;1s}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 16, error: new UserNotFoundError('abc') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryUser('abc', $({ quiet: true, throw: UserNotFoundError })))
                    .rejects(new UserNotFoundError('abc'))
                    .mustHappen();
            }
        },
        {
            title: 'Failed timeout',
            code: '{timeout;other user;1s}',
            expected: '`User is already timed out`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User is already timed out', 'other user is already timed out!') }
            ],
            setup(ctx) {
                const { targetId, userId } = setupTimeoutAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 1_000,
                    reason: 'Tag Timeout'
                }))).resolves(false).mustHappen(1);
            }
        },
        {
            title: 'Successful timeout',
            code: '{timeout;other user;1s}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, userId } = setupTimeoutAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 1_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Bot lacks timeout permissions',
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to timeout users!') }
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId))
                    .resolves(new DiscordPermissions('BAN_MEMBERS'))
                    .mustHappen(1);
            }
        },
        {
            title: 'Cannot timeout guild owner',
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You cannot timeout the guild owner!') }
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId))
                    .resolves(new DiscordPermissions('MODERATE_MEMBERS'))
                    .mustHappen(1);
            }
        },
        {
            title: 'Cannot timeout yourself',
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You cannot timeout yourself!') }
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId))
                    .resolves(new DiscordPermissions('MODERATE_MEMBERS'))
                    .mustHappen(1);
            }
        },
        {
            title: 'Cannot timeout the bot',
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I cannot timeout myself!') }
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId))
                    .resolves(new DiscordPermissions('MODERATE_MEMBERS'))
                    .mustHappen(1);
            }
        },
        {
            title: 'Cannot timeout administrator',
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'Administrators cannot be timed out!') }
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(targetId)).resolves(new DiscordPermissions('ADMINISTRATOR')).mustHappen(1);
            }
        },
        {
            title: 'Moderator lacks timeout permissions',
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to timeout users!') }
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(targetId)).resolves(new DiscordPermissions(0n)).mustHappen(1);
            }
        },
        {
            title: 'Moderator is not high enough',
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You can only timeout users whos top role is below your top role!') }
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(targetId)).resolves(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(5).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(5).mustHappen(1);
            }
        },
        {
            title: 'Bot is not high enough',
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I can only timeout users whos top role is below my top role!') }
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(targetId)).resolves(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(8).mustHappen(1);
            }
        },
        {
            title: 'Timeout with one second duration',
            code: '{timeout;other user;1s}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, userId } = setupTimeoutAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 1_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Maximum Discord timeout duration',
            code: '{timeout;other user;29d}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, userId } = setupTimeoutAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 29 * 24 * 60 * 60_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Empty reason uses default',
            code: '{timeout;other user;1d;}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, userId } = setupTimeoutAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 24 * 60 * 60_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Custom reason',
            code: '{timeout;other user;1d;Because I can}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, userId } = setupTimeoutAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 24 * 60 * 60_000,
                    reason: 'Because I can'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Custom reason with empty noPerms',
            code: '{timeout;other user;1d;Because I can;}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, userId } = setupTimeoutAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 24 * 60 * 60_000,
                    reason: 'Because I can'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with noPerms',
            code: '{timeout;other user;1d;Because I can;x}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, authorizerId } = setupTimeoutAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    duration: 24 * 60 * 60_000,
                    reason: 'Because I can'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with empty reason and noPerms',
            code: '{timeout;other user;1d;;x}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, authorizerId } = setupTimeoutAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    duration: 24 * 60 * 60_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Negative duration',
            code: '{timeout;other user;-1d}',
            expected: '`Invalid duration`',
            errors: [
                { start: 0, end: 24, error: new InvalidDurationError('-1d') }
            ]
        },
        {
            title: 'Removing timeout',
            code: '{timeout;other user;0s}',
            expected: '`User is not timed out`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User is not timed out', 'other user is not timed out!') }
            ],
            setup(ctx) {
                const { targetId, userId } = setupTimeoutAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 0,
                    reason: 'Tag Timeout'
                }))).resolves(false).mustHappen(1);
            }
        },
        {
            title: 'Moderator has permission through timeout override',
            code: '{timeout;other user;1s}',
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions('MANAGE_GUILD')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('MANAGE_GUILD')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(targetId)).resolves(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 1_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Moderator lacks all timeout permissions',
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to timeout users!') }
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(targetId)).resolves(new DiscordPermissions(0n)).mustHappen(1);
            }
        },
        {
            title: 'Moderator and target have equal role positions',
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You can only timeout users whos top role is below your top role!') }
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(targetId)).resolves(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(8).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(1);
            }
        },
        {
            title: 'Moderator is exactly one role above target',
            code: '{timeout;other user;1s}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, userId } = setupTimeoutAuthorization(ctx, 'user', {
                    moderatorPosition: 1,
                    targetPosition: 0,
                    botPosition: 2
                });

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 1_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Bot and target have equal role positions',
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I can only timeout users whos top role is below my top role!') }
            ],
            setup(ctx) {
                const { targetId } = setupTimeoutAuthorization(ctx, 'user', {
                    moderatorPosition: 9,
                    targetPosition: 8,
                    botPosition: 8
                });

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();
            }
        },
        {
            title: 'Bot is exactly one role above target',
            code: '{timeout;other user;1s}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, userId } = setupTimeoutAuthorization(ctx, 'user', {
                    moderatorPosition: 1,
                    targetPosition: 0,
                    botPosition: 1
                });

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 1_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Guild owner can timeout without moderator permissions',
            code: '{timeout;other user;1s}',
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(targetId)).resolves(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(1);

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: ownerId,
                    duration: 1_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Bot can act as moderator without moderator checks',
            code: '{timeout;other user;1s}',
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(targetId)).resolves(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: botId,
                    duration: 1_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Any matching timeout override permission is sufficient',
            code: '{timeout;other user;1s}',
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
                ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions('MANAGE_GUILD', 'VIEW_CHANNEL')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('VIEW_CHANNEL')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(targetId)).resolves(new DiscordPermissions(0n)).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(userId)).resolves(9).mustHappen(1);
                ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(8).mustHappen(2);
                ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(10).mustHappen(1);

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 1_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Failed timeout when removing timeout',
            code: '{timeout;other user;0s}',
            expected: '`User is not timed out`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User is not timed out', 'other user is not timed out!') }
            ],
            setup(ctx) {
                const { targetId, userId } = setupTimeoutAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 0,
                    reason: 'Tag Timeout'
                }))).resolves(false).mustHappen(1);
            }
        },
        {
            title: 'Compound duration',
            code: '{timeout;other user;2 hours 30s}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, userId } = setupTimeoutAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: userId,
                    duration: 2 * 60 * 60_000 + 30_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with noPerms',
            code: '{timeout;other user;1d;;x}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, authorizerId } = setupTimeoutAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    duration: 24 * 60 * 60_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with false noPerms',
            code: '{timeout;other user;1d;;false}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, authorizerId } = setupTimeoutAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    duration: 24 * 60 * 60_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with true noPerms',
            code: '{timeout;other user;1d;;true}',
            expected: 'Success',
            setup(ctx) {
                const { targetId, authorizerId } = setupTimeoutAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ quiet: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.setUserTimeout($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    duration: 24 * 60 * 60_000,
                    reason: 'Tag Timeout'
                }))).resolves(true).mustHappen(1);
            }
        }
    ]
});

function setupTimeoutAuthorization(
    ctx: SubtagTestContext<GuildMemberTimeoutLocals>,
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
    ctx.discord.setup(m => m.timeoutOverrides).returns(new DiscordPermissions(0n)).mustHappen(1);

    ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
    ctx.discord.setup(m => m.getPermissions(moderatorId)).resolves(new DiscordPermissions('MODERATE_MEMBERS')).mustHappen(1);
    ctx.discord.setup(m => m.getPermissions(targetId)).resolves(new DiscordPermissions(0n)).mustHappen(1);

    ctx.discord.setup(m => m.getTopRolePosition(moderatorId)).resolves(moderatorPosition).mustHappen(1);
    ctx.discord.setup(m => m.getTopRolePosition(targetId)).resolves(targetPosition).mustHappen(2);
    ctx.discord.setup(m => m.getTopRolePosition(botId)).resolves(botPosition).mustHappen(1);

    return { botId, targetId, userId, ownerId, authorizerId };
}
