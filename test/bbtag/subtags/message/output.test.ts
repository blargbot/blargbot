import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { OutputSubtag } from '@blargbot/bbtag/subtags/message/output';
import { Emote } from '@blargbot/core/Emote';
import { expect } from 'chai';

import { argument } from '../../mock';
import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite';

const emotes = [Emote.parse(`<a:test:120272372032032937>`), Emote.parse(`<:alsoatest:23094632472398746234>`), Emote.parse(`🤔`)];

runSubtagTests({
    subtag: new OutputSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            title: `Custom command`,
            code: `{output}`,
            expected: `0987654331234567`,
            setup(ctx) {
                ctx.options.isCC = true;
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, `disableeveryone`)).thenResolve(false);
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: `abc` }];
                const files = [{ file: `test content`, name: `test.txt` }];
                const roleMentions = [`56789043764325674`, `345678238285862342`];
                const userMentions = [`23946265743358573`, `234926342423437987`];
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: `0987654331234567`,
                    channel_id: bbctx.channel.id
                }, ctx.users.command));

                bbctx.data.embeds = embeds;
                bbctx.data.file = files[0];
                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;
                bbctx.data.reactions = emotes.map(m => m.toString());
                bbctx.data.nsfw = `This is the nsfw message`;

                ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual(emotes))).thenResolve({ success: emotes, failed: [] });
                ctx.util.setup(m => m.send(bbctx.message, argument.isDeepEqual({
                    content: ``,
                    replyToExecuting: false,
                    embeds: embeds,
                    files: files,
                    nsfw: `This is the nsfw message`,
                    allowedMentions: {
                        everyone: true,
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                expect(bbctx.data.outputMessage).to.equal(`0987654331234567`);
            }
        },
        {
            title: `Tag command`,
            code: `{output}`,
            expected: `0987654331234567`,
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: `abc` }];
                const files = [{ file: `test content`, name: `test.txt` }];
                const roleMentions = [`56789043764325674`, `345678238285862342`];
                const userMentions = [`23946265743358573`, `234926342423437987`];
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: `0987654331234567`,
                    channel_id: bbctx.channel.id
                }, ctx.users.command));

                bbctx.data.embeds = embeds;
                bbctx.data.file = files[0];
                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;
                bbctx.data.reactions = emotes.map(m => m.toString());
                bbctx.data.nsfw = `This is the nsfw message`;

                ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual(emotes))).thenResolve({ success: emotes, failed: [] });
                ctx.util.setup(m => m.send(bbctx.message, argument.isDeepEqual({
                    content: ``,
                    replyToExecuting: false,
                    embeds: embeds,
                    files: files,
                    nsfw: `This is the nsfw message`,
                    allowedMentions: {
                        everyone: false
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                expect(bbctx.data.outputMessage).to.equal(`0987654331234567`);
            }
        },
        {
            title: `Custom command`,
            code: `{output;This is my message content}`,
            expected: `0987654331234567`,
            setup(ctx) {
                ctx.options.isCC = true;
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, `disableeveryone`)).thenResolve(false);
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: `abc` }];
                const files = [{ file: `test content`, name: `test.txt` }];
                const roleMentions = [`56789043764325674`, `345678238285862342`];
                const userMentions = [`23946265743358573`, `234926342423437987`];
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: `0987654331234567`,
                    channel_id: bbctx.channel.id
                }, ctx.users.command));

                bbctx.data.embeds = embeds;
                bbctx.data.file = files[0];
                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;
                bbctx.data.reactions = emotes.map(m => m.toString());
                bbctx.data.nsfw = `This is the nsfw message`;

                ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual(emotes))).thenResolve({ success: emotes, failed: [] });
                ctx.util.setup(m => m.send(bbctx.message, argument.isDeepEqual({
                    content: `This is my message content`,
                    replyToExecuting: false,
                    embeds: embeds,
                    files: files,
                    nsfw: `This is the nsfw message`,
                    allowedMentions: {
                        everyone: true,
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                expect(bbctx.data.outputMessage).to.equal(`0987654331234567`);
            }
        },
        {
            title: `Tag command`,
            code: `{output;This is my message content}`,
            expected: `0987654331234567`,
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: `abc` }];
                const files = [{ file: `test content`, name: `test.txt` }];
                const roleMentions = [`56789043764325674`, `345678238285862342`];
                const userMentions = [`23946265743358573`, `234926342423437987`];
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: `0987654331234567`,
                    channel_id: bbctx.channel.id
                }, ctx.users.command));

                bbctx.data.embeds = embeds;
                bbctx.data.file = files[0];
                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;
                bbctx.data.reactions = emotes.map(m => m.toString());
                bbctx.data.nsfw = `This is the nsfw message`;

                ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual(emotes))).thenResolve({ success: emotes, failed: [] });
                ctx.util.setup(m => m.send(bbctx.message, argument.isDeepEqual({
                    content: `This is my message content`,
                    replyToExecuting: false,
                    embeds: embeds,
                    files: files,
                    nsfw: `This is the nsfw message`,
                    allowedMentions: {
                        everyone: false
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                expect(bbctx.data.outputMessage).to.equal(`0987654331234567`);
            }
        },
        {
            title: `Tag command minimal`,
            code: `{output;This is my message content}`,
            expected: `0987654331234567`,
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: `0987654331234567`,
                    channel_id: bbctx.channel.id
                }, ctx.users.command));

                bbctx.data.embeds = [];
                bbctx.data.file = undefined;
                bbctx.data.allowedMentions.everybody = false;
                bbctx.data.allowedMentions.roles = [];
                bbctx.data.allowedMentions.users = [];
                bbctx.data.reactions = [];
                bbctx.data.nsfw = undefined;

                ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual([]))).thenResolve({ success: [], failed: [] });
                ctx.util.setup(m => m.send(bbctx.message, argument.isDeepEqual({
                    content: `This is my message content`,
                    replyToExecuting: false,
                    embeds: [],
                    files: undefined,
                    nsfw: undefined,
                    allowedMentions: {
                        everyone: false
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                expect(bbctx.data.outputMessage).to.equal(`0987654331234567`);
            }
        },
        {
            title: `Output already sent`,
            code: `{output}`,
            expected: `0987654331234567`,
            setup(ctx) {
                ctx.options.data ??= {};
                ctx.options.data.outputMessage = `0987654331234567`;
                ctx.options.isCC = false;
            },
            assert(bbctx) {
                expect(bbctx.data.outputMessage).to.equal(`0987654331234567`);
            }
        },
        {
            title: `Output already sent`,
            code: `{output;This is my message content}`,
            expected: `\`Cannot send multiple outputs\``,
            setup(ctx) {
                ctx.options.data ??= {};
                ctx.options.data.outputMessage = `0987654331234567`;
                ctx.options.isCC = false;
            },
            errors: [
                { start: 0, end: 35, error: new BBTagRuntimeError(`Cannot send multiple outputs`) }
            ],
            assert(bbctx) {
                expect(bbctx.data.outputMessage).to.equal(`0987654331234567`);
            }
        }
    ]
});
