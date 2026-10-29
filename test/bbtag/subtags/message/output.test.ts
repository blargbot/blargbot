import assert from 'node:assert/strict';

import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { AddReactionsFeature, CanPingEveryoneFeature, SendFeature } from '@blargbot/bbtag/subtags';
import { ChannelIsNsfwSubtag, OutputSubtag } from '@blargbot/bbtag/subtags';
import Emote from '@blargbot/discord-emote';
import { Mock } from '@blargbot/test-util';

import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const emotes = [Emote.parse('<a:test:120272372032032937>'), Emote.parse('<:alsoatest:23094632472398746234>'), Emote.parse('🤔')];
const features = new Mock<AddReactionsFeature & CanPingEveryoneFeature & SendFeature>({ id: 'features' });
const channelIsNsfwSubtag = createMockSubtag(ChannelIsNsfwSubtag);

await runSubtagTests({
    subtag: new OutputSubtag(features.instance),
    argCountBounds: { min: 0, max: 1 },
    names: ['output'],
    otherSubtags: [channelIsNsfwSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(channelIsNsfwSubtag);
    },
    cases: [
        {
            title: 'Custom command',
            code: '{output}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.isCC = true;
                features.setup(m => m.canPingEveryone(ctx.guildId)).resolves(true).mustHappen(1);
                const embeds = [{ title: 'abc' }];
                const files = [{ file: Buffer.from('test content'), name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];

                ctx.bbtag.root.output.embeds = embeds;
                ctx.bbtag.root.output.files = files;
                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));
                ctx.bbtag.root.output.reactions.push(...emotes.map(m => m.toString()));

                features.setup((m, $) => m.addMessageReactions(ctx.channelId, '0987654331234567', $(emotes))).resolves({ success: emotes, failed: [] });
                features.setup((m, $) => m.sendMessage(ctx.channelId, $({
                    content: '',
                    embeds: embeds,
                    files: files,
                    allowedMentions: {
                        everyone: true,
                        roles: new Set(roleMentions),
                        users: new Set(userMentions)
                    }
                }))).resolves({ success: true, id: '0987654331234567' });
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'Tag command',
            code: '{output}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.isCC = false;
                const embeds = [{ title: 'abc' }];
                const files = [{ file: Buffer.from('test content'), name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];

                ctx.bbtag.root.output.embeds = embeds;
                ctx.bbtag.root.output.files = files;
                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));
                ctx.bbtag.root.output.reactions.push(...emotes.map(m => m.toString()));

                features.setup((m, $) => m.addMessageReactions(ctx.channelId, '0987654331234567', $(emotes))).resolves({ success: emotes, failed: [] });
                features.setup((m, $) => m.sendMessage(ctx.channelId, $({
                    content: '',
                    embeds: embeds,
                    files: files,
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: true, id: '0987654331234567' });
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'Custom command',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.isCC = true;
                features.setup(m => m.canPingEveryone(ctx.guildId)).resolves(true).mustHappen(1);
                const embeds = [{ title: 'abc' }];
                const files = [{ file: Buffer.from('test content'), name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];

                ctx.bbtag.root.output.embeds = embeds;
                ctx.bbtag.root.output.files = files;
                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));
                ctx.bbtag.root.output.reactions.push(...emotes.map(m => m.toString()));

                features.setup((m, $) => m.addMessageReactions(ctx.channelId, '0987654331234567', $(emotes))).resolves({ success: emotes, failed: [] });
                features.setup((m, $) => m.sendMessage(ctx.channelId, $({
                    content: 'This is my message content',
                    embeds: embeds,
                    files: files,
                    allowedMentions: {
                        everyone: true,
                        roles: new Set(roleMentions),
                        users: new Set(userMentions)
                    }
                }))).resolves({ success: true, id: '0987654331234567' });
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'Tag command',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.isCC = false;
                const embeds = [{ title: 'abc' }];
                const files = [{ file: Buffer.from('test content'), name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];

                ctx.bbtag.root.output.embeds = embeds;
                ctx.bbtag.root.output.files = files;
                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));
                ctx.bbtag.root.output.reactions.push(...emotes.map(m => m.toString()));

                features.setup((m, $) => m.addMessageReactions(ctx.channelId, '0987654331234567', $(emotes))).resolves({ success: emotes, failed: [] });
                features.setup((m, $) => m.sendMessage(ctx.channelId, $({
                    content: 'This is my message content',
                    embeds: embeds,
                    files: files,
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: true, id: '0987654331234567' });
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'Tag command minimal',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.isCC = false;
                ctx.bbtag.root.output.embeds = undefined;
                ctx.bbtag.root.output.files = undefined;
                ctx.bbtag.root.allowedMentions.everybody = false;
                ctx.bbtag.root.output.nsfw = undefined;

                features.setup((m, $) => m.addMessageReactions(ctx.channelId, '0987654331234567', $([]))).resolves({ success: [], failed: [] });
                features.setup((m, $) => m.sendMessage(ctx.channelId, $({
                    content: 'This is my message content',
                    embeds: undefined,
                    files: undefined,
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: true, id: '0987654331234567' });
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'Output already sent',
            code: '{output}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.isCC = false;
                ctx.bbtag.root.output.messageId = '0987654331234567';
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'Output already sent',
            code: '{output;This is my message content}',
            expected: '`Cannot send multiple outputs`',
            setup(ctx) {
                ctx.isCC = false;
                ctx.bbtag.root.output.messageId = '0987654331234567';
            },
            errors: [
                { error: new BBTagRuntimeError('Cannot send multiple outputs') }
            ],
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'NSFW & channel not nsfw',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.isCC = false;
                const embeds = [{ title: 'abc' }];
                const files = [{ file: Buffer.from('test content'), name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];

                ctx.bbtag.root.output.embeds = embeds;
                ctx.bbtag.root.output.files = files;
                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));
                ctx.bbtag.root.output.reactions.push(...emotes.map(m => m.toString()));
                ctx.bbtag.root.output.nsfw = 'This is the nsfw message.';

                channelIsNsfwSubtag.setup(m => m.check(ctx.bbtag, ctx.channelId)).resolves(false).mustHappen(1);
                features.setup((m, $) => m.addMessageReactions(ctx.channelId, '0987654331234567', $(emotes))).resolves({ success: emotes, failed: [] });
                features.setup((m, $) => m.sendMessage(ctx.channelId, $({
                    content: 'This is the nsfw message.',
                    embeds: undefined,
                    files: undefined,
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(roleMentions),
                        users: new Set(userMentions)
                    }
                }))).resolves({ success: true, id: '0987654331234567' });
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'NSFW & channel is nsfw',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.isCC = false;
                const embeds = [{ title: 'abc' }];
                const files = [{ file: Buffer.from(Buffer.from('test content')), name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];

                ctx.bbtag.root.output.embeds = embeds;
                ctx.bbtag.root.output.files = files;
                ctx.bbtag.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => ctx.bbtag.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => ctx.bbtag.root.allowedMentions.users.add(v));
                ctx.bbtag.root.output.reactions.push(...emotes.map(m => m.toString()));
                ctx.bbtag.root.output.nsfw = 'This is the nsfw message.';

                channelIsNsfwSubtag.setup(m => m.check(ctx.bbtag, ctx.channelId)).resolves(true).mustHappen(1);
                features.setup((m, $) => m.addMessageReactions(ctx.channelId, '0987654331234567', $(emotes))).resolves({ success: emotes, failed: [] });
                features.setup((m, $) => m.sendMessage(ctx.channelId, $({
                    content: 'This is my message content',
                    embeds: embeds,
                    files: files,
                    allowedMentions: {
                        everyone: false,
                        roles: new Set(),
                        users: new Set()
                    }
                }))).resolves({ success: true, id: '0987654331234567' });
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.messageId, '0987654331234567');
            }
        }
    ]
});
