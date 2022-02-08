import { EmojisSubtag } from '@cluster/subtags/guild/emojis';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new EmojisSubtag(),
    argCountBounds: { min: 0, max: 1 },
    setup(ctx) {
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
                const role = bbctx.guild.roles.get('329476274682462386432');
                if (role === undefined)
                    throw new Error('Failes to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.guild, '329476274682462386432')).thenResolve([role]);
            }
        },
        {
            code: '{emojis;other}',
            expected: '["<:rolerestricted:923846723894624242>"]',
            postSetup(bbctx, ctx) {
                const role = bbctx.guild.roles.get('329476274682462386432');
                if (role === undefined)
                    throw new Error('Failes to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.guild, 'other')).thenResolve([role]);
            }
        }
    ]
});
