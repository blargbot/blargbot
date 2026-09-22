import assert from 'node:assert/strict';

import { BBTagRuntimeError, EscapeBBTagSubtag, WebhookSubtag } from '@blargbot/bbtag-engine';
import { $ } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.webhookReplacer,
    argCountBounds: { min: 2, max: 8 },
    cases: [
        {
            code: '{webhook;abc;def}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '`Error executing webhook: Test error`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Error executing webhook: Test error') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', $.looksLike({
                    username: undefined,
                    avatarURL: undefined,
                    content: undefined,
                    embeds: undefined,
                    file: undefined
                }))).thenReject(ctx.createRESTError(0, 'Test error'));
            }
        },
        {
            code: '{webhook;abc;def}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '`Error executing webhook: 404 NotFound on POST /webhooks`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Error executing webhook: 404 NotFound on POST /webhooks') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', $.looksLike({
                    username: undefined,
                    avatarURL: undefined,
                    content: undefined,
                    embeds: undefined,
                    file: undefined
                }))).thenReject(ctx.createHTTPError(404, 'NotFound', 'POST', '/webhooks'));
            }
        },
        {
            code: '{webhook;abc;def}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '`Error executing webhook: UNKNOWN`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Error executing webhook: UNKNOWN') }
            ],
            setup(ctx) {
                const error = new Error('This should be caught not thrown');

                ctx.logger.setup(m => m.error('Error executing webhook', error)).thenReturn(undefined);
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', $.looksLike({
                    username: undefined,
                    avatarURL: undefined,
                    content: undefined,
                    embeds: undefined,
                    file: undefined
                }))).thenReject(error);
            }
        },
        {
            code: '{webhook;abc;def}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', $.looksLike({
                    username: undefined,
                    avatarURL: undefined,
                    content: undefined,
                    embeds: undefined,
                    file: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', $.looksLike({
                    username: undefined,
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: undefined,
                    file: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"color":"This isnt an embed"}}}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', $.looksLike({
                    username: undefined,
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: [{ fields: [{ name: 'Malformed JSON', value: '{"color":"This isnt an embed"}' }], malformed: true }],
                    file: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}}}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', $.looksLike({
                    username: undefined,
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', $.looksLike({
                    username: 'jkl',
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', $.looksLike({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;pqrs}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', $.looksLike({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: [{
                        file: $.assert<Buffer>(value => {
                            const actual = Buffer.from(value as ArrayBufferLike).toString();
                            const expected = Buffer.from([0x70, 0x71, 0x72, 0x73]).toString();
                            assert.equal(actual, expected);
                        }).value,
                        name: 'file.txt'
                    }]
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;buffer:pqrs}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', $.looksLike({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: [{
                        file: $.assert<Buffer>(value => {
                            const actual = Buffer.from(value as ArrayBufferLike).toString();
                            const expected = Buffer.from([0xa6, 0xaa, 0xec]).toString();
                            assert.equal(actual, expected);
                        }).value,
                        name: 'file.txt'
                    }]
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;pqrs;tuv}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', $.looksLike({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: [{
                        file: $.assert<Buffer>(value => {
                            const actual = Buffer.from(value as ArrayBufferLike).toString();
                            const expected = Buffer.from([0x70, 0x71, 0x72, 0x73]).toString();
                            assert.equal(actual, expected);
                        }).value,
                        name: 'tuv'
                    }]
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;buffer:pqrs;tuv}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', $.looksLike({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: [{
                        file: $.assert<Buffer>(value => {
                            const actual = Buffer.from(value as ArrayBufferLike).toString();
                            const expected = Buffer.from([0xa6, 0xaa, 0xec]).toString();
                            assert.equal(actual, expected);
                        }).value,
                        name: 'tuv'
                    }]
                }))).thenResolve(undefined);
            }
        }
    ]
});
