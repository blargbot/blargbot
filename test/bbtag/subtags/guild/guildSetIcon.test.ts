import { BBTagRuntimeError, DiscordPermissions } from '@blargbot/bbtag';
import type { GetMemberPermissionsFeature, HttpFetchFeature, SetGuildIconFeature } from '@blargbot/bbtag/subtags';
import { GuildSetIconSubtag, ReasonSubtag, SemiSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';
import { asUint8Array } from '@blargbot/util';

import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<SetGuildIconFeature & HttpFetchFeature & GetMemberPermissionsFeature>({ id: 'features' });
const reasonSubtag = createMockSubtag(ReasonSubtag);

await runSubtagTests({
    subtag: new GuildSetIconSubtag(features.instance),
    argCountBounds: { min: 1, max: 1 },
    names: ['guildSetIcon'],
    otherSubtags: [reasonSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(reasonSubtag);
        reasonSubtag.setup(m => m.get(ctx.bbtag)).resolves('@command.user');
    },
    cases: [
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '',
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.MANAGE_GUILD)
                    .mustHappen(1);
                features.setup((m, $) => m.setGuildIcon($({
                    guildId: ctx.guildId,
                    image: new Uint8Array(Buffer.from('abcdef', 'base64')),
                    contentType: 'image/png',
                    auditReason: '@command.user'
                }))).resolves({ success: true }).mustHappen(1);
            }
        },
        {
            code: '{guildseticon;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            expected: '',
            setup(ctx) {
                const bytes = asUint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf', 'base64'));
                const response = ctx.createMock<Response>({ id: 'response' });
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.MANAGE_GUILD)
                    .mustHappen(1);
                features.setup(m => m.fetch('https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png'))
                    .resolves(response.instance);
                response.setup(m => m.headers).returns(new Headers({
                    'Content-Type': 'image/png'
                }));
                response.setup(m => m.bytes()).resolves(bytes);
                features.setup((m, $) => m.setGuildIcon($({
                    guildId: ctx.guildId,
                    image: bytes,
                    contentType: 'image/png',
                    auditReason: '@command.user'
                }))).resolves({ success: true }).mustHappen(1);
            }
        },
        {
            code: '{guildseticon;https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0}',
            expected: '',
            setup(ctx) {
                const response = ctx.createMock<Response>({ id: 'response' });
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.MANAGE_GUILD)
                    .mustHappen(1);
                features.setup(m => m.fetch('https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0'))
                    .resolves(response.instance);
                response.setup(m => m.headers).returns(new Headers({}));
                response.setup(m => m.bytes()).resolves(new Uint8Array(0));
                features.setup((m, $) => m.setGuildIcon($({
                    guildId: ctx.guildId,
                    image: new Uint8Array(0),
                    contentType: 'application/octet-stream',
                    auditReason: '@command.user'
                }))).resolves({ success: true }).mustHappen(1);
            }
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Author cannot modify the guild`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot modify the guild') }
            ],
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.NONE)
                    .mustHappen(1);
            }
        },
        {
            code: '{guildseticon;abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Image was not a buffer or a URL`',
            errors: [
                { error: new BBTagRuntimeError('Image was not a buffer or a URL') }
            ],
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.MANAGE_GUILD)
                    .mustHappen(1);
            }
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to set icon: This is an error`',
            errors: [
                { error: new BBTagRuntimeError('Failed to set icon: This is an error') }
            ],
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.MANAGE_GUILD)
                    .mustHappen(1);
                features.setup((m, $) => m.setGuildIcon($({
                    guildId: ctx.guildId,
                    image: new Uint8Array(Buffer.from('abcdef', 'base64')),
                    contentType: 'image/png',
                    auditReason: '@command.user'
                }))).resolves({ success: false, cause: 'This is an error' }).mustHappen(1);
            }
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to set icon: And this is line 2`',
            errors: [
                { error: new BBTagRuntimeError('Failed to set icon: And this is line 2') }
            ],
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.MANAGE_GUILD)
                    .mustHappen(1);
                features.setup((m, $) => m.setGuildIcon($({
                    guildId: ctx.guildId,
                    image: new Uint8Array(Buffer.from('abcdef', 'base64')),
                    contentType: 'image/png',
                    auditReason: '@command.user'
                }))).resolves({ success: false, cause: 'And this is line 2' }).mustHappen(1);
            }
        }
    ]
});
