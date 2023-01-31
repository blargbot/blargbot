import { BBTagRuntimeError, Subtag  } from '@blargbot/bbtag';
import { OutputSubtag } from '@blargbot/bbtag/subtags';
import { Emote } from '@blargbot/discord-emote';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';
import * as Discord from 'discord-api-types/v10';

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
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'disableeveryone')).thenResolve(false);
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                bbctx.data.embeds = embeds;
                bbctx.data.file = files[0];
                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;
                bbctx.data.reactions = emotes.map(m => m.toString());

                ctx.messageService.setup(m => m.addReactions(bbctx, message.channel_id, message.id, argument.isDeepEqual(emotes))).thenResolve({ success: emotes, failed: [] });
                ctx.messageService.setup(m => m.create(bbctx, bbctx.message.channel_id, argument.isDeepEqual({
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
                chai.expect(bbctx.data.outputMessage).to.equal('0987654331234567');
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
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                bbctx.data.embeds = embeds;
                bbctx.data.file = files[0];
                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;
                bbctx.data.reactions = emotes.map(m => m.toString());
                bbctx.data.nsfw = 'This is the nsfw message';

                ctx.messageService.setup(m => m.addReactions(bbctx, message.channel_id, message.id, argument.isDeepEqual(emotes))).thenResolve({ success: emotes, failed: [] });
                ctx.messageService.setup(m => m.create(bbctx, bbctx.message.channel_id, argument.isDeepEqual({
                    content: '',
                    embeds: embeds,
                    files: files,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.outputMessage).to.equal('0987654331234567');
            }
        },
        {
            title: 'Custom command',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.isCC = true;
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'disableeveryone')).thenResolve(false);
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                bbctx.data.embeds = embeds;
                bbctx.data.file = files[0];
                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;
                bbctx.data.reactions = emotes.map(m => m.toString());
                bbctx.data.nsfw = 'This is the nsfw message';

                ctx.messageService.setup(m => m.addReactions(bbctx, message.channel_id, message.id, argument.isDeepEqual(emotes))).thenResolve({ success: emotes, failed: [] });
                ctx.messageService.setup(m => m.create(bbctx, bbctx.message.channel_id, argument.isDeepEqual({
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
                chai.expect(bbctx.data.outputMessage).to.equal('0987654331234567');
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
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                bbctx.data.embeds = embeds;
                bbctx.data.file = files[0];
                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;
                bbctx.data.reactions = emotes.map(m => m.toString());
                bbctx.data.nsfw = 'This is the nsfw message';

                ctx.messageService.setup(m => m.addReactions(bbctx, message.channel_id, message.id, argument.isDeepEqual(emotes))).thenResolve({ success: emotes, failed: [] });
                ctx.messageService.setup(m => m.create(bbctx, bbctx.message.channel_id, argument.isDeepEqual({
                    content: 'This is my message content',
                    embeds: embeds,
                    files: files,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.outputMessage).to.equal('0987654331234567');
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
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                bbctx.data.embeds = [];
                bbctx.data.file = undefined;
                bbctx.data.allowedMentions.everybody = false;
                bbctx.data.allowedMentions.roles = [];
                bbctx.data.allowedMentions.users = [];
                bbctx.data.reactions = [];
                bbctx.data.nsfw = undefined;

                ctx.messageService.setup(m => m.addReactions(bbctx, message.channel_id, message.id, argument.isDeepEqual([]))).thenResolve({ success: [], failed: [] });
                ctx.messageService.setup(m => m.create(bbctx, bbctx.message.channel_id, argument.isDeepEqual({
                    content: 'This is my message content',
                    embeds: [],
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.outputMessage).to.equal('0987654331234567');
            }
        },
        {
            title: 'Output already sent',
            code: '{output}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.data ??= {};
                ctx.options.data.outputMessage = '0987654331234567';
                ctx.options.isCC = false;
            },
            assert(bbctx) {
                chai.expect(bbctx.data.outputMessage).to.equal('0987654331234567');
            }
        },
        {
            title: 'Output already sent',
            code: '{output;This is my message content}',
            expected: '`Cannot send multiple outputs`',
            setup(ctx) {
                ctx.options.data ??= {};
                ctx.options.data.outputMessage = '0987654331234567';
                ctx.options.isCC = false;
            },
            errors: [
                { start: 0, end: 35, error: new BBTagRuntimeError('Cannot send multiple outputs') }
            ],
            assert(bbctx) {
                chai.expect(bbctx.data.outputMessage).to.equal('0987654331234567');
            }
        }
    ]
});
