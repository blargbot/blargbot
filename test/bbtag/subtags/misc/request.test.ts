import assert from 'node:assert/strict';

import type { RequestLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<RequestLocals>({
    replacer: replacers.requestReplacer,
    names: ['request'],
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{request;https://httpbin.org/status/200}',
            setup(ctx) {
                ctx.locals.setup(m => m.canRequestDomain('httpbin.org')).resolves(true).mustHappen(1);
                ctx.locals.setup((m, $) => m.httpRequest($({
                    method: 'GET',
                    url: 'https://httpbin.org/status/200',
                    headers: $.setEqual([]),
                    body: new Uint8Array(0)
                }))).resolves({
                    url: 'https://httpbin.org/status/200',
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({
                        'Content-Type': 'text/html; charset=utf-8',
                        'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                    }),
                    body: toBytes('Success!'),
                    isTruncated: false
                });
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
            code: '{request;https://httpbin.org/status/200}',
            expected: '`Response too large`',
            errors: [
                { start: 0, end: 40, error: new BBTagRuntimeError('Response too large') }
            ],
            setup(ctx) {
                ctx.locals.setup(m => m.canRequestDomain('httpbin.org')).resolves(true).mustHappen(1);
                ctx.locals.setup((m, $) => m.httpRequest($({
                    method: 'GET',
                    url: 'https://httpbin.org/status/200',
                    headers: $.setEqual([]),
                    body: new Uint8Array(0)
                }))).resolves({
                    url: 'https://httpbin.org/status/200',
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({
                        'Content-Type': 'text/html; charset=utf-8',
                        'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                    }),
                    body: toBytes('Failed!'),
                    isTruncated: true
                });
            }
        },
        {
            code: '{request;https://httpbin.org/post;{escapebbtag;{"method":"post"}}}',
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                ctx.locals.setup(m => m.canRequestDomain('httpbin.org')).resolves(true).mustHappen(1);
                ctx.locals.setup((m, $) => m.httpRequest($({
                    method: 'POST',
                    url: 'https://httpbin.org/post',
                    headers: $.setEqual([]),
                    body: new Uint8Array(0)
                }))).resolves({
                    url: 'https://httpbin.org/post',
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({
                        'Content-Type': 'application/json',
                        'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                    }),
                    body: toBytes('{"success":true}'),
                    isTruncated: false
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
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                ctx.locals.setup(m => m.canRequestDomain('httpbin.org')).resolves(true).mustHappen(1);
                ctx.locals.setup((m, $) => m.httpRequest($({
                    method: 'POST',
                    url: 'https://httpbin.org/post',
                    headers: $.setEqual([
                        $(['content-type', 'application/json']),
                        $(['x-test', 'true'])
                    ]),
                    body: toBytes('{"age":123}')
                }))).resolves({
                    url: 'https://httpbin.org/post',
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({
                        'Content-Type': 'application/json',
                        'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                    }),
                    body: toBytes('{"success":true}'),
                    isTruncated: false
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
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                ctx.locals.setup(m => m.canRequestDomain('httpbin.org')).resolves(true).mustHappen(1);
                ctx.locals.setup((m, $) => m.httpRequest($({
                    method: 'POST',
                    url: 'https://httpbin.org/post',
                    headers: $.setEqual([
                        $(['x-test', 'true'])
                    ]),
                    body: toBytes('This isnt json')
                }))).resolves({
                    url: 'https://httpbin.org/post',
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({
                        'Content-Type': 'application/json',
                        'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                    }),
                    body: toBytes('{"success":true}'),
                    isTruncated: false
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
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                ctx.locals.setup(m => m.canRequestDomain('httpbin.org')).resolves(true).mustHappen(1);
                ctx.locals.setup((m, $) => m.httpRequest($({
                    method: 'POST',
                    url: 'https://httpbin.org/post',
                    headers: $.setEqual([
                        $(['content-type', 'text/plain']),
                        $(['x-test', 'true'])
                    ]),
                    body: toBytes('{"age":123}')
                }))).resolves({
                    url: 'https://httpbin.org/post',
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({
                        'Content-Type': 'application/json',
                        'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                    }),
                    body: toBytes('{"success":true}'),
                    isTruncated: false
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
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                ctx.locals.setup(m => m.canRequestDomain('httpbin.org')).resolves(true).mustHappen(1);
                ctx.locals.setup((m, $) => m.httpRequest($({
                    method: 'GET',
                    url: 'https://httpbin.org/get?age=123',
                    headers: $.setEqual([
                        $(['x-test', 'true'])
                    ]),
                    body: new Uint8Array(0)
                }))).resolves({
                    url: 'https://httpbin.org/get?age=123',
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({
                        'Content-Type': 'application/json',
                        'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                    }),
                    body: toBytes('{"success":true}'),
                    isTruncated: false
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
            code: '{request;https://httpbin.org/get?seed=1;{escapebbtag;{"method":"get"}};{escapebbtag;{"age":123}}}',
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                const url = 'https://httpbin.org/get?seed=1&age=123';
                ctx.locals.setup(m => m.canRequestDomain('httpbin.org')).resolves(true).mustHappen(1);
                ctx.locals.setup((m, $) => m.httpRequest($({
                    method: 'GET',
                    url,
                    headers: $.setEqual([]),
                    body: new Uint8Array(0)
                }))).resolves({
                    url,
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({ 'Content-Type': 'text/plain' }),
                    body: toBytes('Success!'),
                    isTruncated: false
                });
            },
            assert(_, result) {
                assert.equal((JSON.parse(result) as JObject).url, 'https://httpbin.org/get?seed=1&age=123');
            }
        },
        {
            code: '{request;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            setup(ctx) {
                const url = 'https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png';
                ctx.locals.setup(m => m.canRequestDomain('cdn.discordapp.com')).resolves(true).mustHappen(1);
                ctx.locals.setup((m, $) => m.httpRequest($({
                    method: 'GET',
                    url,
                    headers: $.setEqual([]),
                    body: new Uint8Array(0)
                }))).resolves({
                    url,
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({
                        'Content-Type': 'image/png',
                        'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                    }),
                    body: toBytes('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf', 'base64'),
                    isTruncated: false
                });
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
                { start: 0, end: 124, error: new BBTagRuntimeError('403 Forbidden') }
            ],
            setup(ctx) {
                const url = 'https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab2.png';
                ctx.locals.setup(m => m.canRequestDomain('cdn.discordapp.com')).resolves(true).mustHappen(1);
                ctx.locals.setup((m, $) => m.httpRequest($({
                    method: 'GET',
                    url,
                    headers: $.setEqual([]),
                    body: new Uint8Array(0)
                }))).resolves({
                    url,
                    status: 403,
                    statusText: 'Forbidden',
                    headers: new Headers({}),
                    body: new Uint8Array(0),
                    isTruncated: false
                });
            }
        },
        {
            code: '{request;https://httpbin.org/get;{escapebbtag;{"checkOk":false}}}',
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                ctx.locals.setup(m => m.canRequestDomain('httpbin.org')).resolves(true).mustHappen(1);
                ctx.locals.setup((m, $) => m.httpRequest($({
                    method: 'GET',
                    url: 'https://httpbin.org/get',
                    headers: $.setEqual([]),
                    body: new Uint8Array(0)
                }))).resolves({
                    url: 'https://httpbin.org/get',
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({
                        'Content-Type': 'application/json',
                        'Date': 'Wed, 26 Aug 2026 12:16:19 GMT'
                    }),
                    body: toBytes('{"success":true}'),
                    isTruncated: false
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
                    url: 'https://httpbin.org/get'
                });
            }
        },
        {
            code: '{request;https://httpbin.org/get;{escapebbtag;{"checkOk":false}}}',
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                const url = 'https://httpbin.org/get';
                ctx.locals.setup(m => m.canRequestDomain('httpbin.org')).resolves(true).mustHappen(1);
                ctx.locals.setup((m, $) => m.httpRequest($({
                    method: 'GET',
                    url,
                    headers: $.setEqual([]),
                    body: new Uint8Array(0)
                }))).resolves({
                    url,
                    status: 403,
                    statusText: 'Forbidden',
                    headers: new Headers({ 'Content-Type': 'text/plain' }),
                    body: toBytes('Denied'),
                    isTruncated: false
                });
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                assert.equal(response.status, 403);
                assert.equal(response.body, 'Denied');
            }
        },
        // TODO: Add these tests when domain whitelisting is reimplemented.
        // {
        //     code: '{request;a}',
        //     expected: '`A domain could not be extracted from url: a`',
        //     errors: [
        //         { start: 0, end: 11, error: new BBTagRuntimeError('A domain could not be extracted from url: a') }
        //     ]
        // },
        // {
        //     code: '{request;http://test.com}',
        //     expected: '`Domain is not whitelisted: test.com`',
        //     errors: [
        //         { start: 0, end: 25, error: new BBTagRuntimeError('Domain is not whitelisted: test.com') }
        //     ],
        //     setup(ctx) {
        //         ctx.util.setup(m => m.canRequestDomain('test.com')).thenReturn(false);
        //     }
        // },
        {
            code: '{request;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab2.png;this isnt a valid option}',
            expected: '``',
            errors: [
                { start: 0, end: 149, error: new BBTagRuntimeError('', 'Invalid request options "this isnt a valid option"') }
            ],
            setup(ctx) {
                ctx.locals.setup(m => m.canRequestDomain('cdn.discordapp.com')).resolves(true).mustHappen(1);
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
            setup(ctx) {
                ctx.locals.setup(m => m.canRequestDomain('test.com')).resolves(false).mustHappen(1);
            }
        }
    ]
});

function toBytes(content: string, encoding?: BufferEncoding): Uint8Array {
    const { buffer, byteOffset, byteLength } = Buffer.from(content, encoding);
    return new Uint8Array(buffer, byteOffset, byteLength);
}
