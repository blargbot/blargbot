import { Subtag } from '@blargbot/bbtag';
import { MessageAttachmentsSubtag } from '@blargbot/bbtag/subtags/message/messageAttachments.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(MessageAttachmentsSubtag),
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
                    expected: '["https://www.google.com/url"]',
                    setup(_, message) {
                        message.attachments.push({
                            filename: 'abc.txt',
                            id: '12345678900987654432',
                            proxy_url: 'https://www.google.com/proxy',
                            size: 12345,
                            url: 'https://www.google.com/url'
                        });
                    }
                },
                {
                    title: '2 attachments',
                    expected: '["https://www.google.com/url","https://www.google.com/url2"]',
                    setup(_, message) {
                        message.attachments.push(
                            {
                                filename: 'abc.txt',
                                id: '12345678900987654432',
                                proxy_url: 'https://www.google.com/proxy',
                                size: 12345,
                                url: 'https://www.google.com/url'
                            },
                            {
                                filename: 'def.png',
                                id: '9871376826132933',
                                proxy_url: 'https://www.google.com/proxy2',
                                size: 65453,
                                url: 'https://www.google.com/url2'
                            }
                        );
                    }
                }
            ]
        })
    ]
});
