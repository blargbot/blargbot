import type { ListEmojisFeature } from '@blargbot/bbtag/subtags';
import { EmojisSubtag, RoleIdSubtag } from '@blargbot/bbtag/subtags';
import Emote from '@blargbot/discord-emote';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<ListEmojisFeature>({ id: 'features' });
const roleIdSubtag = new Mock<RoleIdSubtag>({ id: 'RoleIdSubtag' });

await runSubtagTests({
    subtag: new EmojisSubtag(features.instance),
    argCountBounds: { min: 0, max: 1 },
    names: ['emojis'],
    otherSubtags: [roleIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(roleIdSubtag, { type: RoleIdSubtag });
    },
    cases: [
        {
            code: '{emojis}',
            expected: '["<a:abc:2379864824733908429>","<:notlikecat:280110565161041921>","<:rolerestricted:923846723894624242>"]',
            setup(ctx) {
                features.setup(m => m.listEmojis(ctx.guildId))
                    .resolves([
                        new Emote('abc', 2379864824733908429n, true),
                        new Emote('notlikecat', 280110565161041921n, false),
                        new Emote('rolerestricted', 923846723894624242n, false)
                    ]).mustHappen(1);
            }
        },
        {
            code: '{emojis;329476274682462386432}',
            expected: '["<:rolerestricted:923846723894624242>"]',
            postSetup(bbctx, ctx) {
                roleIdSubtag.setup((m, $) => m.query(bbctx, '329476274682462386432', $({ noErrors: true, noLookup: true })))
                    .resolves('329476274682462386432')
                    .mustHappen(1);
                features.setup(m => m.listEmojis(ctx.guildId, '329476274682462386432'))
                    .resolves([
                        new Emote('rolerestricted', 923846723894624242n, false)
                    ]).mustHappen(1);
            }
        },
        {
            code: '{emojis;other}',
            expected: '["<:rolerestricted:923846723894624242>"]',
            postSetup(bbctx, ctx) {
                roleIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true })))
                    .resolves('329476274682462386432')
                    .mustHappen(1);
                features.setup(m => m.listEmojis(ctx.guildId, '329476274682462386432'))
                    .resolves([
                        new Emote('rolerestricted', 923846723894624242n, false)
                    ]).mustHappen(1);
            }
        }
    ]
});
