import type { GuildMemberBanLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, DiscordPermissions, replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import type { SubtagTestContext } from '../../SubtagTestSuite.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';

function id(name: string): bigint {
    return `${name}<${random.bigint(10n ** 10n, 10n ** 20n)}>` as unknown as bigint;
}

await runSubtagTests({
    replacer: replacers.unbanReplacer,
    names: ['unban'],
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{unban;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 11, error: new UserNotFoundError('abc') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryUser('abc', $({ global: true, throw: UserNotFoundError })))
                    .rejects(new UserNotFoundError('abc'))
                    .mustHappen(1);
            }
        },
        {
            title: 'Successful unban',
            code: '{unban;other user}',
            expected: 'true',
            setup(ctx) {
                const { targetId, userId } = setupUnbanAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.unban($({
                    userId: targetId,
                    moderatorId: userId,
                    reason: 'Tag Unban'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Failed unban',
            code: '{unban;other user}',
            expected: 'false',
            setup(ctx) {
                const { targetId, userId } = setupUnbanAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.unban($({
                    userId: targetId,
                    moderatorId: userId,
                    reason: 'Tag Unban'
                }))).resolves(false).mustHappen(1);
            }
        },
        {
            title: 'Bot lacks unban permissions',
            code: '{unban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 18, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to unban users!') }
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
            title: 'Moderator lacks unban permissions',
            code: '{unban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 18, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to unban users!') }
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
            title: 'Moderator has permission through ban override',
            code: '{unban;other user}',
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
                ctx.discord.setup(m => m.banOverrides).returns(new DiscordPermissions('MANAGE_GUILD')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(userId)).resolves(new DiscordPermissions('MANAGE_GUILD')).mustHappen(1);

                ctx.discord.setup((m, $) => m.unban($({
                    userId: targetId,
                    moderatorId: userId,
                    reason: 'Tag Unban'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Custom reason',
            code: '{unban;other user;My reason here}',
            expected: 'true',
            setup(ctx) {
                const { targetId, userId } = setupUnbanAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.unban($({
                    userId: targetId,
                    moderatorId: userId,
                    reason: 'My reason here'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Empty reason uses default',
            code: '{unban;other user;My reason here;}',
            expected: 'true',
            setup(ctx) {
                const { targetId, userId } = setupUnbanAuthorization(ctx, 'user');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.unban($({
                    userId: targetId,
                    moderatorId: userId,
                    reason: 'My reason here'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with noPerms',
            code: '{unban;other user;My reason here;x}',
            expected: 'true',
            setup(ctx) {
                const { targetId, authorizerId } = setupUnbanAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.unban($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    reason: 'My reason here'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with false noPerms',
            code: '{unban;other user;My reason here;false}',
            expected: 'true',
            setup(ctx) {
                const { targetId, authorizerId } = setupUnbanAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.unban($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    reason: 'My reason here'
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer used with true noPerms',
            code: '{unban;other user;My reason here;true}',
            expected: 'true',
            setup(ctx) {
                const { targetId, authorizerId } = setupUnbanAuthorization(ctx, 'authorizer');

                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(targetId)
                    .mustHappen();

                ctx.discord.setup((m, $) => m.unban($({
                    userId: targetId,
                    moderatorId: authorizerId,
                    reason: 'My reason here'
                }))).resolves(true).mustHappen(1);
            }
        }
    ]
});

function setupUnbanAuthorization(
    ctx: SubtagTestContext<GuildMemberBanLocals>,
    moderator: 'user' | 'authorizer',
    {
        botId = id('botId'),
        targetId = id('targetId'),
        userId = id('userId'),
        ownerId = id('ownerId'),
        authorizerId = id('authorizerId')
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

    return { botId, targetId, userId, ownerId, authorizerId };
}
