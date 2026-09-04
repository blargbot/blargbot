import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { LastMessageIdSubtag } from '@blargbot/bbtag/subtags/channel/lastMessageId.js';
import type { APITextChannel } from 'discord-api-types/v9';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

// /workspaces/blargbot/.yarn/cache/discord-api-types-npm-0.37.20-e3242ea9fb-5595f44f66.zip/node_modules/discord-api-types/payloads/v9/channel.d.ts
// \workspaces\blargbot\.yarn\cache\discord-api-types-npm-0.37.20-e3242ea9fb-5595f44f66.zip\node_modules\discord-api-types\payloads\v9\channel.d.ts

await runSubtagTests({
    subtag: new LastMessageIdSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: false,
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['lastmessageid', ...args].join(';')}}`;
            },
            cases: [
                {
                    title: 'When a message has been sent',
                    expected: '2349786234946724',
                    setup(channel) {
                        (channel as APITextChannel).last_message_id = '2349786234946724';
                    }
                },
                {
                    title: 'When no message has been sent',
                    expected: '',
                    setup(channel) {
                        (channel as APITextChannel).last_message_id = null;
                    }
                }
            ]
        }),
        {
            code: '{lastmessageid}',
            expected: '`Channel must be a textable channel`',
            errors: [
                { start: 0, end: 15, error: new BBTagRuntimeError('Channel must be a textable channel') }
            ],
            setup(ctx) {
                ctx.channels.command.type = eris.Constants.ChannelTypes.GUILD_CATEGORY;
            }
        }
    ]
});
