import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag';
import { KickSubtag } from '@blargbot/bbtag/subtags';
import type * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new KickSubtag(),
    argCountBounds: { min: 1, max: 3 },
    names: ['kick'],
    cases: [
        {
            code: '{kick;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 10, error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'abc'))
                    .mustHappen(1)
                    .resolves([]);
            }
        },
        {
            code: '{kick;other user}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>();
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.kick(member.instance, bbctx.local.message.author, bbctx.local.message.author, 'Tag Kick'))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick users!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>();
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.kick(member.instance, bbctx.local.message.author, bbctx.local.message.author, 'Tag Kick'))
                    .mustHappen(1)
                    .resolves('noPerms');
            }
        },
        {
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick other user!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.username).returns('other user');
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.kick(member.instance, bbctx.local.message.author, bbctx.local.message.author, 'Tag Kick'))
                    .mustHappen(1)
                    .resolves('memberTooHigh');
            }
        },
        {
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick users!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>();
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.kick(member.instance, bbctx.local.message.author, bbctx.local.message.author, 'Tag Kick'))
                    .mustHappen(1)
                    .resolves('moderatorNoPerms');
            }
        },
        {
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick other user!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.username).returns('other user');
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.kick(member.instance, bbctx.local.message.author, bbctx.local.message.author, 'Tag Kick'))
                    .mustHappen(1)
                    .resolves('moderatorTooLow');
            }
        },
        {
            code: '{kick;other user;My reason here}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>();
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.kick(member.instance, bbctx.local.message.author, bbctx.local.message.author, 'My reason here'))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{kick;other user;My reason here;x}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>();
                const authorizer = bbctx.local.message.channel.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.kick(member.instance, bbctx.local.message.author, authorizer, 'My reason here'))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{kick;other user;My reason here;}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>();
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.kick(member.instance, bbctx.local.message.author, bbctx.local.message.author, 'My reason here'))
                    .mustHappen(1)
                    .resolves('success');
            }
        }
    ]
});
