import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { RequestSubtag } from '@blargbot/bbtag/subtags/bot/request.js';
import { EscapeBBTagSubtag } from '@blargbot/bbtag/subtags/misc/escapeBBTag.js';
import { argument } from '@blargbot/test-util/mock.js';
import { expect } from 'chai';
import { Headers } from 'node-fetch';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new RequestSubtag(),
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{request;https://httpbin.org/status/200}',
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
                const response = ctx.createFetchResponse();
                ctx.dependencies.setup(m => m.fetch('https://httpbin.org/status/200', argument.isDeepEqual({
                    method: 'GET',
                    headers: {},
                    size: 8000000,
                    body: undefined
                })))
                    .thenResolve(response.instance);
                response.setup(m => m.status).thenReturn(200);
                response.setup(m => m.statusText).thenReturn('OK');
                response.setup(m => m.headers).thenReturn(new Headers({
                    'Content-Type': 'text/html; charset=utf-8',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).thenReturn('https://httpbin.org/status/200');
                response.setup(m => m.text()).thenResolve('Success!');
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).to.deep.equal({
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
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
                const response = ctx.createFetchResponse();
                ctx.dependencies.setup(m => m.fetch('https://httpbin.org/post', argument.isDeepEqual({
                    method: 'POST',
                    headers: {},
                    size: 8000000,
                    body: ''
                })))
                    .thenResolve(response.instance);
                response.setup(m => m.status).thenReturn(200);
                response.setup(m => m.statusText).thenReturn('OK');
                response.setup(m => m.headers).thenReturn(new Headers({
                    'Content-Type': 'application/json',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).thenReturn('https://httpbin.org/post');
                response.setup(m => m.json()).thenResolve({
                    success: true
                });
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).to.deep.equal({
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
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
                const response = ctx.createFetchResponse();
                ctx.dependencies.setup(m => m.fetch('https://httpbin.org/post', argument.isDeepEqual({
                    method: 'POST',
                    headers: {
                        'x-test': 'true',
                        'Content-Type': 'application/json'
                    },
                    size: 8000000,
                    body: '{"age":123}'
                })))
                    .thenResolve(response.instance);
                response.setup(m => m.status).thenReturn(200);
                response.setup(m => m.statusText).thenReturn('OK');
                response.setup(m => m.headers).thenReturn(new Headers({
                    'Content-Type': 'application/json',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).thenReturn('https://httpbin.org/post');
                response.setup(m => m.json()).thenResolve({
                    success: true
                });
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).to.deep.equal({
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
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
                const response = ctx.createFetchResponse();
                ctx.dependencies.setup(m => m.fetch('https://httpbin.org/post', argument.isDeepEqual({
                    method: 'POST',
                    headers: {
                        'x-test': 'true'
                    },
                    size: 8000000,
                    body: 'This isnt json'
                })))
                    .thenResolve(response.instance);
                response.setup(m => m.status).thenReturn(200);
                response.setup(m => m.statusText).thenReturn('OK');
                response.setup(m => m.headers).thenReturn(new Headers({
                    'Content-Type': 'application/json',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).thenReturn('https://httpbin.org/post');
                response.setup(m => m.json()).thenResolve({
                    success: true
                });
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).to.deep.equal({
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
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
                const response = ctx.createFetchResponse();
                ctx.dependencies.setup(m => m.fetch('https://httpbin.org/post', argument.isDeepEqual({
                    method: 'POST',
                    headers: {
                        'x-test': 'true',
                        'content-type': 'text/plain'
                    },
                    size: 8000000,
                    body: '{"age":123}'
                })))
                    .thenResolve(response.instance);
                response.setup(m => m.status).thenReturn(200);
                response.setup(m => m.statusText).thenReturn('OK');
                response.setup(m => m.headers).thenReturn(new Headers({
                    'Content-Type': 'application/json',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).thenReturn('https://httpbin.org/post');
                response.setup(m => m.json()).thenResolve({
                    success: true
                });
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).to.deep.equal({
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
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
                const response = ctx.createFetchResponse();
                ctx.dependencies.setup(m => m.fetch('https://httpbin.org/get?age=123', argument.isDeepEqual({
                    method: 'GET',
                    headers: {
                        'x-test': 'true'
                    },
                    size: 8000000,
                    body: undefined
                })))
                    .thenResolve(response.instance);
                response.setup(m => m.status).thenReturn(200);
                response.setup(m => m.statusText).thenReturn('OK');
                response.setup(m => m.headers).thenReturn(new Headers({
                    'Content-Type': 'application/json',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).thenReturn('https://httpbin.org/get?age=123');
                response.setup(m => m.json()).thenResolve({
                    success: true
                });
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).to.deep.equal({
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
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('cdn.discordapp.com')).thenReturn(true);
                const response = ctx.createFetchResponse();
                ctx.dependencies.setup(m => m.fetch('https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png', argument.isDeepEqual({
                    method: 'GET',
                    headers: {},
                    size: 8000000,
                    body: undefined
                })))
                    .thenResolve(response.instance);
                response.setup(m => m.status).thenReturn(200);
                response.setup(m => m.statusText).thenReturn('OK');
                response.setup(m => m.headers).thenReturn(new Headers({
                    'Content-Type': 'image/png',
                    'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                }));
                response.setup(m => m.url).thenReturn('https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png');
                response.setup(m => m.arrayBuffer()).thenResolve(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf', 'base64'));
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).to.deep.equal({
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
                { start: 0, end: 124, error: new BBTagRuntimeError('403 Forbidden') }
            ],
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('cdn.discordapp.com')).thenReturn(true);
                const response = ctx.createFetchResponse();
                ctx.dependencies.setup(m => m.fetch('https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab2.png', argument.isDeepEqual({
                    method: 'GET',
                    headers: {},
                    size: 8000000,
                    body: undefined
                })))
                    .thenResolve(response.instance);
                response.setup(m => m.status).thenReturn(403);
                response.setup(m => m.statusText).thenReturn('Forbidden');
            }
        },
        {
            code: '{request;a}',
            expected: '`A domain could not be extracted from url: a`',
            errors: [
                { start: 0, end: 11, error: new BBTagRuntimeError('A domain could not be extracted from url: a') }
            ]
        },
        {
            code: '{request;http://test.com}',
            expected: '`Domain is not whitelisted: test.com`',
            errors: [
                { start: 0, end: 25, error: new BBTagRuntimeError('Domain is not whitelisted: test.com') }
            ],
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('test.com')).thenReturn(false);
            }
        },
        {
            code: '{request;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab2.png;this isnt a valid option}',
            expected: '``',
            errors: [
                { start: 0, end: 149, error: new BBTagRuntimeError('', 'Invalid request options "this isnt a valid option"') }
            ],
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('cdn.discordapp.com')).thenReturn(true);
            }
        }
    ]
});
