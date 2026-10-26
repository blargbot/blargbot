import { UserNotFoundError } from '@blargbot/bbtag';
import type { SetMemberNicknameFeature } from '@blargbot/bbtag/subtags';
import { UserIdSubtag, UserSetNickSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<SetMemberNicknameFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new UserSetNickSubtag(features.instance),
    argCountBounds: { min: 1, max: 2 },
    names: ['userSetNickname', 'setNickname', 'setNick', 'userSetNick'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
    },
    cases: [
        {
            code: '{usersetnick;abc}',
            expected: '',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup(m => m.query(bbctx, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberNickname($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    nickname: 'abc',
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true }).mustHappen(1);
            }
        },
        {
            code: '{usersetnick;abc;other user}',
            expected: '',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup(m => m.query(bbctx, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberNickname($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    nickname: 'abc',
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true }).mustHappen(1);
            }
        },
        {
            code: '{usersetnick;abc;blargbot}',
            expected: '',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup(m => m.query(bbctx, 'blargbot', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberNickname($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    nickname: 'abc',
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true }).mustHappen(1);
            }
        },
        {
            code: '{usersetnick;{eval};unknown user}',
            expected: '`No user found`',
            errors: [
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { error: new UserNotFoundError('unknown user') }
            ],
            postSetup(bbctx) {
                userIdSubtag.setup(m => m.query(bbctx, 'unknown user', undefined))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        }
    ]
});
