import { UserNotFoundError } from '@blargbot/bbtag-engine';
import type { SetMemberNicknameFeature } from '@blargbot/bbtag-engine/subtags';
import { ReasonSubtag, UserIdSubtag, UserSetNickSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<SetMemberNicknameFeature>({ id: 'features' });
const userIdSubtag = createMockSubtag(UserIdSubtag);
const reasonSubtag = createMockSubtag(ReasonSubtag);

await runSubtagTests({
    subtag: new UserSetNickSubtag(features.instance),
    argCountBounds: { min: 1, max: 2 },
    names: ['userSetNickname', 'setNickname', 'setNick', 'userSetNick'],
    otherSubtags: [userIdSubtag.instance, reasonSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(userIdSubtag);
        ctx.adoptMock(reasonSubtag);
        reasonSubtag.setup(m => m.get(ctx.bbtag)).resolves('@command.user');
    },
    cases: [
        {
            code: '{usersetnick;abc}',
            expected: '',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberNickname($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    nickname: 'abc',
                    auditReason: '@command.user'
                }))).resolves({ success: true }).mustHappen(1);
            }
        },
        {
            code: '{usersetnick;abc;other user}',
            expected: '',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberNickname($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    nickname: 'abc',
                    auditReason: '@command.user'
                }))).resolves({ success: true }).mustHappen(1);
            }
        },
        {
            code: '{usersetnick;abc;blargbot}',
            expected: '',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'blargbot', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberNickname($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    nickname: 'abc',
                    auditReason: '@command.user'
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
            setup(ctx) {
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'unknown user', undefined))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        }
    ]
});
