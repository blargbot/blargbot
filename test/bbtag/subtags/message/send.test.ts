import assert from 'node:assert/strict';

import { BBTagRuntimeError, ChannelNotFoundError } from '@blargbot/bbtag-engine';
import type { CanPingEveryoneFeature, SendFeature } from '@blargbot/bbtag-engine/subtags';
import { ChannelIdSubtag, ChannelIsNsfwSubtag, ChannelIsTextSubtag, EscapeBBTagSubtag, SendSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<CanPingEveryoneFeature & SendFeature>({ id: 'features' });
const channelIdSubtag = createMockSubtag(ChannelIdSubtag);
const channelIsTextSubtag = createMockSubtag(ChannelIsTextSubtag);
const channelIsNsfwSubtag = createMockSubtag(ChannelIsNsfwSubtag);

await runSubtagTests({
    subtag: new SendSubtag(features.instance),
    argCountBounds: { min: 2, max: 5 },
    names: ['send'],
    otherSubtags: [channelIdSubtag.instance, channelIsTextSubtag.instance, channelIsNsfwSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(channelIdSubtag);
        ctx.adoptMock(channelIsTextSubtag);
        ctx.adoptMock(channelIsNsfwSubtag);
    },
    cases: [
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`No channel found`',
            errors: [
                { error: new ChannelNotFoundError('1923681361978632931') }
            ],
            setup(ctx) {
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(undefined).mustHappen(1);
            }
        },
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`Failed to send: Test error`',
            errors: [
                { error: new BBTagRuntimeError('Failed to send: Test error') }
            ],
            setup(ctx) {
                ctx.isCC = false;
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: false, reason: 'Test error' });
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.ownedMessageIds.size, 1);
            }
        },
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`Failed to send: UNKNOWN`',
            errors: [
                { error: new BBTagRuntimeError('Failed to send: UNKNOWN') }
            ],
            setup(ctx) {
                ctx.isCC = false;
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: false, reason: 'UNKNOWN' });
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.ownedMessageIds.size, 1);
            }
        },
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`Send unsuccessful`',
            errors: [
                { error: new BBTagRuntimeError('Send unsuccessful') }
            ],
            setup(ctx) {
                ctx.isCC = false;
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: false });
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.ownedMessageIds.size, 1);
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc}',
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = true;
                features.setup(m => m.canPingEveryone(ctx.guildId)).resolves(true).mustHappen(1);
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowedMentions: {
                        everyone: true,
                        roles: new Set(roleMentions),
                        users: new Set(userMentions)
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = true;
                features.setup(m => m.canPingEveryone(ctx.guildId)).resolves(true).mustHappen(1);
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: undefined,
                    embeds: [{ title: 'New embed!' }],
                    files: undefined,
                    allowedMentions: {
                        everyone: true,
                        roles: new Set(roleMentions),
                        users: new Set(userMentions)
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc}',
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = false;
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = false;
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: undefined,
                    embeds: [{ title: 'New embed!' }],
                    files: undefined,
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = true;
                features.setup(m => m.canPingEveryone(ctx.guildId)).resolves(true).mustHappen(1);
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: undefined,
                    allowedMentions: {
                        everyone: true,
                        roles: new Set(roleMentions),
                        users: new Set(userMentions)
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = false;
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: undefined,
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = true;
                features.setup(m => m.canPingEveryone(ctx.guildId)).resolves(true).mustHappen(1);
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{ file: Buffer.from('my file content'), name: 'file.txt' }],
                    allowedMentions: {
                        everyone: true,
                        roles: new Set(roleMentions),
                        users: new Set(userMentions)
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = false;
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{ file: Buffer.from('my file content'), name: 'file.txt' }],
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = true;
                features.setup(m => m.canPingEveryone(ctx.guildId)).resolves(true).mustHappen(1);
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{
                        file: $.asserts(value => {
                            const actual = Buffer.from(value).toString();
                            const expected = Buffer.from([0x69, 0xb7, 0x1d, 0x79]).toString();
                            assert.equal(actual, expected);
                        }),
                        name: 'file.txt'
                    }],
                    allowedMentions: {
                        everyone: true,
                        roles: new Set(roleMentions),
                        users: new Set(userMentions)
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = false;
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{
                        file: $.asserts(value => {
                            const actual = Buffer.from(value).toString();
                            const expected = Buffer.from([0x69, 0xb7, 0x1d, 0x79]).toString();
                            assert.equal(actual, expected);
                        }),
                        name: 'file.txt'
                    }],
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content;test.zip}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = true;
                features.setup(m => m.canPingEveryone(ctx.guildId)).resolves(true).mustHappen(1);
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{ file: Buffer.from('my file content'), name: 'test.zip' }],
                    allowedMentions: {
                        everyone: true,
                        roles: new Set(roleMentions),
                        users: new Set(userMentions)
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content;test.zip}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = false;
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{ file: Buffer.from('my file content'), name: 'test.zip' }],
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef;test.zip}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = true;
                features.setup(m => m.canPingEveryone(ctx.guildId)).resolves(true).mustHappen(1);
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{
                        file: $.asserts(value => {
                            const actual = Buffer.from(value).toString();
                            const expected = Buffer.from([0x69, 0xb7, 0x1d, 0x79]).toString();
                            assert.equal(actual, expected);
                        }),
                        name: 'test.zip'
                    }],
                    allowedMentions: {
                        everyone: true,
                        roles: new Set(roleMentions),
                        users: new Set(userMentions)
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef;test.zip}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = false;
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{
                        file: $.asserts(value => {
                            const actual = Buffer.from(value).toString();
                            const expected = Buffer.from([0x69, 0xb7, 0x1d, 0x79]).toString();
                            assert.equal(actual, expected);
                        }),
                        name: 'test.zip'
                    }],
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'NSFW is set & channel is not nsfw',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef;test.zip}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = false;
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.output.nsfw = 'This is a nsfw message';
                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                channelIsNsfwSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(false).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'This is a nsfw message',
                    embeds: undefined,
                    files: undefined,
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'NSFW is set & channel is nsfw',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef;test.zip}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.isCC = false;
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const channelId = `otherChannel<${createSnowflake()}>`;

                ctx.bbtag.root.output.nsfw = 'This is a nsfw message';
                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1923681361978632931', $({ noLookup: true }))).resolves(channelId).mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                channelIsNsfwSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{
                        file: $.asserts(value => {
                            const actual = Buffer.from(value).toString();
                            const expected = Buffer.from([0x69, 0xb7, 0x1d, 0x79]).toString();
                            assert.equal(actual, expected);
                        }),
                        name: 'test.zip'
                    }],
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: true, id: '239476239742340234' });
            },
            assert(ctx) {
                assert(ctx.bbtag.root.ownedMessageIds.has('239476239742340234'));
            }
        }
    ]
});
