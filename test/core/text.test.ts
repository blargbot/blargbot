import templates from '@blargbot/core/text';
import { literal } from '@blargbot/domain/messages/types';
import { makeMock as quickMock } from '@blargbot/test-util/makeMock';
import { runFormatTreeTests } from '@blargbot/test-util/runFormatTreeTests';
import { Channel, Guild, GuildChannel } from 'eris';
import { describe } from 'mocha';

describe('Core format strings', () => {
    runFormatTreeTests(templates, {
        utils: {
            send: {
                errors: {
                    channelNoPerms: 'I tried to send a message in response to your command, but didn\'t have permission to see the channel. If you think this is an error, please contact the staff on your guild to give me the `Read Messages` permission.',
                    messageNoPerms: 'I tried to send a message in response to your command, but didn\'t have permission to speak. If you think this is an error, please contact the staff on your guild to give me the `Send Messages` permission.',
                    embedNoPerms: 'I don\'t have permission to embed links! This will break several of my commands. Please give me the `Embed Links` permission. Thanks!',
                    dm: [
                        {
                            name: 'default',
                            input: [{
                                channel: quickMock(Channel, {
                                    id: '123'
                                }),
                                message: literal('abc')
                            }],
                            expected: 'abc\nChannel: PRIVATE CHANNEL (123)\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.'
                        }
                    ],
                    guild: [
                        {
                            name: 'default',
                            input: [{
                                channel: quickMock(GuildChannel, {
                                    id: '123',
                                    name: 'MyChannel',
                                    guild: quickMock(Guild, {
                                        name: 'MyGuild',
                                        id: '456'
                                    })
                                }),
                                message: literal('abc')
                            }],
                            expected: 'abc\nGuild: MyGuild (456)\nChannel: MyChannel (123)\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.'
                        }
                    ]
                }
            }
        }
    });
});
