import type { GetUserAvatarUrlFeature } from '@blargbot/bbtag/subtags';
import { UserAvatarSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<GetUserAvatarUrlFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new UserAvatarSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['userAvatar'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup, global: true }),
            generateCode(...args) {
                return `{${['useravatar', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'https://cdn.discordapp.com/avatars/12345678912345678/a1b2c3.png?size=512',
                    setup(userId) {
                        features.setup(m => m.getUserAvatarUrl(userId))
                            .resolves(new URL('https://cdn.discordapp.com/avatars/12345678912345678/a1b2c3.png?size=512'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/avatars/12345678912345678/a_a1b2c3.gif?size=512',
                    setup(userId) {
                        features.setup(m => m.getUserAvatarUrl(userId))
                            .resolves(new URL('https://cdn.discordapp.com/avatars/12345678912345678/a_a1b2c3.gif?size=512'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/guilds/87654321987654321/users/12345678912345678/avatars/a1b2c3.png?size=512',
                    setup(userId) {
                        features.setup(m => m.getUserAvatarUrl(userId))
                            .resolves(new URL('https://cdn.discordapp.com/guilds/87654321987654321/users/12345678912345678/avatars/a1b2c3.png?size=512'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/guilds/87654321987654321/users/12345678912345678/avatars/a_a1b2c3.gif?size=512',
                    setup(userId) {
                        features.setup(m => m.getUserAvatarUrl(userId))
                            .resolves(new URL('https://cdn.discordapp.com/guilds/87654321987654321/users/12345678912345678/avatars/a_a1b2c3.gif?size=512'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/embed/avatars/4.png',
                    setup(userId) {
                        features.setup(m => m.getUserAvatarUrl(userId))
                            .resolves(new URL('https://cdn.discordapp.com/embed/avatars/4.png'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/embed/avatars/2.png',
                    setup(userId) {
                        features.setup(m => m.getUserAvatarUrl(userId))
                            .resolves(new URL('https://cdn.discordapp.com/embed/avatars/2.png'))
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});
