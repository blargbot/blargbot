import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { MessageEmbedsSubtag } from '@cluster/subtags/message/messageembeds';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetMessagePropTestCases } from './_getMessagePropTest';

runSubtagTests({
    subtag: new MessageEmbedsSubtag(),
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '[]',
            includeNoMessageId: true,
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
        }),
        {
            code: '{messageembeds;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 15, end: 21, error: new MarkerError('eval', 15) },
                { start: 22, end: 28, error: new MarkerError('eval', 22) },
                { start: 29, end: 35, error: new MarkerError('eval', 29) },
                { start: 36, end: 42, error: new MarkerError('eval', 36) },
                { start: 0, end: 43, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});
