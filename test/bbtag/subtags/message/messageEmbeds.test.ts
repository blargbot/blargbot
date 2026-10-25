import type { GetMessageEmbedsThunk } from '@blargbot/bbtag/subtags';
import { MessageEmbedsSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const getMessageEmbeds = new Mock<GetMessageEmbedsThunk>({ id: 'getMessageEmbeds', callable: true });

await runSubtagTests({
    subtag: new MessageEmbedsSubtag({
        getMessageEmbeds: getMessageEmbeds.instance
    }),
    argCountBounds: { min: 0, max: 3 },
    names: ['messageEmbeds'],
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '[]',
            includeNoArgs: true,
            getProp: (c, i) => getMessageEmbeds.setup(m => m(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['messageembeds', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    title: 'No embeds',
                    expected: '[]',
                    setup(getProp) {
                        getProp.resolves([]).mustHappen(1);
                    }
                },
                {
                    title: '1 embed',
                    expected: '[{"type":"rich","title":"Embed 1"}]',
                    setup(getProp) {
                        getProp.resolves([{
                            type: 'rich',
                            title: 'Embed 1'
                        }]).mustHappen(1);
                    }
                },
                {
                    title: '2 embeds',
                    expected: '[{"type":"rich","title":"Embed 1"},{"type":"rich","title":"Embed 2"}]',
                    setup(getProp) {
                        getProp.resolves([
                            {
                                type: 'rich',
                                title: 'Embed 1'
                            },
                            {
                                type: 'rich',
                                title: 'Embed 2'
                            }
                        ]).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
