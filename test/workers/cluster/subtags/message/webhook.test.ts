import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { WebhookSubtag } from '@cluster/subtags/message/webhook';
import { EscapeBbtagSubtag } from '@cluster/subtags/misc/escapebbtag';
import { expect } from 'chai';

import { argument } from '../../../../mock';
import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new WebhookSubtag(),
    argCountBounds: { min: 2, max: 8 },
    cases: [
        {
            code: '{webhook;abc;def}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Error executing webhook: Test error`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Error executing webhook: Test error') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', argument.isDeepEqual({
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
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Error executing webhook: 404 NotFound on POST /webhooks`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Error executing webhook: 404 NotFound on POST /webhooks') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', argument.isDeepEqual({
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
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Error executing webhook: UNKNOWN`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Error executing webhook: UNKNOWN') }
            ],
            setup(ctx) {
                const error = new Error('This should be caught not thrown');

                ctx.logger.setup(m => m.error('Error executing webhook', error)).thenReturn(undefined);
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', argument.isDeepEqual({
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
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', argument.isDeepEqual({
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
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', argument.isDeepEqual({
                    username: undefined,
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: undefined,
                    file: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"test":"This isnt an embed"}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', argument.isDeepEqual({
                    username: undefined,
                    avatarURL: undefined,
                    content: 'ghi',
                    embeds: [{ fields: [{ name: 'Malformed JSON', value: '{"test":"This isnt an embed"}' }], malformed: true }],
                    file: undefined
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', argument.isDeepEqual({
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
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', argument.isDeepEqual({
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
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', argument.isDeepEqual({
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
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', argument.isDeepEqual({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: [{ file: argument.assert<Buffer>(value => expect(value).to.be.instanceOf(Buffer).and.to.equalBytes([0x70, 0x71, 0x72, 0x73])).value, name: 'file.txt' }]
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;buffer:pqrs}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', argument.isDeepEqual({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: [{ file: argument.assert<Buffer>(value => expect(value).to.be.instanceOf(Buffer).and.to.equalBytes([0xa6, 0xaa, 0xec])).value, name: 'file.txt' }]
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;pqrs;tuv}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', argument.isDeepEqual({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: [{ file: argument.assert<Buffer>(value => expect(value).to.be.instanceOf(Buffer).and.to.equalBytes([0x70, 0x71, 0x72, 0x73])).value, name: 'tuv' }]
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{webhook;abc;def;ghi;{escapebbtag;{"title":"My cool embed"}};jkl;mno;buffer:pqrs;tuv}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.executeWebhook('abc', 'def', argument.isDeepEqual({
                    username: 'jkl',
                    avatarURL: 'mno',
                    content: 'ghi',
                    embeds: [{ title: 'My cool embed' }],
                    file: [{ file: argument.assert<Buffer>(value => expect(value).to.be.instanceOf(Buffer).and.to.equalBytes([0xa6, 0xaa, 0xec])).value, name: 'tuv' }]
                }))).thenResolve(undefined);
            }
        }
    ]
});
