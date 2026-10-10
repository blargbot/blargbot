import type { GuildChannelSetPositionLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, DiscordPermissions, FailedToMoveChannelNoPermsError, LegacyChannelNotFoundError, NotANumberError, replacers } from '@blargbot/bbtag-engine';

import { randomSnowflake } from '../../randomSnowflake.js';
import type { SubtagTestContext } from '../../SubtagTestSuite.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';

const channelId = 239874692346327846n;

await runSubtagTests<GuildChannelSetPositionLocals>({
    replacer: replacers.channelSetPositionReplacer,
    names: ['channelSetPosition', 'channelSetPos'],
    argCountBounds: { min: 2, max: 2 },
    cases: [
        // Moving the channel
        ...['0', '1', '123'].map(position => ({
            title: `Set channel position to ${position}`,
            code: `{channelsetpos;239874692346327846;${position}}`,
            expected: '',
            setup(ctx: SubtagTestContext<GuildChannelSetPositionLocals>) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);

                ctx.discord.setup(m => m.setChannelPosition(channelId, Number(position)))
                    .resolves(true)
                    .mustHappen(1);
            }
        })),
        {
            title: 'Setting the channel position fails',
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Failed to move channel: no perms`',
            errors: [
                { error: new FailedToMoveChannelNoPermsError() }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);

                ctx.discord.setup(m => m.setChannelPosition(channelId, 123))
                    .resolves(false)
                    .mustHappen(1);
            }
        },

        // Invalid arguments
        ...['abc', 'one two', ''].map(position => ({
            title: `Position "${position}" is not a number`,
            code: `{channelsetpos;239874692346327846;${position}}`,
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError(position) }
            ],
            setup(ctx: SubtagTestContext<GuildChannelSetPositionLocals>) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
            }
        })),

        // Channel lookup
        {
            title: 'Channel does not exist',
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Channel does not exist`',
            errors: [
                { error: new LegacyChannelNotFoundError('239874692346327846') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryChannel('239874692346327846', $({ throw: LegacyChannelNotFoundError })))
                    .rejects(new LegacyChannelNotFoundError('239874692346327846'))
                    .mustHappen(1);
            }
        },
        {
            title: 'Channel is looked up before the position is parsed',
            code: '{channelsetpos;239874692346327846;abc}',
            expected: '`Channel does not exist`',
            errors: [
                { error: new LegacyChannelNotFoundError('239874692346327846') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryChannel('239874692346327846', $({ throw: LegacyChannelNotFoundError })))
                    .rejects(new LegacyChannelNotFoundError('239874692346327846'))
                    .mustHappen(1);
            }
        },

        // Permissions needed to move a channel
        {
            title: 'Author with only ADMINISTRATOR can move channels',
            code: '{channelsetpos;239874692346327846;123}',
            expected: '',
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, new DiscordPermissions('ADMINISTRATOR'));

                ctx.discord.setup(m => m.setChannelPosition(channelId, 123))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'Author with only MANAGE_CHANNELS can move channels',
            code: '{channelsetpos;239874692346327846;123}',
            expected: '',
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, new DiscordPermissions('MANAGE_CHANNELS'));

                ctx.discord.setup(m => m.setChannelPosition(channelId, 123))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'Bot with only ADMINISTRATOR can move channels',
            code: '{channelsetpos;239874692346327846;123}',
            expected: '',
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, undefined, new DiscordPermissions('ADMINISTRATOR'));

                ctx.discord.setup(m => m.setChannelPosition(channelId, 123))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'Bot with only MANAGE_CHANNELS can move channels',
            code: '{channelsetpos;239874692346327846;123}',
            expected: '',
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, undefined, new DiscordPermissions('MANAGE_CHANNELS'));

                ctx.discord.setup(m => m.setChannelPosition(channelId, 123))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'Author with no permissions cannot move this channel',
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Author cannot move this channel`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot move this channel') }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);

                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup(m => m.authorizerId)
                    .returns(authorizerId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId))
                    .resolves(new DiscordPermissions(0n))
                    .mustHappen(1);
            }
        },
        {
            title: 'Author with only unrelated permissions cannot move this channel',
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Author cannot move this channel`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot move this channel') }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);

                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup(m => m.authorizerId)
                    .returns(authorizerId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId))
                    .resolves(new DiscordPermissions('SEND_MESSAGES', 'VIEW_CHANNEL'))
                    .mustHappen(1);
            }
        },
        {
            title: 'Author with only other management permissions cannot move this channel',
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Author cannot move this channel`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot move this channel') }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);

                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup(m => m.authorizerId)
                    .returns(authorizerId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId))
                    .resolves(new DiscordPermissions('MANAGE_GUILD', 'MANAGE_THREADS'))
                    .mustHappen(1);
            }
        },
        {
            title: 'Bot with no permissions cannot move this channel',
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Failed to move channel: no perms`',
            errors: [
                { error: new FailedToMoveChannelNoPermsError() }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, undefined, new DiscordPermissions(0n));
            }
        },
        {
            title: 'Bot with only unrelated permissions cannot move this channel',
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Failed to move channel: no perms`',
            errors: [
                { error: new FailedToMoveChannelNoPermsError() }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, undefined, new DiscordPermissions('SEND_MESSAGES', 'VIEW_CHANNEL'));
            }
        },
        {
            title: 'Bot with only other management permissions cannot move this channel',
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Failed to move channel: no perms`',
            errors: [
                { error: new FailedToMoveChannelNoPermsError() }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, undefined, new DiscordPermissions('MANAGE_GUILD', 'MANAGE_THREADS'));
            }
        },

        // The order that checks are made in
        {
            title: 'Author and bot with no permissions cannot move this channel',
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Author cannot move this channel`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot move this channel') }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);

                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup(m => m.authorizerId)
                    .returns(authorizerId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId))
                    .resolves(new DiscordPermissions(0n))
                    .mustHappen(1);
            }
        },
        {
            title: 'Author permissions are checked before the position is parsed',
            code: '{channelsetpos;239874692346327846;abc}',
            expected: '`Author cannot move this channel`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot move this channel') }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);

                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup(m => m.authorizerId)
                    .returns(authorizerId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId))
                    .resolves(new DiscordPermissions(0n))
                    .mustHappen(1);
            }
        },
        {
            title: 'Bot permissions are checked before the position is parsed',
            code: '{channelsetpos;239874692346327846;abc}',
            expected: '`Failed to move channel: no perms`',
            errors: [
                { error: new FailedToMoveChannelNoPermsError() }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, undefined, new DiscordPermissions(0n));
            }
        }
    ]
});

function setupChannelQuery(ctx: SubtagTestContext<GuildChannelSetPositionLocals>): void {
    ctx.discord.setup((m, $) => m.queryChannel(channelId.toString(), $({ throw: LegacyChannelNotFoundError })))
        .resolves(channelId)
        .mustHappen(1);
}

function setupChannelPermissions(
    ctx: SubtagTestContext<GuildChannelSetPositionLocals>,
    authorizerPermissions = new DiscordPermissions('ADMINISTRATOR'),
    botPermissions = new DiscordPermissions('ADMINISTRATOR')
): void {
    const authorizerId = randomSnowflake('authorizerId');
    const botId = randomSnowflake('botId');

    ctx.discord.setup(m => m.authorizerId)
        .returns(authorizerId)
        .mustHappen(1);

    ctx.discord.setup(m => m.botId)
        .returns(botId)
        .mustHappen(1);

    ctx.discord.setup(m => m.getPermissions(authorizerId, channelId))
        .resolves(authorizerPermissions)
        .mustHappen(1);

    ctx.discord.setup(m => m.getPermissions(botId, channelId))
        .resolves(botPermissions)
        .mustHappen(1);
}
