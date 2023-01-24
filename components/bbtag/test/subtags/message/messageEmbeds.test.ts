import { Subtag } from '@blargbot/bbtag';
import { MessageEmbedsSubtag } from '@blargbot/bbtag/subtags/message/messageEmbeds.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(MessageEmbedsSubtag),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '[]',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['messageembeds', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    title: 'No embeds',
                    expected: '[]'
                },
                {
                    title: '1 embed',
                    expected: '[{"title":"Embed 1"}]',
                    setup(_, message) {
                        message.embeds.push({
                            title: 'Embed 1'
                        });
                    }
                },
                {
                    title: '2 embeds',
                    expected: '[{"title":"Embed 1"},{"title":"Embed 2"}]',
                    setup(_, message) {
                        message.embeds.push(
                            {
                                title: 'Embed 1'
                            },
                            {
                                title: 'Embed 2'
                            }
                        );
                    }
                }
            ]
        })
    ]
});
