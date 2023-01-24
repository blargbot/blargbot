import { Subtag } from '@blargbot/bbtag';
import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag/errors/index.js';
import { UnbanSubtag } from '@blargbot/bbtag/subtags/user/unban.js';
import * as Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UnbanSubtag),
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{unban;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 11, error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.getUser('abc'))
                    .verifiable(1)
                    .thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'abc'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        },
        {
            code: '{unban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Eris.Member);
                const user = ctx.createMock(Eris.User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .verifiable(1)
                    .thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, bbctx.user, 'Tag Unban'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{unban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 18, error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Eris.Member);
                const user = ctx.createMock(Eris.User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .verifiable(1)
                    .thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, bbctx.user, 'Tag Unban'))
                    .verifiable(1)
                    .thenResolve('noPerms');
            }
        },
        {
            code: '{unban;other user}',
            expected: 'false',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Eris.Member);
                const user = ctx.createMock(Eris.User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .verifiable(1)
                    .thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, bbctx.user, 'Tag Unban'))
                    .verifiable(1)
                    .thenResolve('notBanned');
            }
        },
        {
            code: '{unban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 18, error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Eris.Member);
                const user = ctx.createMock(Eris.User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .verifiable(1)
                    .thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, bbctx.user, 'Tag Unban'))
                    .verifiable(1)
                    .thenResolve('moderatorNoPerms');
            }
        },
        {
            code: '{unban;other user;My reason here}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Eris.Member);
                const user = ctx.createMock(Eris.User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .verifiable(1)
                    .thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, bbctx.user, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{unban;other user;My reason here;x}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Eris.Member);
                const user = ctx.createMock(Eris.User);
                member.setup(m => m.user).thenReturn(user.instance);
                const authorizer = bbctx.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                ctx.util.setup(m => m.getUser('other user'))
                    .verifiable(1)
                    .thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, authorizer, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{unban;other user;My reason here;}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Eris.Member);
                const user = ctx.createMock(Eris.User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .verifiable(1)
                    .thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, bbctx.user, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        }
    ]
});
