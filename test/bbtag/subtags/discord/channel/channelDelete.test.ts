import type { GuildChannelDeleteLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, DiscordPermissions, FailedToEditChannelNoPermsError, LegacyChannelNotFoundError, replacers } from '@blargbot/bbtag-engine';

import { randomSnowflake } from '../../randomSnowflake.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    replacer: replacers.channelDeleteReplacer,
    names: ['channelDelete'],
    argCountBounds: { min: 1, max: 1 },
    cases: [
        ...createGetChannelPropTestCases<GuildChannelDeleteLocals>({
            includeNoArgs: false,
            generateCode(...args) {
                return `{${['channeldelete', ...args].join(';')}}`;
            },
            notFound: LegacyChannelNotFoundError,
            cases: [
                {
                    expected: '',
                    setup(ctx, channelId) {
                        const botId = randomSnowflake('botId');
                        const authorizerId = randomSnowflake('authorizerId');
                        ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                        ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                        ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                        ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                        ctx.discord.setup(m => m.deleteChannel(channelId)).resolves(true).mustHappen(1);
                    }
                }
            ]
        }),
        {
            title: 'Authorizer is admin',
            code: '{channeldelete;2384762844234324}',
            expected: '',
            setup(ctx) {
                const botId = randomSnowflake('botId');
                const authorizerId = randomSnowflake('authorizerId');
                const channelId = randomSnowflake('channelId');
                ctx.discord.setup((m, $) => m.queryChannel('2384762844234324', $({ throw: LegacyChannelNotFoundError }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                ctx.discord.setup(m => m.deleteChannel(channelId)).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Authorizer has perms for specific channel',
            code: '{channeldelete;2384762844234324}',
            expected: '',
            setup(ctx) {
                const botId = randomSnowflake('botId');
                const authorizerId = randomSnowflake('authorizerId');
                const channelId = randomSnowflake('channelId');
                ctx.discord.setup((m, $) => m.queryChannel('2384762844234324', $({ throw: LegacyChannelNotFoundError }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
                ctx.discord.setup(m => m.deleteChannel(channelId)).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{channeldelete;2384762844234324}',
            expected: '`Author cannot edit this channel`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot edit this channel') }
            ],
            setup(ctx) {
                const authorizerId = randomSnowflake('authorizerId');
                const channelId = randomSnowflake('channelId');
                ctx.discord.setup((m, $) => m.queryChannel('2384762844234324', $({ throw: LegacyChannelNotFoundError }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.NONE).mustHappen(1);
            }
        },
        {
            code: '{channeldelete;2384762844234324}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { error: new FailedToEditChannelNoPermsError() }
            ],
            setup(ctx) {
                const botId = randomSnowflake('botId');
                const authorizerId = randomSnowflake('authorizerId');
                const channelId = randomSnowflake('channelId');
                ctx.discord.setup((m, $) => m.queryChannel('2384762844234324', $({ throw: LegacyChannelNotFoundError }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(DiscordPermissions.NONE).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
            }
        },
        {
            code: '{channeldelete;2384762844234324}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { error: new FailedToEditChannelNoPermsError() }
            ],
            setup(ctx) {
                const botId = randomSnowflake('botId');
                const authorizerId = randomSnowflake('authorizerId');
                const channelId = randomSnowflake('channelId');
                ctx.discord.setup((m, $) => m.queryChannel('2384762844234324', $({ throw: LegacyChannelNotFoundError }))).resolves(channelId).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                ctx.discord.setup(m => m.deleteChannel(channelId)).resolves(false).mustHappen(1);
            }
        }
    ]
});
