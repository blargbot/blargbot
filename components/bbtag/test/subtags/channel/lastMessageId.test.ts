import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { LastMessageIdSubtag } from '@bbtag/blargbot/subtags';
import Discord from 'discord-api-types/v10';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(LastMessageIdSubtag),
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
                        (channel as Discord.APITextChannel).last_message_id = '2349786234946724';
                    }
                },
                {
                    title: 'When no message has been sent',
                    expected: '',
                    setup(channel) {
                        (channel as Discord.APITextChannel).last_message_id = null;
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
                ctx.channels.command.type = Discord.ChannelType.GuildForum;
            }
        }
    ]
});
