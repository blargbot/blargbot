import { BBTagRuntimeError, DiscordPermissions, LegacyChannelNotFoundError, replacers } from '@blargbot/bbtag-engine';

import { randomSnowflake } from '../../randomSnowflake.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.slowModeReplacer,
    names: ['slowMode'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        {
            code: '{slowmode}',
            expected: '',
            setup(ctx) {
                const channelId = randomSnowflake('channelId');
                const botId = randomSnowflake('botId');
                ctx.discord.setup((m, $) => m.queryChannel('', $({ quiet: true }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(new DiscordPermissions('ADMINISTRATOR')).mustHappen(1);
                ctx.discord.setup(m => m.setChannelRateLimit(channelId, 0)).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Bot has manage channel',
            code: '{slowmode}',
            expected: '',
            setup(ctx) {
                const channelId = randomSnowflake('channelId');
                const botId = randomSnowflake('botId');
                ctx.discord.setup((m, $) => m.queryChannel('', $({ quiet: true }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(new DiscordPermissions('MANAGE_CHANNELS')).mustHappen(1);
                ctx.discord.setup(m => m.setChannelRateLimit(channelId, 0)).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{slowmode;1234}',
            expected: '',
            setup(ctx) {
                const channelId = randomSnowflake('channelId');
                const botId = randomSnowflake('botId');
                ctx.discord.setup((m, $) => m.queryChannel('1234', $({ quiet: true }))).resolves(null).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryChannel('', $({ quiet: true, throw: LegacyChannelNotFoundError }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(new DiscordPermissions('ADMINISTRATOR')).mustHappen(1);
                ctx.discord.setup(m => m.setChannelRateLimit(channelId, 1234)).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{slowmode;2342543235325252345}',
            expected: '',
            setup(ctx) {
                const channelId = randomSnowflake('channelId');
                const botId = randomSnowflake('botId');
                ctx.discord.setup((m, $) => m.queryChannel('2342543235325252345', $({ quiet: true }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(new DiscordPermissions('ADMINISTRATOR')).mustHappen(1);
                ctx.discord.setup(m => m.setChannelRateLimit(channelId, 0)).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{slowmode;2342543235325252345;37645}',
            expected: '',
            setup(ctx) {
                const channelId = randomSnowflake('channelId');
                const botId = randomSnowflake('botId');
                ctx.discord.setup((m, $) => m.queryChannel('2342543235325252345', $({ quiet: true, throw: LegacyChannelNotFoundError }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(new DiscordPermissions('ADMINISTRATOR')).mustHappen(1);
                ctx.discord.setup(m => m.setChannelRateLimit(channelId, 21600)).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{slowmode;2342543235325252345;this is some random text}',
            expected: '',
            setup(ctx) {
                const channelId = randomSnowflake('channelId');
                const botId = randomSnowflake('botId');
                ctx.discord.setup((m, $) => m.queryChannel('2342543235325252345', $({ quiet: true, throw: LegacyChannelNotFoundError }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(new DiscordPermissions('ADMINISTRATOR')).mustHappen(1);
                ctx.discord.setup(m => m.setChannelRateLimit(channelId, 0)).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'API returns false',
            code: '{slowmode;2342543235325252345}',
            expected: '`Missing required permissions`',
            errors: [
                { error: new BBTagRuntimeError('Missing required permissions') }
            ],
            setup(ctx) {
                const channelId = randomSnowflake('channelId');
                const botId = randomSnowflake('botId');
                ctx.discord.setup((m, $) => m.queryChannel('2342543235325252345', $({ quiet: true }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(new DiscordPermissions('ADMINISTRATOR')).mustHappen(1);
                ctx.discord.setup(m => m.setChannelRateLimit(channelId, 0)).resolves(false).mustHappen(1);
            }
        },
        {
            title: 'Bot is missing permissions',
            code: '{slowmode;2342543235325252345}',
            expected: '`Missing required permissions`',
            errors: [
                { error: new BBTagRuntimeError('Missing required permissions') }
            ],
            setup(ctx) {
                const channelId = randomSnowflake('channelId');
                const botId = randomSnowflake('botId');
                ctx.discord.setup((m, $) => m.queryChannel('2342543235325252345', $({ quiet: true }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(new DiscordPermissions('BAN_MEMBERS')).mustHappen(1);
            }
        }
    ]
});
