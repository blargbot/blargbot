import type { GetMemberNicknameFeature, GetUserNameFeature, GetUserNicknameFeature } from '@blargbot/bbtag/subtags';
import { UserNicknameSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<GetMemberNicknameFeature & GetUserNicknameFeature & GetUserNameFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new UserNicknameSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['userNickname', 'userNick'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['usernick', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'cooldood69',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberNickname(ctx.guild.id, userId))
                            .resolves('cooldood69')
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'aaaaaaaa',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberNickname(ctx.guild.id, userId))
                            .resolves(undefined)
                            .mustHappen(1);
                        features.setup(m => m.getUserNickname(userId))
                            .resolves('aaaaaaaa')
                            .mustHappen(1);
                    }
                },
                {
                    queryString: '123456789098765432',
                    expected: 'nice',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberNickname(ctx.guild.id, userId))
                            .resolves(undefined)
                            .mustHappen(1);
                        features.setup(m => m.getUserNickname(userId))
                            .resolves(undefined)
                            .mustHappen(1);
                        features.setup(m => m.getUserName(userId))
                            .resolves('nice')
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});
