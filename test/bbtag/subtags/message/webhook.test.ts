import assert from 'node:assert/strict';

import { BBTagRuntimeError } from '@blargbot/bbtag-engine';
import type { ExecuteWebhookFeature } from '@blargbot/bbtag-engine/subtags';
import { EscapeBBTagSubtag, WebhookSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<ExecuteWebhookFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new WebhookSubtag(features.instance),
    argCountBounds: { min: 2, max: 8 },
    names: ['webhook'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{webhook;abc;def}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '`Error executing webhook: Test error`',
            errors: [
                { error: new BBTagRuntimeError('Error executing webhook: Test error') }
            ],
            setup() {
                features.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: undefined,
                    embeds: undefined,
                    file: undefined
                }))).resolves({ success: false, reason: 'Test error' });
            }
        },
        {
            code: '{webhook;abc;def}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '`Error executing webhook: 404 NotFound on POST /webhooks`',
            errors: [
                { error: new BBTagRuntimeError('Error executing webhook: 404 NotFound on POST /webhooks') }
            ],
            setup() {
                features.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: undefined,
                    embeds: undefined,
                    file: undefined
                }))).resolves({ success: false, reason: '404 NotFound on POST /webhooks' });
            }
        },
        {
            code: '{webhook;abc;def}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '`Error executing webhook: UNKNOWN`',
            errors: [
                { error: new BBTagRuntimeError('Error executing webhook: UNKNOWN') }
            ],
            setup() {
                features.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: undefined,
                    embeds: undefined,
                    file: undefined
                }))).resolves({ success: false });
            }
        },
        {
            code: '{webhook;abc;def}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup() {
                features.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: undefined,
                    embeds: undefined,
                    file: undefined
                }))).resolves({ success: true });
            }
        },
        {
            code: '{webhook;abc;def;ghi}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup() {
                features.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: undefined,
                    file: undefined
                }))).resolves({ success: true });
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"color":"This isnt an embed"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup() {
                features.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: [{ fields: [{ name: 'Malformed JSON', value: '{"color":"This isnt an embed"}' }], malformed: true }],
                    file: undefined
                }))).resolves({ success: true });
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup() {
                features.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: undefined,
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: undefined
                }))).resolves({ success: true });
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup() {
                features.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: 'jkl',
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: undefined
                }))).resolves({ success: true });
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup() {
                features.setup((m, $) => m.executeWebhook('abc', 'def', $({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: undefined
                }))).resolves({ success: true });
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;pqrs}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup() {
                features.setup((m, $) => m.executeWebhook('abc', 'def', $({
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
                }))).resolves({ success: true });
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;buffer:pqrs}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup() {
                features.setup((m, $) => m.executeWebhook('abc', 'def', $({
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
                }))).resolves({ success: true });
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;pqrs;tuv}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup() {
                features.setup((m, $) => m.executeWebhook('abc', 'def', $({
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
                }))).resolves({ success: true });
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;buffer:pqrs;tuv}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup() {
                features.setup((m, $) => m.executeWebhook('abc', 'def', $({
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
                }))).resolves({ success: true });
            }
        }
    ]
});
