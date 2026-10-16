import { WarnSubtag } from '@blargbot/bbtag/subtags';
import type * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new WarnSubtag(),
    argCountBounds: { min: 0, max: 3 },
    names: ['warn'],
    cases: [
        {
            code: '{warn}',
            expected: '1',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.warn(bbctx.local.message.member, bbctx.local.message.author, 1, 'Tag Warning'))
                    .mustHappen(1)
                    .resolves(1);
            }
        },
        {
            code: '{warn}',
            expected: '7',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.warn(bbctx.local.message.member, bbctx.local.message.author, 1, 'Tag Warning'))
                    .mustHappen(1)
                    .resolves(7);
            }
        },
        {
            code: '{warn;}',
            expected: '2',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.warn(bbctx.local.message.member, bbctx.local.message.author, 1, 'Tag Warning'))
                    .mustHappen(1)
                    .resolves(2);
            }
        },
        {
            code: '{warn;other user}',
            expected: '5',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.warn(member.instance, bbctx.local.message.author, 1, 'Tag Warning'))
                    .mustHappen(1)
                    .resolves(5);
            }
        },
        {
            code: '{warn;;6}',
            expected: '29',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.warn(bbctx.local.message.member, bbctx.local.message.author, 6, 'Tag Warning'))
                    .mustHappen(1)
                    .resolves(29);
            }
        },
        {
            code: '{warn;other user;9}',
            expected: '9',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.warn(member.instance, bbctx.local.message.author, 9, 'Tag Warning'))
                    .mustHappen(1)
                    .resolves(9);
            }
        },
        {
            code: '{warn;;;My custom reason}',
            expected: '16',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.warn(bbctx.local.message.member, bbctx.local.message.author, 1, 'My custom reason'))
                    .mustHappen(1)
                    .resolves(16);
            }
        },
        {
            code: '{warn;other user;6;My custom reason}',
            expected: '22',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.warn(member.instance, bbctx.local.message.author, 6, 'My custom reason'))
                    .mustHappen(1)
                    .resolves(22);
            }
        }
    ]
});
