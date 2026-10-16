import { UserNotFoundError } from '@blargbot/bbtag';
import type { IsUserStaffThunk } from '@blargbot/bbtag/subtags';
import { IsStaffSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import type * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

const isUserStaff = new Mock<IsUserStaffThunk>({ id: 'isUserStaff', callable: true });

await runSubtagTests({
    subtag: new IsStaffSubtag({
        isUserStaff: isUserStaff.instance
    }),
    argCountBounds: { min: 0, max: 2 },
    names: ['isMod', 'isStaff'],
    setup(ctx) {
        ctx.adoptMock(isUserStaff);
    },
    cases: [
        {
            code: '{isstaff}',
            expected: 'true',
            setup(ctx) {
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff},{isstaff},{isstaff}',
            expected: 'true,true,true',
            setup(ctx) {
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff}',
            expected: 'false',
            setup(ctx) {
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(false)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .resolves([member.instance])
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, userId))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff;other user},{isstaff;other user},{isstaff;other user}',
            expected: 'true,true,true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .resolves([member.instance])
                    .mustHappen(3);
                isUserStaff.setup(m => m(ctx.guild.id, userId))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff;other user}',
            expected: 'false',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .resolves([member.instance])
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, userId))
                    .resolves(false)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff;other user}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('other user') }

            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .resolves([])
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff;other user;}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('other user') }

            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .resolves([])
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff;other user;q}',
            expected: '',
            errors: [
                { error: new UserNotFoundError('other user').withDisplay('') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .resolves([])
                    .mustHappen(1);
            }
        }
    ]
});
