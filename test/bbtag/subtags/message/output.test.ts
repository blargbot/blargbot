import assert from 'node:assert/strict';

import { BBTagRuntimeError } from '@blargbot/bbtag';
import { OutputSubtag } from '@blargbot/bbtag/subtags';
import { Emote } from '@blargbot/core';
import type * as eris from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

const emotes = [Emote.parse('<a:test:120272372032032937>'), Emote.parse('<:alsoatest:23094632472398746234>'), Emote.parse('🤔')];

await runSubtagTests({
    subtag: new OutputSubtag(),
    argCountBounds: { min: 0, max: 1 },
    names: ['output'],
    cases: [
        {
            title: 'Custom command',
            code: '{output}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.input.isCC = true;
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'disableeveryone')).resolves(false);
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = ctx.createMessage<eris.KnownGuildTextableChannel>(SubtagTestContext.createApiMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                bbctx.root.output.embeds = embeds;
                bbctx.root.output.files = files;
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));
                bbctx.root.output.reactions.push(...emotes.map(m => m.toString()));
                bbctx.root.output.nsfw = 'This is the nsfw message';

                ctx.util.setup((m, $) => m.addReactions(message, $(emotes))).resolves({ success: emotes, failed: [] });
                ctx.util.setup((m, $) => m.send(bbctx.root.message.channel, $({
                    content: '',
                    embeds: embeds,
                    file: files,
                    nsfw: 'This is the nsfw message',
                    allowedMentions: {
                        everyone: true,
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert.equal(bbctx.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'Tag command',
            code: '{output}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = ctx.createMessage<eris.KnownGuildTextableChannel>(SubtagTestContext.createApiMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                bbctx.root.output.embeds = embeds;
                bbctx.root.output.files = files;
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));
                bbctx.root.output.reactions.push(...emotes.map(m => m.toString()));
                bbctx.root.output.nsfw = 'This is the nsfw message';

                ctx.util.setup((m, $) => m.addReactions(message, $(emotes))).resolves({ success: emotes, failed: [] });
                ctx.util.setup((m, $) => m.send(bbctx.root.message.channel, $({
                    content: '',
                    embeds: embeds,
                    file: files,
                    nsfw: 'This is the nsfw message',
                    allowedMentions: {
                        everyone: false,
                        roles: undefined,
                        users: undefined
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert.equal(bbctx.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'Custom command',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.input.isCC = true;
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'disableeveryone')).resolves(false);
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = ctx.createMessage<eris.KnownGuildTextableChannel>(SubtagTestContext.createApiMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                bbctx.root.output.embeds = embeds;
                bbctx.root.output.files = files;
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));
                bbctx.root.output.reactions.push(...emotes.map(m => m.toString()));
                bbctx.root.output.nsfw = 'This is the nsfw message';

                ctx.util.setup((m, $) => m.addReactions(message, $(emotes))).resolves({ success: emotes, failed: [] });
                ctx.util.setup((m, $) => m.send(bbctx.root.message.channel, $({
                    content: 'This is my message content',
                    embeds: embeds,
                    file: files,
                    nsfw: 'This is the nsfw message',
                    allowedMentions: {
                        everyone: true,
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert.equal(bbctx.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'Tag command',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = ctx.createMessage<eris.KnownGuildTextableChannel>(SubtagTestContext.createApiMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                bbctx.root.output.embeds = embeds;
                bbctx.root.output.files = files;
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));
                bbctx.root.output.reactions.push(...emotes.map(m => m.toString()));
                bbctx.root.output.nsfw = 'This is the nsfw message';

                ctx.util.setup((m, $) => m.addReactions(message, $(emotes))).resolves({ success: emotes, failed: [] });
                ctx.util.setup((m, $) => m.send(bbctx.root.message.channel, $({
                    content: 'This is my message content',
                    embeds: embeds,
                    file: files,
                    nsfw: 'This is the nsfw message',
                    allowedMentions: {
                        everyone: false,
                        roles: undefined,
                        users: undefined
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert.equal(bbctx.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'Tag command minimal',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage<eris.KnownGuildTextableChannel>(SubtagTestContext.createApiMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                bbctx.root.output.embeds = [];
                bbctx.root.output.files = undefined;
                bbctx.root.allowedMentions.everybody = false;
                bbctx.root.output.nsfw = undefined;

                ctx.util.setup((m, $) => m.addReactions(message, $([]))).resolves({ success: [], failed: [] });
                ctx.util.setup((m, $) => m.send(bbctx.root.message.channel, $({
                    content: 'This is my message content',
                    embeds: [],
                    file: undefined,
                    nsfw: undefined,
                    allowedMentions: {
                        everyone: false,
                        roles: undefined,
                        users: undefined
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert.equal(bbctx.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'Output already sent',
            code: '{output}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx) {
                bbctx.root.output.messageId = '0987654331234567';
            },
            assert(bbctx) {
                assert.equal(bbctx.root.output.messageId, '0987654331234567');
            }
        },
        {
            title: 'Output already sent',
            code: '{output;This is my message content}',
            expected: '`Cannot send multiple outputs`',
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx) {
                bbctx.root.output.messageId = '0987654331234567';
            },
            errors: [
                { start: 0, end: 35, error: new BBTagRuntimeError('Cannot send multiple outputs') }
            ],
            assert(bbctx) {
                assert.equal(bbctx.root.output.messageId, '0987654331234567');
            }
        }
    ]
});
