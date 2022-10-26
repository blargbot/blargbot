import * as coreTransformers from '@blargbot/core/formatting';
import templates from '@blargbot/core/text';
import { transformers, util } from '@blargbot/formatting';
import { quickMock } from '@blargbot/test-util/quickMock';
import { runFormatTreeTests } from '@blargbot/test-util/runFormatTreeTests';
import Eris from 'eris';
import { describe } from 'mocha';

const client = (): Eris.Client => new Eris.Client('');
const guild = (): Eris.Guild => new Eris.Guild({ id: '' }, client());
const channel = (): Eris.Channel => new Eris.Channel({ id: '' }, client());
const guildChannel = (): Eris.GuildChannel => new Eris.GuildChannel({ id: '' }, client());

describe('Core format strings', () => {
    runFormatTreeTests(templates, {
        transformers: {
            ...transformers,
            ...coreTransformers
        }
    }, {
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
                                channel: quickMock(channel, {
                                    id: '123'
                                }),
                                message: util.literal('abc')
                            }],
                            expected: 'abc\nChannel: PRIVATE CHANNEL (123)\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.'
                        }
                    ],
                    guild: [
                        {
                            name: 'default',
                            input: [{
                                channel: quickMock(guildChannel, {
                                    id: '123',
                                    name: 'MyChannel',
                                    guild: quickMock(guild, {
                                        name: 'MyGuild',
                                        id: '456'
                                    })
                                }),
                                message: util.literal('abc')
                            }],
                            expected: 'abc\nGuild: MyGuild (456)\nChannel: MyChannel (123)\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.'
                        }
                    ]
                }
            }
        }
    });
});
