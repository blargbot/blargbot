import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { EscapeBBTagSubtag, WebhookSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(WebhookSubtag),
    argCountBounds: { min: 2, max: 8 },
    cases: [
        {
            code: '{webhook;abc;def}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '`Error executing webhook: Test error`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Error executing webhook: Test error') }
            ],
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.runWebhook(bbctx.runtime, 'abc', 'def', argument.isDeepEqual({
                    username: undefined,
                    avatarUrl: undefined,
                    content: undefined,
                    embeds: undefined,
                    files: undefined
                }))).thenResolve({ error: 'Test error' });
            }
        },
        {
            code: '{webhook;abc;def}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '`Error executing webhook: 404 NotFound on POST /webhooks`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Error executing webhook: 404 NotFound on POST /webhooks') }
            ],
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.runWebhook(bbctx.runtime, 'abc', 'def', argument.isDeepEqual({
                    username: undefined,
                    avatarUrl: undefined,
                    content: undefined,
                    embeds: undefined,
                    files: undefined
                }))).thenResolve({ error: '404 NotFound on POST /webhooks' });
            }
        },
        {
            code: '{webhook;abc;def}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '`Error executing webhook: UNKNOWN`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Error executing webhook: UNKNOWN') }
            ],
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.runWebhook(bbctx.runtime, 'abc', 'def', argument.isDeepEqual({
                    username: undefined,
                    avatarUrl: undefined,
                    content: undefined,
                    embeds: undefined,
                    files: undefined
                }))).thenResolve({ error: 'UNKNOWN' });
            }
        },
        {
            code: '{webhook;abc;def}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.runWebhook(bbctx.runtime, 'abc', 'def', argument.isDeepEqual({
                    username: undefined,
                    avatarUrl: undefined,
                    content: undefined,
                    embeds: undefined,
                    files: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.runWebhook(bbctx.runtime, 'abc', 'def', argument.isDeepEqual({
                    username: undefined,
                    avatarUrl: undefined,
                    content: 'ghi',
                    embeds: undefined,
                    files: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"color":"This isnt an embed"}}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.runWebhook(bbctx.runtime, 'abc', 'def', argument.isDeepEqual({
                    username: undefined,
                    avatarUrl: undefined,
                    content: 'ghi',
                    embeds: [{ fields: [{ name: 'Malformed JSON', value: '{"color":"This isnt an embed"}' }] }],
                    files: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.runWebhook(bbctx.runtime, 'abc', 'def', argument.isDeepEqual({
                    username: undefined,
                    avatarUrl: undefined,
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    files: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.runWebhook(bbctx.runtime, 'abc', 'def', argument.isDeepEqual({
                    username: 'jkl',
                    avatarUrl: undefined,
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    files: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.runWebhook(bbctx.runtime, 'abc', 'def', argument.isDeepEqual({
                    username: 'jkl',
                    avatarUrl: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    files: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;pqrs}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.runWebhook(bbctx.runtime, 'abc', 'def', argument.isDeepEqual({
                    username: 'jkl',
                    avatarUrl: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    files: [{ file: 'cHFycw==', name: 'file.txt' }]
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;buffer:pqrs}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.runWebhook(bbctx.runtime, 'abc', 'def', argument.isDeepEqual({
                    username: 'jkl',
                    avatarUrl: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    files: [{ file: 'pqrs', name: 'file.txt' }]
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;pqrs;tuv}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.runWebhook(bbctx.runtime, 'abc', 'def', argument.isDeepEqual({
                    username: 'jkl',
                    avatarUrl: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    files: [{ file: 'cHFycw==', name: 'tuv' }]
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;buffer:pqrs;tuv}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.runWebhook(bbctx.runtime, 'abc', 'def', argument.isDeepEqual({
                    username: 'jkl',
                    avatarUrl: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    files: [{ file: 'pqrs', name: 'tuv' }]
                }))).thenResolve(undefined);
            }
        }
    ]
});
