import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { GetChannelCategoryFeature } from '@blargbot/bbtag/subtags';
import { ChannelCategorySubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const features = new Mock<GetChannelCategoryFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ChannelCategorySubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelCategory', 'category'],
    setup(ctx) {
        ctx.adoptMock(features);
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
                        features.setup(m => m.getChannelCategory(ctx.guild.id, channelId)).resolves('8237642839674943').mustHappen(1);
                    }
                },
                {
                    expected: '',
                    error: new BBTagRuntimeError('Channel has no parent').withDisplay(''),
                    setup(channelId, ctx) {
                        features.setup(m => m.getChannelCategory(ctx.guild.id, channelId)).resolves(undefined).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
