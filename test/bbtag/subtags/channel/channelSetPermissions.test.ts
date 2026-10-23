import { BBTagRuntimeError, DiscordPermissions, PermissionOverwriteType } from '@blargbot/bbtag';
import type { GetUserPermissionsThunk, SetPermissionOverrideThunk } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, ChannelIsThreadSubtag, ChannelSetPermissionsSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const getUserPermissions = new Mock<GetUserPermissionsThunk>({ id: 'getUserPermissions', callable: true });
const setPermissionOverride = new Mock<SetPermissionOverrideThunk>({ id: 'setPermissionOverride', callable: true });
const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'channelIdSubtag' });
const channelIsThreadSubtag = new Mock<ChannelIsThreadSubtag>({ id: 'channelIdSubtag' });

await runSubtagTests({
    subtag: new ChannelSetPermissionsSubtag({
        getUserPermissions: getUserPermissions.instance,
        setPermissionOverride: setPermissionOverride.instance
    }),
    otherSubtags: [
        channelIdSubtag.instance,
        channelIsThreadSubtag.instance
    ],
    argCountBounds: { min: 3, max: 5 },
    names: ['channelSetPermissions', 'channelSetPerms'],
    setup(ctx) {
        ctx.adoptMock(getUserPermissions);
        ctx.adoptMock(setPermissionOverride);
        ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
        ctx.adoptSubtagMock(channelIsThreadSubtag, { type: ChannelIsThreadSubtag });
    },
    cases: [
        ...[
            { label: 'member', type: PermissionOverwriteType.MEMBER },
            { label: 'role', type: PermissionOverwriteType.ROLE }
        ].flatMap(({ label, type }): SubtagTestCase[] => [
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323}`,
                expected: '12835768123756132',
                postSetup(bbctx, ctx) {
                    channelIdSubtag.setup(m => m.query(bbctx, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(bbctx, '12835768123756132')).resolves(false).mustHappen(1);
                    getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '12835768123756132')).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
                    setPermissionOverride.setup((m, $) => m($({
                        guildId: ctx.guild.id,
                        channelId: '12835768123756132',
                        entityId: '12876318236836323',
                        type,
                        auditReason: 'Command User#0000'
                    }))).resolves({ success: true }).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837}`,
                expected: '12835768123756132',
                postSetup(bbctx, ctx) {
                    channelIdSubtag.setup(m => m.query(bbctx, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(bbctx, '12835768123756132')).resolves(false).mustHappen(1);
                    getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '12835768123756132')).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                    setPermissionOverride.setup((m, $) => m($({
                        guildId: ctx.guild.id,
                        channelId: '12835768123756132',
                        entityId: '12876318236836323',
                        type,
                        allow: 129837n,
                        deny: 0n,
                        auditReason: 'Command User#0000'
                    }))).resolves({ success: true }).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;;129837}`,
                expected: '12835768123756132',
                postSetup(bbctx, ctx) {
                    channelIdSubtag.setup(m => m.query(bbctx, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(bbctx, '12835768123756132')).resolves(false).mustHappen(1);
                    getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '12835768123756132')).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                    setPermissionOverride.setup((m, $) => m($({
                        guildId: ctx.guild.id,
                        channelId: '12835768123756132',
                        entityId: '12876318236836323',
                        type,
                        allow: 0n,
                        deny: 129837n,
                        auditReason: 'Command User#0000'
                    }))).resolves({ success: true }).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '12835768123756132',
                postSetup(bbctx, ctx) {
                    channelIdSubtag.setup(m => m.query(bbctx, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(bbctx, '12835768123756132')).resolves(false).mustHappen(1);
                    getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '12835768123756132')).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                    setPermissionOverride.setup((m, $) => m($({
                        guildId: ctx.guild.id,
                        channelId: '12835768123756132',
                        entityId: '12876318236836323',
                        type,
                        allow: 129837n,
                        deny: 832764n,
                        auditReason: 'Command User#0000'
                    }))).resolves({ success: true }).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '`Channel does not exist`',
                errors: [
                    { error: new BBTagRuntimeError('Channel does not exist') }
                ],
                postSetup(bbctx) {
                    channelIdSubtag.setup(m => m.query(bbctx, '12835768123756132', undefined)).resolves(undefined).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '`Cannot set permissions for a thread channel`',
                errors: [
                    { error: new BBTagRuntimeError('Cannot set permissions for a thread channel') }
                ],
                postSetup(bbctx) {
                    channelIdSubtag.setup(m => m.query(bbctx, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(bbctx, '12835768123756132')).resolves(true).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '`Author cannot edit this channel`',
                errors: [
                    { error: new BBTagRuntimeError('Author cannot edit this channel') }
                ],
                postSetup(bbctx, ctx) {
                    channelIdSubtag.setup(m => m.query(bbctx, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(bbctx, '12835768123756132')).resolves(false).mustHappen(1);
                    getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '12835768123756132')).resolves(DiscordPermissions.NONE).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '`Author missing requested permissions`',
                errors: [
                    { error: new BBTagRuntimeError('Author missing requested permissions') }
                ],
                postSetup(bbctx, ctx) {
                    channelIdSubtag.setup(m => m.query(bbctx, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(bbctx, '12835768123756132')).resolves(false).mustHappen(1);
                    getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '12835768123756132')).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '`Failed to edit channel: no perms`',
                errors: [
                    { error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Test REST error') }
                ],
                postSetup(bbctx, ctx) {
                    channelIdSubtag.setup(m => m.query(bbctx, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(bbctx, '12835768123756132')).resolves(false).mustHappen(1);
                    getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '12835768123756132')).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                    setPermissionOverride.setup((m, $) => m($({
                        guildId: ctx.guild.id,
                        channelId: '12835768123756132',
                        entityId: '12876318236836323',
                        type,
                        allow: 129837n,
                        deny: 832764n,
                        auditReason: 'Command User#0000'
                    }))).resolves({ success: false, reason: 'Test REST error' }).mustHappen(1);
                }
            },
            {
                code: `{channelsetperms;12835768123756132;${label};12876318236836323;129837;832764}`,
                expected: '`Failed to edit channel: no perms`',
                errors: [
                    { error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Some other error message') }
                ],
                postSetup(bbctx, ctx) {
                    channelIdSubtag.setup(m => m.query(bbctx, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                    channelIsThreadSubtag.setup(m => m.check(bbctx, '12835768123756132')).resolves(false).mustHappen(1);
                    getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '12835768123756132')).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                    setPermissionOverride.setup((m, $) => m($({
                        guildId: ctx.guild.id,
                        channelId: '12835768123756132',
                        entityId: '12876318236836323',
                        type,
                        allow: 129837n,
                        deny: 832764n,
                        auditReason: 'Command User#0000'
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
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '12835768123756132', undefined)).resolves('12835768123756132').mustHappen(1);
                channelIsThreadSubtag.setup(m => m.check(bbctx, '12835768123756132')).resolves(false).mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '12835768123756132')).resolves(new DiscordPermissions(~0n)).mustHappen(1);
            }
        }
    ]
});
