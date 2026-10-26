import assert from 'node:assert/strict';

import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { CanRequestDomainFeature, HttpFetchFeature } from '@blargbot/bbtag/subtags';
import { EscapeBBTagSubtag, RequestSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<HttpFetchFeature & CanRequestDomainFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new RequestSubtag(features.instance),
    argCountBounds: { min: 1, max: 3 },
    names: ['request'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{request;https://httpbin.org/status/200}',
            setup(ctx) {
                features.setup(m => m.canRequestDomain('httpbin.org')).resolves(true);
                const response = ctx.createMock<Response>({ id: 'response' });
                features.setup((m, $) => m.fetch('https://httpbin.org/status/200', $({
                    method: 'GET',
                    headers: {},
                    body: undefined
                })))
                    .resolves(response.instance);
                response.setup(m => m.status).returns(200);
                response.setup(m => m.statusText).returns('OK');
                response.setup(m => m.headers).returns(new Headers({
                    'Content-Type': 'text/html; charset=utf-8',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).returns('https://httpbin.org/status/200');
                response.setup(m => m.text()).resolves('Success!');
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                assert.deepEqual(response, {
                    body: 'Success!',
                    status: 200,
                    statusText: 'OK',
                    contentType: 'text/html; charset=utf-8',
                    date: 'Wed, 26 Aug 2026 12:16:19 GMT',
                    url: 'https://httpbin.org/status/200'
                });
            }
        },
        {
            code: '{request;https://httpbin.org/post;{escapebbtag;{"method":"post"}}}',
            subtags: [new EscapeBBTagSubtag()],
            setup(ctx) {
                features.setup(m => m.canRequestDomain('httpbin.org')).resolves(true);
                const response = ctx.createMock<Response>({ id: 'response' });
                features.setup((m, $) => m.fetch('https://httpbin.org/post', $({
                    method: 'POST',
                    headers: {},
                    body: ''
                })))
                    .resolves(response.instance);
                response.setup(m => m.status).returns(200);
                response.setup(m => m.statusText).returns('OK');
                response.setup(m => m.headers).returns(new Headers({
                    'Content-Type': 'application/json',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).returns('https://httpbin.org/post');
                response.setup(m => m.json()).resolves({
                    success: true
                });
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                assert.deepEqual(response, {
                    body: {
                        success: true
                    },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: 'Wed, 26 Aug 2026 12:16:19 GMT',
                    url: 'https://httpbin.org/post'
                });
            }
        },
        {
            code: '{request;https://httpbin.org/post;{escapebbtag;{"method":"post","headers":{"x-test":true}}};{escapebbtag;{"age":123}}}',
            subtags: [new EscapeBBTagSubtag()],
            setup(ctx) {
                features.setup(m => m.canRequestDomain('httpbin.org')).resolves(true);
                const response = ctx.createMock<Response>({ id: 'response' });
                features.setup((m, $) => m.fetch('https://httpbin.org/post', $({
                    method: 'POST',
                    headers: {
                        'x-test': 'true',
                        'Content-Type': 'application/json'
                    },
                    body: '{"age":123}'
                })))
                    .resolves(response.instance);
                response.setup(m => m.status).returns(200);
                response.setup(m => m.statusText).returns('OK');
                response.setup(m => m.headers).returns(new Headers({
                    'Content-Type': 'application/json',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).returns('https://httpbin.org/post');
                response.setup(m => m.json()).resolves({
                    success: true
                });
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                assert.deepEqual(response, {
                    body: {
                        success: true
                    },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: 'Wed, 26 Aug 2026 12:16:19 GMT',
                    url: 'https://httpbin.org/post'
                });
            }
        },
        {
            code: '{request;https://httpbin.org/post;{escapebbtag;{"method":"post","headers":{"x-test":true}}};{escapebbtag;This isnt json}}',
            subtags: [new EscapeBBTagSubtag()],
            setup(ctx) {
                features.setup(m => m.canRequestDomain('httpbin.org')).resolves(true);
                const response = ctx.createMock<Response>({ id: 'response' });
                features.setup((m, $) => m.fetch('https://httpbin.org/post', $({
                    method: 'POST',
                    headers: {
                        'x-test': 'true'
                    },
                    body: 'This isnt json'
                })))
                    .resolves(response.instance);
                response.setup(m => m.status).returns(200);
                response.setup(m => m.statusText).returns('OK');
                response.setup(m => m.headers).returns(new Headers({
                    'Content-Type': 'application/json',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).returns('https://httpbin.org/post');
                response.setup(m => m.json()).resolves({
                    success: true
                });
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                assert.deepEqual(response, {
                    body: {
                        success: true
                    },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: 'Wed, 26 Aug 2026 12:16:19 GMT',
                    url: 'https://httpbin.org/post'
                });
            }
        },
        {
            code: '{request;https://httpbin.org/post;{escapebbtag;{"method":"post","headers":{"x-test":true,"content-type":"text/plain"}}};{escapebbtag;{"age":123}}}',
            subtags: [new EscapeBBTagSubtag()],
            setup(ctx) {
                features.setup(m => m.canRequestDomain('httpbin.org')).resolves(true);
                const response = ctx.createMock<Response>({ id: 'response' });
                features.setup((m, $) => m.fetch('https://httpbin.org/post', $({
                    method: 'POST',
                    headers: {
                        'x-test': 'true',
                        'content-type': 'text/plain'
                    },
                    body: '{"age":123}'
                })))
                    .resolves(response.instance);
                response.setup(m => m.status).returns(200);
                response.setup(m => m.statusText).returns('OK');
                response.setup(m => m.headers).returns(new Headers({
                    'Content-Type': 'application/json',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).returns('https://httpbin.org/post');
                response.setup(m => m.json()).resolves({
                    success: true
                });
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                assert.deepEqual(response, {
                    body: {
                        success: true
                    },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: 'Wed, 26 Aug 2026 12:16:19 GMT',
                    url: 'https://httpbin.org/post'
                });
            }
        },
        {
            code: '{request;https://httpbin.org/get;{escapebbtag;{"method":"get","headers":{"x-test":true}}};{escapebbtag;{"age":123}}}',
            subtags: [new EscapeBBTagSubtag()],
            setup(ctx) {
                features.setup(m => m.canRequestDomain('httpbin.org')).resolves(true);
                const response = ctx.createMock<Response>({ id: 'response' });
                features.setup((m, $) => m.fetch('https://httpbin.org/get?age=123', $({
                    method: 'GET',
                    headers: {
                        'x-test': 'true'
                    },
                    body: undefined
                })))
                    .resolves(response.instance);
                response.setup(m => m.status).returns(200);
                response.setup(m => m.statusText).returns('OK');
                response.setup(m => m.headers).returns(new Headers({
                    'Content-Type': 'application/json',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).returns('https://httpbin.org/get?age=123');
                response.setup(m => m.json()).resolves({
                    success: true
                });
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                assert.deepEqual(response, {
                    body: {
                        success: true
                    },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: 'Wed, 26 Aug 2026 12:16:19 GMT',
                    url: 'https://httpbin.org/get?age=123'
                });
            }
        },
        {
            code: '{request;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            setup(ctx) {
                features.setup(m => m.canRequestDomain('cdn.discordapp.com')).resolves(true);
                const response = ctx.createMock<Response>({ id: 'response' });
                features.setup((m, $) => m.fetch('https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png', $({
                    method: 'GET',
                    headers: {},
                    body: undefined
                })))
                    .resolves(response.instance);
                response.setup(m => m.status).returns(200);
                response.setup(m => m.statusText).returns('OK');
                response.setup(m => m.headers).returns(new Headers({
                    'Content-Type': 'image/png',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).returns('https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png');
                const body = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf', 'base64');
                response.setup(m => m.body).returns(ReadableStream.from([body.subarray(0, 15), body.subarray(15)]));
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                assert.deepEqual(response, {
                    body: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf',
                    status: 200,
                    statusText: 'OK',
                    contentType: 'image/png',
                    date: 'Wed, 26 Aug 2026 12:16:19 GMT',
                    url: 'https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png'
                });
            }
        },
        {
            code: '{request;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab2.png}',
            expected: '`403 Forbidden`',
            errors: [
                { error: new BBTagRuntimeError('403 Forbidden') }
            ],
            setup(ctx) {
                features.setup(m => m.canRequestDomain('cdn.discordapp.com')).resolves(true);
                const response = ctx.createMock<Response>({ id: 'response' });
                features.setup((m, $) => m.fetch('https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab2.png', $({
                    method: 'GET',
                    headers: {},
                    body: undefined
                })))
                    .resolves(response.instance);
                response.setup(m => m.status).returns(403);
                response.setup(m => m.statusText).returns('Forbidden');
            }
        },
        {
            code: '{request;a}',
            expected: '`A domain could not be extracted from url: a`',
            errors: [
                { error: new BBTagRuntimeError('A domain could not be extracted from url: a') }
            ]
        },
        {
            code: '{request;http://test.com}',
            expected: '`Domain is not whitelisted: test.com`',
            errors: [
                { error: new BBTagRuntimeError('Domain is not whitelisted: test.com') }
            ],
            setup() {
                features.setup(m => m.canRequestDomain('test.com')).resolves(false);
            }
        },
        {
            code: '{request;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab2.png;this isnt a valid option}',
            expected: '``',
            errors: [
                { error: new BBTagRuntimeError('', 'Invalid request options "this isnt a valid option"') }
            ],
            setup() {
                features.setup(m => m.canRequestDomain('cdn.discordapp.com')).resolves(true);
            }
        }
    ]
});
