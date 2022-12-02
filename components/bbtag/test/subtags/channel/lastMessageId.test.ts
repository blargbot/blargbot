import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { LastMessageIdSubtag } from '@blargbot/bbtag/subtags/channel/lastMessageId.js';
import { APITextChannel } from 'discord-api-types/v9';
import Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
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
                ctx.channels.command.type = Eris.Constants.ChannelTypes.GUILD_STORE;
            }
        }
    ]
});
