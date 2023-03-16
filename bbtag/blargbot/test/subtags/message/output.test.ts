import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { OutputSubtag } from '@bbtag/blargbot/subtags';
import { Emote } from '@blargbot/discord-emote';
import Discord from '@blargbot/discord-types';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

const emotes = [Emote.parse('<a:test:120272372032032937>'), Emote.parse('<:alsoatest:23094632472398746234>'), Emote.parse('🤔')];

runSubtagTests({
    subtag: Subtag.getDescriptor(OutputSubtag),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            title: 'Custom command',
            code: '{output}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.isCC = true;
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                bbctx.runtime.outputOptions.embeds = embeds;
                bbctx.runtime.outputOptions.file = files[0];
                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);
                bbctx.runtime.outputOptions.reactions.push(...emotes.map(m => m.toString()));

                ctx.dependencies.messages.setup(m => m.addReactions(bbctx.runtime, message.channel_id, message.id, argument.isDeepEqual(emotes))).thenResolve({ success: emotes, failed: [] });
                ctx.dependencies.messages.setup(m => m.create(bbctx.runtime, bbctx.runtime.message.channel_id, argument.isDeepEqual({
                    content: '',
                    embeds: embeds,
                    files: files,
                    allowed_mentions: {
                        parse: [Discord.AllowedMentionsTypes.Everyone],
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.outputOptions.id).to.equal('0987654331234567');
            }
        },
        {
            title: 'Tag command',
            code: '{output}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                bbctx.runtime.outputOptions.embeds = embeds;
                bbctx.runtime.outputOptions.file = files[0];
                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);
                bbctx.runtime.outputOptions.reactions.push(...emotes.map(m => m.toString()));
                bbctx.runtime.outputOptions.nsfwMessage = 'This is the nsfw message';

                ctx.dependencies.messages.setup(m => m.addReactions(bbctx.runtime, message.channel_id, message.id, argument.isDeepEqual(emotes))).thenResolve({ success: emotes, failed: [] });
                ctx.dependencies.messages.setup(m => m.create(bbctx.runtime, bbctx.runtime.message.channel_id, argument.isDeepEqual({
                    content: '',
                    embeds: embeds,
                    files: files,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.outputOptions.id).to.equal('0987654331234567');
            }
        },
        {
            title: 'Custom command',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.isCC = true;
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                bbctx.runtime.outputOptions.embeds = embeds;
                bbctx.runtime.outputOptions.file = files[0];
                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);
                bbctx.runtime.outputOptions.reactions.push(...emotes.map(m => m.toString()));
                bbctx.runtime.outputOptions.nsfwMessage = 'This is the nsfw message';

                ctx.dependencies.messages.setup(m => m.addReactions(bbctx.runtime, message.channel_id, message.id, argument.isDeepEqual(emotes))).thenResolve({ success: emotes, failed: [] });
                ctx.dependencies.messages.setup(m => m.create(bbctx.runtime, bbctx.runtime.message.channel_id, argument.isDeepEqual({
                    content: 'This is my message content',
                    embeds: embeds,
                    files: files,
                    allowed_mentions: {
                        parse: [Discord.AllowedMentionsTypes.Everyone],
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.outputOptions.id).to.equal('0987654331234567');
            }
        },
        {
            title: 'Tag command',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                bbctx.runtime.outputOptions.embeds = embeds;
                bbctx.runtime.outputOptions.file = files[0];
                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);
                bbctx.runtime.outputOptions.reactions.push(...emotes.map(m => m.toString()));
                bbctx.runtime.outputOptions.nsfwMessage = 'This is the nsfw message';

                ctx.dependencies.messages.setup(m => m.addReactions(bbctx.runtime, message.channel_id, message.id, argument.isDeepEqual(emotes))).thenResolve({ success: emotes, failed: [] });
                ctx.dependencies.messages.setup(m => m.create(bbctx.runtime, bbctx.runtime.message.channel_id, argument.isDeepEqual({
                    content: 'This is my message content',
                    embeds: embeds,
                    files: files,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.outputOptions.id).to.equal('0987654331234567');
            }
        },
        {
            title: 'Tag command minimal',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const message = SubtagTestContext.createMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                bbctx.runtime.outputOptions.embeds = [];
                bbctx.runtime.outputOptions.file = undefined;
                bbctx.runtime.outputOptions.allowEveryone = false;
                for (const role of [])
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of [])
                    bbctx.runtime.outputOptions.mentionUsers.add(user);
                bbctx.runtime.outputOptions.reactions.push(...[]);
                bbctx.runtime.outputOptions.nsfwMessage = undefined;

                ctx.dependencies.messages.setup(m => m.addReactions(bbctx.runtime, message.channel_id, message.id, argument.isDeepEqual([]))).thenResolve({ success: [], failed: [] });
                ctx.dependencies.messages.setup(m => m.create(bbctx.runtime, bbctx.runtime.message.channel_id, argument.isDeepEqual({
                    content: 'This is my message content',
                    embeds: [],
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.outputOptions.id).to.equal('0987654331234567');
            }
        },
        {
            title: 'Output already sent',
            code: '{output}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.output ??= {};
                ctx.options.output.id = '0987654331234567';
                ctx.options.isCC = false;
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.outputOptions.id).to.equal('0987654331234567');
            }
        },
        {
            title: 'Output already sent',
            code: '{output;This is my message content}',
            expected: '`Cannot send multiple outputs`',
            setup(ctx) {
                ctx.options.output ??= {};
                ctx.options.output.id = '0987654331234567';
                ctx.options.isCC = false;
            },
            errors: [
                { start: 0, end: 35, error: new BBTagRuntimeError('Cannot send multiple outputs') }
            ],
            assert(bbctx) {
                chai.expect(bbctx.runtime.outputOptions.id).to.equal('0987654331234567');
            }
        }
    ]
});
