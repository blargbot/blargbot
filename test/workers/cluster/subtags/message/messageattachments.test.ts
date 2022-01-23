import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { MessageAttachmentsSubtag } from '@cluster/subtags/message/messageattachments';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetMessagePropTestCases } from './_getMessagePropTest';

runSubtagTests({
    subtag: new MessageAttachmentsSubtag(),
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '[]',
            includeNoMessageId: true,
            generateCode(...args) {
                return `{${['messageattachments', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    title: 'No attachments',
                    expected: '[]'
                },
                {
                    title: '1 attachment',
                    expected: '["12345678900987654432"]',
                    setup(_, message) {
                        message.attachments.push({
                            filename: 'abc.txt',
                            id: '12345678900987654432',
                            proxy_url: 'https://www.google.com/',
                            size: 12345,
                            url: 'https://www.google.com/'
                        });
                    }
                },
                {
                    title: '2 attachments',
                    expected: '["12345678900987654432","9871376826132933"]',
                    setup(_, message) {
                        message.attachments.push(
                            {
                                filename: 'abc.txt',
                                id: '12345678900987654432',
                                proxy_url: 'https://www.google.com/',
                                size: 12345,
                                url: 'https://www.google.com/'
                            },
                            {
                                filename: 'def.png',
                                id: '9871376826132933',
                                proxy_url: 'https://www.google.com/',
                                size: 65453,
                                url: 'https://www.google.com/'
                            }
                        );
                    }
                }
            ]
        }),
        {
            code: '{messageattachments;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 20, end: 26, error: new MarkerError('eval', 20) },
                { start: 27, end: 33, error: new MarkerError('eval', 27) },
                { start: 34, end: 40, error: new MarkerError('eval', 34) },
                { start: 41, end: 47, error: new MarkerError('eval', 41) },
                { start: 0, end: 48, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});
