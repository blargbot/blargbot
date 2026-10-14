import assert from 'node:assert/strict';

import { BBTagRuntimeError, ChannelNotFoundError } from '@blargbot/bbtag';
import type { CanPingEveryoneThunk } from '@blargbot/bbtag/subtags';
import { EscapeBBTagSubtag, SendSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';
import type * as eris from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

const canPingEveryone = new Mock<CanPingEveryoneThunk>({ callable: true });

await runSubtagTests({
    subtag: new SendSubtag({
        canPingEveryone: canPingEveryone.instance
    }),
    argCountBounds: { min: 2, max: 5 },
    names: ['send'],
    setup(ctx) {
        ctx.addMock(canPingEveryone);
        canPingEveryone.reset();
    },
    cases: [
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`No channel found`',
            errors: [
                { start: 0, end: 30, error: new ChannelNotFoundError('1923681361978632931') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([]);
            }
        },
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`Test error`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Test error') }
            ],
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: undefined,
                    file: undefined,
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: false,
                        roles: undefined,
                        users: undefined
                    }
                }))).rejects(new BBTagRuntimeError('Test error'));
            },
            assert(bbctx) {
                assert.equal(bbctx.root.ownedMessageIds.size, 0);
            }
        },
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`Failed to send: Test error`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to send: Test error') }
            ],
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: undefined,
                    file: undefined,
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: false,
                        roles: undefined,
                        users: undefined
                    }
                }))).rejects(ctx.createRESTError(0, 'Test error'));
            },
            assert(bbctx) {
                assert.equal(bbctx.root.ownedMessageIds.size, 0);
            }
        },
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`Failed to send: UNKNOWN`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to send: UNKNOWN') }
            ],
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                const error = new Error('This error should have been caught, not thrown!');

                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.logger.setup(m => m.error('Failed to send!', error)).returns(undefined);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: undefined,
                    file: undefined,
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: false,
                        roles: undefined,
                        users: undefined
                    }
                }))).rejects(error);
            },
            assert(bbctx) {
                assert.equal(bbctx.root.ownedMessageIds.size, 0);
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc}',
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = true;
                canPingEveryone.setup(m => m(ctx.guild.id)).resolves(true).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: undefined,
                    file: undefined,
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: true,
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = true;
                canPingEveryone.setup(m => m(ctx.guild.id)).resolves(true).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: undefined,
                    embeds: [{ title: 'New embed!' }],
                    file: undefined,
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: true,
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc}',
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: undefined,
                    file: undefined,
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: false,
                        roles: undefined,
                        users: undefined
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: undefined,
                    embeds: [{ title: 'New embed!' }],
                    file: undefined,
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: false,
                        roles: undefined,
                        users: undefined
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = true;
                canPingEveryone.setup(m => m(ctx.guild.id)).resolves(true).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    file: undefined,
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: true,
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    file: undefined,
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: false,
                        roles: undefined,
                        users: undefined
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = true;
                canPingEveryone.setup(m => m(ctx.guild.id)).resolves(true).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    file: [{ file: 'my file content', name: 'file.txt' }],
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: true,
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    file: [{ file: 'my file content', name: 'file.txt' }],
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: false,
                        roles: undefined,
                        users: undefined
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = true;
                canPingEveryone.setup(m => m(ctx.guild.id)).resolves(true).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    file: [{
                        file: $.asserts(value => {
                            const actual = Buffer.from(value).toString();
                            const expected = Buffer.from([0x69, 0xb7, 0x1d, 0x79]).toString();
                            assert.equal(actual, expected);
                        }),
                        name: 'file.txt'
                    }],
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: true,
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    file: [{
                        file: $.asserts(value => {
                            const actual = Buffer.from(value).toString();
                            const expected = Buffer.from([0x69, 0xb7, 0x1d, 0x79]).toString();
                            assert.equal(actual, expected);
                        }),
                        name: 'file.txt'
                    }],
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: false,
                        roles: undefined,
                        users: undefined
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content;test.zip}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = true;
                canPingEveryone.setup(m => m(ctx.guild.id)).resolves(true).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    file: [{ file: 'my file content', name: 'test.zip' }],
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: true,
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content;test.zip}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    file: [{ file: 'my file content', name: 'test.zip' }],
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: false,
                        roles: undefined,
                        users: undefined
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef;test.zip}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = true;
                canPingEveryone.setup(m => m(ctx.guild.id)).resolves(true).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    file: [{
                        file: $.asserts(value => {
                            const actual = Buffer.from(value).toString();
                            const expected = Buffer.from([0x69, 0xb7, 0x1d, 0x79]).toString();
                            assert.equal(actual, expected);
                        }),
                        name: 'test.zip'
                    }],
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: true,
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef;test.zip}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.input.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message: eris.Message<eris.KnownGuildTextableChannel> = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('Unable to locate the mocked channel');

                bbctx.root.output.nsfw = 'This is a nsfw message';
                bbctx.root.allowedMentions.everybody = true;
                roleMentions.forEach(v => bbctx.root.allowedMentions.roles.add(v));
                userMentions.forEach(v => bbctx.root.allowedMentions.users.add(v));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '1923681361978632931')).resolves([general]);
                ctx.util.setup((m, $) => m.send(general as eris.KnownGuildTextableChannel, $({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    file: [{
                        file: $.asserts(value => {
                            const actual = Buffer.from(value).toString();
                            const expected = Buffer.from([0x69, 0xb7, 0x1d, 0x79]).toString();
                            assert.equal(actual, expected);
                        }),
                        name: 'test.zip'
                    }],
                    nsfw: 'This is a nsfw message',
                    allowedMentions: {
                        everyone: false,
                        roles: undefined,
                        users: undefined
                    }
                }))).resolves(message);
            },
            assert(bbctx) {
                assert(bbctx.root.ownedMessageIds.has('239476239742340234'));
            }
        }
    ]
});
