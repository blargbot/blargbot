import { Subtag } from '@blargbot/bbtag';
import { EmojisSubtag } from '@blargbot/bbtag/subtags';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(EmojisSubtag),
    argCountBounds: { min: 0, max: 1 },
    setupEach(ctx) {
        ctx.roles.other.id = '329476274682462386432';
        ctx.guild.emojis.push(
            {
                id: '237986482473',
                name: 'abc',
                animated: true
            },
            {
                id: '280110565161041921',
                name: 'notlikecat'
            },
            {
                id: '923846723894624242',
                name: 'rolerestricted',
                animated: false,
                roles: [
                    '329476274682462386432'
                ]
            }
        );
    },
    cases: [
        {
            code: '{emojis}',
            expected: '["<a:abc:237986482473>","<:notlikecat:280110565161041921>","<:rolerestricted:923846723894624242>"]'
        },
        {
            code: '{emojis;329476274682462386432}',
            expected: '["<:rolerestricted:923846723894624242>"]',
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, '329476274682462386432', argument.isDeepEqual({ noErrors: true, noLookup: true }))).thenResolve(ctx.roles.other);
            }
        },
        {
            code: '{emojis;other}',
            expected: '["<:rolerestricted:923846723894624242>"]',
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noErrors: true, noLookup: true }))).thenResolve(ctx.roles.other);
            }
        }
    ]
});
