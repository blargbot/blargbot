import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { GetChannelCategoryThunk } from '@blargbot/bbtag/subtags';
import { ChannelCategorySubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const getChannelCategory = new Mock<GetChannelCategoryThunk>({ id: 'getChannelCategory', callable: true });

await runSubtagTests({
    subtag: new ChannelCategorySubtag({
        getChannelCategory: getChannelCategory.instance
    }),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelCategory', 'category'],
    setup(ctx) {
        ctx.adoptMock(getChannelCategory);
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelcategory', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '8237642839674943',
                    setup(channelId, ctx) {
                        getChannelCategory.setup(m => m(ctx.guild.id, channelId)).resolves('8237642839674943').mustHappen(1);
                    }
                },
                {
                    expected: '',
                    error: new BBTagRuntimeError('Channel has no parent').withDisplay(''),
                    setup(channelId, ctx) {
                        getChannelCategory.setup(m => m(ctx.guild.id, channelId)).resolves(undefined).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
