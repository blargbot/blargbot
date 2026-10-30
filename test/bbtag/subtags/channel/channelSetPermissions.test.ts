import { BBTagRuntimeError, DiscordPermissions, PermissionOverwriteType } from '@blargbot/bbtag-engine';
import type { GetMemberPermissionsFeature, SetPermissionOverrideFeature } from '@blargbot/bbtag-engine/subtags';
import { ChannelIdSubtag, ChannelIsThreadSubtag, ChannelSetPermissionsSubtag, ReasonSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GetMemberPermissionsFeature & SetPermissionOverrideFeature>({ id: 'features' });
const channelIdSubtag = createMockSubtag(ChannelIdSubtag);
const channelIsThreadSubtag = createMockSubtag(ChannelIsThreadSubtag);
const reasonSubtag = createMockSubtag(ReasonSubtag);

await runSubtagTests({
    subtag: new ChannelSetPermissionsSubtag(features.instance),
    otherSubtags: [
        channelIdSubtag.instance,
        channelIsThreadSubtag.instance,
        reasonSubtag.instance
    ],
    argCountBounds: { min: 3, max: 5 },
    names: ['channelSetPermissions', 'channelSetPerms'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(channelIdSubtag);
        ctx.adoptMock(channelIsThreadSubtag);
        ctx.adoptMock(reasonSubtag);
        reasonSubtag.setup(m => m.get(ctx.bbtag)).resolves('@command.user');
    },
    cases: [
        ...[
            { label: 'member', type: PermissionOverwriteType.MEMBER },
            { label: 'role', type: PermissionOverwriteType.ROLE }
        ].flatMap(({ label, type }): SubtagTestCase[] => [
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323}`,
                expected: '12835768123756132',
                setup(ctx) {
                    channelIdSubtag.setup(m => m.query(ctx.bbtag, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(ctx.bbtag, '12835768123756132')).resolves(false).mustHappen(1);
                    features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, '12835768123756132')).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
                    features.setup((m, $) => m.setPermissionOverride($({
                        guildId: ctx.guildId,
                        channelId: '12835768123756132',
                        entityId: '12876318236836323',
                        type,
                        auditReason: '@command.user'
                    }))).resolves({ success: true }).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837}`,
                expected: '12835768123756132',
                setup(ctx) {
                    channelIdSubtag.setup(m => m.query(ctx.bbtag, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(ctx.bbtag, '12835768123756132')).resolves(false).mustHappen(1);
                    features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, '12835768123756132')).resolves(DiscordPermissions.NONE.inverse()).mustHappen(1);
                    features.setup((m, $) => m.setPermissionOverride($({
                        guildId: ctx.guildId,
                        channelId: '12835768123756132',
                        entityId: '12876318236836323',
                        type,
                        allow: 129837n,
                        deny: 0n,
                        auditReason: '@command.user'
                    }))).resolves({ success: true }).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;;129837}`,
                expected: '12835768123756132',
                setup(ctx) {
                    channelIdSubtag.setup(m => m.query(ctx.bbtag, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(ctx.bbtag, '12835768123756132')).resolves(false).mustHappen(1);
                    features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, '12835768123756132')).resolves(DiscordPermissions.NONE.inverse()).mustHappen(1);
                    features.setup((m, $) => m.setPermissionOverride($({
                        guildId: ctx.guildId,
                        channelId: '12835768123756132',
                        entityId: '12876318236836323',
                        type,
                        allow: 0n,
                        deny: 129837n,
                        auditReason: '@command.user'
                    }))).resolves({ success: true }).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '12835768123756132',
                setup(ctx) {
                    channelIdSubtag.setup(m => m.query(ctx.bbtag, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(ctx.bbtag, '12835768123756132')).resolves(false).mustHappen(1);
                    features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, '12835768123756132')).resolves(DiscordPermissions.NONE.inverse()).mustHappen(1);
                    features.setup((m, $) => m.setPermissionOverride($({
                        guildId: ctx.guildId,
                        channelId: '12835768123756132',
                        entityId: '12876318236836323',
                        type,
                        allow: 129837n,
                        deny: 832764n,
                        auditReason: '@command.user'
                    }))).resolves({ success: true }).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '`Channel does not exist`',
                errors: [
                    { error: new BBTagRuntimeError('Channel does not exist') }
                ],
                setup(ctx) {
                    channelIdSubtag.setup(m => m.query(ctx.bbtag, '12835768123756132', undefined)).resolves(undefined).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '`Cannot set permissions for a thread channel`',
                errors: [
                    { error: new BBTagRuntimeError('Cannot set permissions for a thread channel') }
                ],
                setup(ctx) {
                    channelIdSubtag.setup(m => m.query(ctx.bbtag, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(ctx.bbtag, '12835768123756132')).resolves(true).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '`Author cannot edit this channel`',
                errors: [
                    { error: new BBTagRuntimeError('Author cannot edit this channel') }
                ],
                setup(ctx) {
                    channelIdSubtag.setup(m => m.query(ctx.bbtag, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(ctx.bbtag, '12835768123756132')).resolves(false).mustHappen(1);
                    features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, '12835768123756132')).resolves(DiscordPermissions.NONE).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '`Author missing requested permissions`',
                errors: [
                    { error: new BBTagRuntimeError('Author missing requested permissions') }
                ],
                setup(ctx) {
                    channelIdSubtag.setup(m => m.query(ctx.bbtag, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(ctx.bbtag, '12835768123756132')).resolves(false).mustHappen(1);
                    features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, '12835768123756132')).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '`Failed to edit channel: no perms`',
                errors: [
                    { error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Test REST error') }
                ],
                setup(ctx) {
                    channelIdSubtag.setup(m => m.query(ctx.bbtag, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(ctx.bbtag, '12835768123756132')).resolves(false).mustHappen(1);
                    features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, '12835768123756132')).resolves(DiscordPermissions.NONE.inverse()).mustHappen(1);
                    features.setup((m, $) => m.setPermissionOverride($({
                        guildId: ctx.guildId,
                        channelId: '12835768123756132',
                        entityId: '12876318236836323',
                        type,
                        allow: 129837n,
                        deny: 832764n,
                        auditReason: '@command.user'
                    }))).resolves({ success: false, reason: 'Test REST error' }).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '`Failed to edit channel: no perms`',
                errors: [
                    { error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Some other error message') }
                ],
                setup(ctx) {
                    channelIdSubtag.setup(m => m.query(ctx.bbtag, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(ctx.bbtag, '12835768123756132')).resolves(false).mustHappen(1);
                    features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, '12835768123756132')).resolves(DiscordPermissions.NONE.inverse()).mustHappen(1);
                    features.setup((m, $) => m.setPermissionOverride($({
                        guildId: ctx.guildId,
                        channelId: '12835768123756132',
                        entityId: '12876318236836323',
                        type,
                        allow: 129837n,
                        deny: 832764n,
                        auditReason: '@command.user'
                    }))).resolves({ success: false, reason: 'Some other error message' }).mustHappen(1);
                }
            }
        ]),
        {
            code: '{channelsetperms;12835768123756132;abc;12876318236836323;129837;832764}',
            expected: '`Type must be member or role`',
            errors: [
                { error: new BBTagRuntimeError('Type must be member or role') }
            ],
            setup(ctx) {
                channelIdSubtag.setup(m => m.query(ctx.bbtag, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                channelIsThreadSubtag.setup(m => m.check(ctx.bbtag, '12835768123756132')).resolves(false).mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, '12835768123756132')).resolves(DiscordPermissions.NONE.inverse()).mustHappen(1);
            }
        }
    ]
});
