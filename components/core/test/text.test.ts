import * as coreTransformers from '@blargbot/core/formatting/index.js';
import templates from '@blargbot/core/text.js';
import { transformers, util } from '@blargbot/formatting';
import { quickMock } from '@blargbot/test-util/quickMock.js';
import { runFormatTreeTests } from '@blargbot/test-util/runFormatTreeTests.js';
import * as Eris from 'eris';
import * as mocha from 'mocha';

const client = (): Eris.Client => new Eris.Client('');
const guild = (): Eris.Guild => new Eris.Guild({ id: '' }, client());
const channel = (): Eris.Channel => new Eris.Channel({ id: '' }, client());
const guildChannel = (): Eris.GuildChannel => new Eris.GuildChannel({ id: '' }, client());

mocha.describe('Core format strings', () => {
    runFormatTreeTests(templates, {
        transformers: {
            ...transformers,
            ...coreTransformers
        }
    }, {
        common: {
            duration: {
                full: {
                    template: [
                        {
                            name: 'none',
                            input: [{ parts: [] }],
                            expected: '0 seconds'
                        },
                        {
                            name: 'some',
                            input: [{ parts: ['1 year', '1 month', '1 day', '1 hour', '1 minute', '1 second', '1 millisecond'] }],
                            expected: '1 year, 1 month, 1 day, 1 hour, 1 minute, 1 second and 1 millisecond'
                        }
                    ],
                    year: {
                        order: '0',
                        display: [
                            {
                                name: 'none',
                                input: [{ value: 0 }],
                                expected: ''
                            },
                            {
                                name: 'single',
                                input: [{ value: 1 }],
                                expected: '1 year'
                            },
                            {
                                name: 'multiple',
                                input: [{ value: 123 }],
                                expected: '123 years'
                            }
                        ]
                    },
                    month: {
                        order: '1',
                        display: [
                            {
                                name: 'none',
                                input: [{ value: 0 }],
                                expected: ''
                            },
                            {
                                name: 'single',
                                input: [{ value: 1 }],
                                expected: '1 month'
                            },
                            {
                                name: 'multiple',
                                input: [{ value: 123 }],
                                expected: '123 months'
                            }
                        ]
                    },
                    day: {
                        order: '2',
                        display: [
                            {
                                name: 'none',
                                input: [{ value: 0 }],
                                expected: ''
                            },
                            {
                                name: 'single',
                                input: [{ value: 1 }],
                                expected: '1 day'
                            },
                            {
                                name: 'multiple',
                                input: [{ value: 123 }],
                                expected: '123 days'
                            }
                        ]
                    },
                    hour: {
                        order: '3',
                        display: [
                            {
                                name: 'none',
                                input: [{ value: 0 }],
                                expected: ''
                            },
                            {
                                name: 'single',
                                input: [{ value: 1 }],
                                expected: '1 hour'
                            },
                            {
                                name: 'multiple',
                                input: [{ value: 123 }],
                                expected: '123 hours'
                            }
                        ]
                    },
                    minute: {
                        order: '4',
                        display: [
                            {
                                name: 'none',
                                input: [{ value: 0 }],
                                expected: ''
                            },
                            {
                                name: 'single',
                                input: [{ value: 1 }],
                                expected: '1 minute'
                            },
                            {
                                name: 'multiple',
                                input: [{ value: 123 }],
                                expected: '123 minutes'
                            }
                        ]
                    },
                    second: {
                        order: '5',
                        display: [
                            {
                                name: 'none',
                                input: [{ value: 0 }],
                                expected: ''
                            },
                            {
                                name: 'single',
                                input: [{ value: 1 }],
                                expected: '1 second'
                            },
                            {
                                name: 'multiple',
                                input: [{ value: 123 }],
                                expected: '123 seconds'
                            }
                        ]
                    },
                    millisecond: {
                        order: '6',
                        display: [
                            {
                                name: 'none',
                                input: [{ value: 0 }],
                                expected: ''
                            },
                            {
                                name: 'single',
                                input: [{ value: 1 }],
                                expected: '1 millisecond'
                            },
                            {
                                name: 'multiple',
                                input: [{ value: 123 }],
                                expected: '123 milliseconds'
                            }
                        ]
                    }
                }
            }
        },
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
