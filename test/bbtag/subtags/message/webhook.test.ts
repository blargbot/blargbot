import assert from 'node:assert/strict';

import { BBTagRuntimeError } from '@blargbot/bbtag';
import { EscapeBBTagSubtag, WebhookSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new WebhookSubtag(),
    argCountBounds: { min: 2, max: 8 },
    names: ['webhook'],
    cases: [
        {
            code: '{webhook;abc;def}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '`Error executing webhook: Test error`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Error executing webhook: Test error') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: undefined,
                    embeds: undefined,
                    file: undefined
                }))).rejects(ctx.createRESTError(0, 'Test error'));
            }
        },
        {
            code: '{webhook;abc;def}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '`Error executing webhook: 404 NotFound on POST /webhooks`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Error executing webhook: 404 NotFound on POST /webhooks') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: undefined,
                    embeds: undefined,
                    file: undefined
                }))).rejects(ctx.createHTTPError(404, 'NotFound', 'POST', '/webhooks'));
            }
        },
        {
            code: '{webhook;abc;def}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '`Error executing webhook: UNKNOWN`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Error executing webhook: UNKNOWN') }
            ],
            setup(ctx) {
                const error = new Error('This should be caught not thrown');

                ctx.logger.setup(m => m.error('Error executing webhook', error)).returns(undefined);
                ctx.discord.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: undefined,
                    embeds: undefined,
                    file: undefined
                }))).rejects(error);
            }
        },
        {
            code: '{webhook;abc;def}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: undefined,
                    embeds: undefined,
                    file: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: undefined,
                    file: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"color":"This isnt an embed"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: [{ fields: [{ name: 'Malformed JSON', value: '{"color":"This isnt an embed"}' }], malformed: true }],
                    file: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: 'jkl',
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;pqrs}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: [{
                        file: $.asserts(value => {
                            const actual = Buffer.from(value).toString();
                            const expected = Buffer.from([0x70, 0x71, 0x72, 0x73]).toString();
                            assert.equal(actual, expected);
                        }),
                        name: 'file.txt'
                    }]
                }))).resolves(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;buffer:pqrs}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: [{
                        file: $.asserts(value => {
                            const actual = Buffer.from(value).toString();
                            const expected = Buffer.from([0xa6, 0xaa, 0xec]).toString();
                            assert.equal(actual, expected);
                        }),
                        name: 'file.txt'
                    }]
                }))).resolves(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;pqrs;tuv}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: [{
                        file: $.asserts(value => {
                            const actual = Buffer.from(value).toString();
                            const expected = Buffer.from([0x70, 0x71, 0x72, 0x73]).toString();
                            assert.equal(actual, expected);
                        }),
                        name: 'tuv'
                    }]
                }))).resolves(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;buffer:pqrs;tuv}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: [{
                        file: $.asserts(value => {
                            const actual = Buffer.from(value).toString();
                            const expected = Buffer.from([0xa6, 0xaa, 0xec]).toString();
                            assert.equal(actual, expected);
                        }),
                        name: 'tuv'
                    }]
                }))).resolves(undefined);
            }
        }
    ]
});
