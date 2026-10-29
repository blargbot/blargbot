import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { BBTagRuntimeError, DiscordPermissions } from '@blargbot/bbtag';
import { EmojiCreateSubtag, type GetMemberPermissionsFeature, type HttpFetchFeature, ReasonSubtag, RoleIdSubtag, SemiSubtag, type VariablesFeature } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';
import { asUint8Array } from '@blargbot/util';

import type { CreateEmojiFeature } from '../../../../src/bbtag/subtags/guild/emojiCreate.js';
import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<VariablesFeature & HttpFetchFeature & CreateEmojiFeature & GetMemberPermissionsFeature>({ id: 'features' });
const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });
const roleIdSubtag = createMockSubtag(RoleIdSubtag);
const reasonSubtag = createMockSubtag(ReasonSubtag);

await runSubtagTests({
    subtag: new EmojiCreateSubtag(features.instance),
    argCountBounds: { min: 2, max: 3 },
    names: ['emojiCreate'],
    otherSubtags: [roleIdSubtag.instance, reasonSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(roleIdSubtag);
        ctx.adoptMock(reasonSubtag);
        features.setup(m => m.variables).returns(variablesProvider.instance);
        reasonSubtag.setup(m => m.get(ctx.bbtag)).resolves('@command.user');
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '23946249762743426',
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.CREATE_GUILD_EXPRESSIONS)
                    .mustHappen(1);
                variables.setup(m => m.get('')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
                features.setup((m, $) => m.createEmoji($({
                    guildId: ctx.guildId,
                    image: new Uint8Array(Buffer.from('abcdef', 'base64')),
                    contentType: 'image/png',
                    name: 'My cool emoji',
                    roles: [],
                    auditReason: '@command.user'
                }))).resolves({ success: true, emojiId: '23946249762743426' }).mustHappen(1);
            }
        },
        {
            code: '{emojicreate;My cool emoji;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            expected: '23946249762743426',
            setup(ctx) {
                const bytes = asUint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf', 'base64'));
                const response = ctx.createMock<Response>({ id: 'response' });
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.CREATE_GUILD_EXPRESSIONS)
                    .mustHappen(1);
                features.setup(m => m.fetch('https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png'))
                    .resolves(response.instance);
                response.setup(m => m.headers).returns(new Headers({
                    'Content-Type': 'image/png'
                }));
                response.setup(m => m.bytes()).resolves(bytes);
                variables.setup(m => m.get('')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
                features.setup((m, $) => m.createEmoji($({
                    guildId: ctx.guildId,
                    image: bytes,
                    contentType: 'image/png',
                    name: 'My cool emoji',
                    roles: [],
                    auditReason: '@command.user'
                }))).resolves({ success: true, emojiId: '23946249762743426' }).mustHappen(1);
            }
        },
        {
            code: '{emojicreate;My cool emoji;https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0}',
            expected: '23946249762743426',
            setup(ctx) {
                const response = ctx.createMock<Response>({ id: 'response' });
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.CREATE_GUILD_EXPRESSIONS)
                    .mustHappen(1);
                features.setup(m => m.fetch('https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0'))
                    .resolves(response.instance);
                response.setup(m => m.headers).returns(new Headers({}));
                response.setup(m => m.bytes()).resolves(new Uint8Array(0));
                variables.setup(m => m.get('')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
                features.setup((m, $) => m.createEmoji($({
                    guildId: ctx.guildId,
                    image: new Uint8Array(0),
                    contentType: 'application/octet-stream',
                    name: 'My cool emoji',
                    roles: [],
                    auditReason: '@command.user'
                }))).resolves({ success: true, emojiId: '23946249762743426' }).mustHappen(1);
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef;["9128735617428916","abc",null]}',
            subtags: [new SemiSubtag()],
            expected: '23946249762743426',
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.CREATE_GUILD_EXPRESSIONS)
                    .mustHappen(1);
                features.setup((m, $) => m.createEmoji($({
                    guildId: ctx.guildId,
                    image: new Uint8Array(Buffer.from('abcdef', 'base64')),
                    contentType: 'image/png',
                    name: 'My cool emoji',
                    roles: ['9128735617428916'],
                    auditReason: '@command.user'
                }))).resolves({ success: true, emojiId: '23946249762743426' }).mustHappen(1);
                roleIdSubtag.setup((m, $) => m.query(ctx.bbtag, '9128735617428916', $({ noLookup: true }))).resolves('9128735617428916').mustHappen(1);
                roleIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'abc', $({ noLookup: true }))).resolves(undefined).mustHappen(1);
                roleIdSubtag.setup((m, $) => m.query(ctx.bbtag, '', $({ noLookup: true }))).resolves(undefined).mustHappen(1);
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Author cannot create emojis`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot create emojis') }
            ],
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.NONE)
                    .mustHappen(1);
            }
        },
        {
            code: '{emojicreate;;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Name was not provided`',
            errors: [
                { error: new BBTagRuntimeError('Name was not provided') }
            ],
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.CREATE_GUILD_EXPRESSIONS)
                    .mustHappen(1);
            }
        },
        {
            code: '{emojicreate;My cool emoji;abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Image was not a buffer or a URL`',
            errors: [
                { error: new BBTagRuntimeError('Image was not a buffer or a URL') }
            ],
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.CREATE_GUILD_EXPRESSIONS)
                    .mustHappen(1);
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to create emoji: This is an error`',
            errors: [
                { error: new BBTagRuntimeError('Failed to create emoji: This is an error') }
            ],
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.CREATE_GUILD_EXPRESSIONS)
                    .mustHappen(1);
                variables.setup(m => m.get('')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
                features.setup((m, $) => m.createEmoji($({
                    guildId: ctx.guildId,
                    image: new Uint8Array(Buffer.from('abcdef', 'base64')),
                    contentType: 'image/png',
                    name: 'My cool emoji',
                    roles: [],
                    auditReason: '@command.user'
                }))).resolves({ success: false, cause: 'This is an error' }).mustHappen(1);
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to create emoji: And this is line 2`',
            errors: [
                { error: new BBTagRuntimeError('Failed to create emoji: And this is line 2') }
            ],
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.CREATE_GUILD_EXPRESSIONS)
                    .mustHappen(1);
                variables.setup(m => m.get('')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
                features.setup((m, $) => m.createEmoji($({
                    guildId: ctx.guildId,
                    image: new Uint8Array(Buffer.from('abcdef', 'base64')),
                    contentType: 'image/png',
                    name: 'My cool emoji',
                    roles: [],
                    auditReason: '@command.user'
                }))).resolves({ success: false, cause: 'And this is line 2' }).mustHappen(1);
            }
        }
    ]
});
