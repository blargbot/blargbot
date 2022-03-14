import { MessageAttachmentsSubtag } from '@blargbot/cluster/subtags/message/messageattachments';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetMessagePropTestCases } from './_getMessagePropTest';

runSubtagTests({
    subtag: new MessageAttachmentsSubtag(),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '[]',
            includeNoArgs: true,
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
        })
    ]
});
