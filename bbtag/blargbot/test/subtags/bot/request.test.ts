import { Server } from 'node:http';
import { promisify } from 'node:util';

import { BBTagRuntimeError } from '@bbtag/blargbot';
import { EscapeBBTagSubtag, RequestSubtag } from '@bbtag/blargbot/subtags';
import chai, { expect } from 'chai';
import express from 'express';

import { runSubtagTests } from '../SubtagTestSuite.js';

const requests = new Map<string, express.Request>();
const responses = new Map<string, (response: express.Response) => void>();
const server = new Server(express()
    .use(req => {
        void (async () => {
            const chunks = [];
            for await (const chunk of req)
                chunks.push(chunk);
            req.body = Buffer.concat(chunks);
            req.next?.();
        })();
    })
    .all('/*', (req, res) => {
        requests.set(req.url, req);
        const response = responses.get(req.url) ?? (r => r.status(404).end());
        responses.delete(req.url);
        response(res);
    }));

function assertRequest(expected: Partial<express.Request> & Pick<express.Request, 'url'>): void {
    const actual = requests.get(expected.url);
    chai.expect(responses).to.not.contain.keys(expected.url);
    chai.expect(actual).to.not.be.undefined;
    const toCheck = Object.fromEntries(Object.keys(expected).map(e => [e, actual?.[e as keyof express.Request]]));
    chai.expect(toCheck).to.deep.equal(expected);
}

function assertResult(result: string): JObject {
    let parsed: unknown;
    function tryParseResult(result: string): unknown {
        return parsed = JSON.parse(result);
    }
    chai.expect(tryParseResult.bind(null, result)).to.not.throw();
    chai.expect(parsed).to.be.an('object');
    return parsed as JObject;
}

runSubtagTests({
    subtag: RequestSubtag,
    argCountBounds: { min: 1, max: 3 },
    async setup() {
        await promisify(server.listen.bind(server, 19000))();
    },
    async teardown() {
        await promisify(server.close.bind(server))();
    },
    cases: [
        {
            code: '{request;http://localhost:19000/get-test}',
            setup(ctx) {
                responses.set('/get-test', res => res.status(200).json({ response: 'get-test success' }));
                ctx.inject.domains.setup(m => m.canRequestDomain('localhost:19000')).thenReturn(true);
            },
            assert(_, result) {
                assertRequest({
                    url: '/get-test',
                    method: 'GET',
                    headers: defaultHeaders,
                    body: Buffer.from('')
                });
                const response = assertResult(result);
                expect(response).to.deep.equal({
                    body: { response: 'get-test success' },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json; charset=utf-8',
                    date: response.date,
                    url: 'http://localhost:19000/get-test'
                });
                chai.expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                chai.expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;http://localhost:19000/empty-post;{escapebbtag;{"method":"post"}}}',
            subtags: [EscapeBBTagSubtag],
            setup(ctx) {
                responses.set('/empty-post', res => res.status(200).json({ response: 'empty-post success' }));
                ctx.inject.domains.setup(m => m.canRequestDomain('localhost:19000')).thenReturn(true);
            },
            assert(_, result) {
                assertRequest({
                    method: 'POST',
                    url: '/empty-post',
                    headers: {
                        ...defaultHeaders,
                        ['content-length']: '0'
                    },
                    body: Buffer.from('')
                });
                const response = assertResult(result);
                chai.expect(response).to.deep.equal({
                    body: { response: 'empty-post success' },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json; charset=utf-8',
                    date: response.date,
                    url: 'http://localhost:19000/empty-post'
                });
                chai.expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                chai.expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;http://localhost:19000/post-with-json;{escapebbtag;{"method":"post","headers":{"x-test":true}}};{escapebbtag;{"age":123}}}',
            subtags: [EscapeBBTagSubtag],
            setup(ctx) {
                responses.set('/post-with-json', res => res.status(200).json({ response: 'post-with-json success' }));
                ctx.inject.domains.setup(m => m.canRequestDomain('localhost:19000')).thenReturn(true);
            },
            assert(_, result) {
                assertRequest({
                    method: 'POST',
                    url: '/post-with-json',
                    headers: {
                        ...defaultHeaders,
                        ['content-type']: 'application/json',
                        ['content-length']: '11',
                        ['x-test']: 'true'
                    },
                    body: Buffer.from('{"age":123}')
                });
                const response = assertResult(result);
                chai.expect(response).to.deep.equal({
                    body: { response: 'post-with-json success' },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json; charset=utf-8',
                    date: response.date,
                    url: 'http://localhost:19000/post-with-json'
                });
                chai.expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                chai.expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;http://localhost:19000/post-with-text;{escapebbtag;{"method":"post","headers":{"x-test":true}}};{escapebbtag;This isnt json}}',
            subtags: [EscapeBBTagSubtag],
            setup(ctx) {
                responses.set('/post-with-text', res => res.status(200).json({ response: 'post-with-text success' }));
                ctx.inject.domains.setup(m => m.canRequestDomain('localhost:19000')).thenReturn(true);
            },
            assert(_, result) {
                assertRequest({
                    method: 'POST',
                    url: '/post-with-text',
                    headers: {
                        ...defaultHeaders,
                        ['content-type']: 'text/plain;charset=UTF-8',
                        ['content-length']: '14',
                        ['x-test']: 'true'
                    },
                    body: Buffer.from('This isnt json')
                });
                const response = assertResult(result);
                chai.expect(response).to.deep.equal({
                    body: { response: 'post-with-text success' },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json; charset=utf-8',
                    date: response.date,
                    url: 'http://localhost:19000/post-with-text'
                });
                chai.expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                chai.expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;http://localhost:19000/post-with-text-json;{escapebbtag;{"method":"post","headers":{"x-test":true,"content-type":"text/plain"}}};{escapebbtag;{"age":123}}}',
            subtags: [EscapeBBTagSubtag],
            setup(ctx) {
                responses.set('/post-with-text-json', res => res.status(200).json({ response: 'post-with-text-json success' }));
                ctx.inject.domains.setup(m => m.canRequestDomain('localhost:19000')).thenReturn(true);
            },
            assert(_, result) {
                assertRequest({
                    method: 'POST',
                    url: '/post-with-text-json',
                    headers: {
                        ...defaultHeaders,
                        ['content-type']: 'text/plain',
                        ['content-length']: '11',
                        ['x-test']: 'true'
                    },
                    body: Buffer.from('{"age":123}')
                });
                const response = assertResult(result);
                chai.expect(response).to.deep.equal({
                    body: { response: 'post-with-text-json success' },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json; charset=utf-8',
                    date: response.date,
                    url: 'http://localhost:19000/post-with-text-json'
                });
                chai.expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                chai.expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;http://localhost:19000/get-with-query;{escapebbtag;{"method":"get","headers":{"x-test":true}}};{escapebbtag;{"age":123}}}',
            subtags: [EscapeBBTagSubtag],
            setup(ctx) {
                responses.set('/get-with-query?age=123', res => res.status(200).json({ response: 'get-with-query success' }));
                ctx.inject.domains.setup(m => m.canRequestDomain('localhost:19000')).thenReturn(true);
            },
            assert(_, result) {
                assertRequest({
                    method: 'GET',
                    url: '/get-with-query?age=123',
                    headers: {
                        ...defaultHeaders,
                        ['x-test']: 'true'
                    },
                    body: Buffer.from('')
                });
                const response = assertResult(result);
                chai.expect(response).to.deep.equal({
                    body: { response: 'get-with-query success' },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json; charset=utf-8',
                    date: response.date,
                    url: 'http://localhost:19000/get-with-query?age=123'
                });
                chai.expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                chai.expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;http://localhost:19000/get-image-limit}',
            setup(ctx) {
                responses.set('/get-image-limit', res => res.status(200).contentType('image/png').send(randomData(8000000, { seed: 278364828438 })));
                ctx.inject.domains.setup(m => m.canRequestDomain('localhost:19000')).thenReturn(true);
            },
            assert(_, result) {
                assertRequest({
                    method: 'GET',
                    url: '/get-image-limit',
                    headers: defaultHeaders,
                    body: Buffer.from('')
                });
                const response = assertResult(result);
                chai.expect(response).to.deep.equal({
                    body: randomData(8000000, { seed: 278364828438 }).toString('base64'),
                    status: 200,
                    statusText: 'OK',
                    contentType: 'image/png',
                    date: response.date,
                    url: 'http://localhost:19000/get-image-limit'
                });
                chai.expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                chai.expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;http://localhost:19000/get-forbidden}',
            expected: '`403 Forbidden`',
            errors: [
                { start: 0, end: 46, error: new BBTagRuntimeError('403 Forbidden') }
            ],
            setup(ctx) {
                responses.set('/get-forbidden', res => res.status(403).send('nope'));
                ctx.inject.domains.setup(m => m.canRequestDomain('localhost:19000')).thenReturn(true);
            },
            assert() {
                assertRequest({
                    method: 'GET',
                    url: '/get-forbidden',
                    headers: defaultHeaders,
                    body: Buffer.from('')
                });
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
            code: `{request;${import.meta.url}}`,
            expected: `\`A domain could not be extracted from url: ${import.meta.url}\``,
            errors: [
                { start: 0, end: 10 + import.meta.url.length, error: new BBTagRuntimeError(`A domain could not be extracted from url: ${import.meta.url}`) }
            ]
        },
        {
            code: '{request;http://localhost:19000/never-called}',
            expected: '`Domain is not whitelisted: localhost:19000`',
            errors: [
                { start: 0, end: 45, error: new BBTagRuntimeError('Domain is not whitelisted: localhost:19000') }
            ],
            setup(ctx) {
                ctx.inject.domains.setup(m => m.canRequestDomain('localhost:19000')).thenReturn(false);
            }
        },
        {
            code: '{request;http://localhost:19000/never-called;this isnt a valid option}',
            expected: '``',
            errors: [
                { start: 0, end: 70, error: new BBTagRuntimeError('', 'Invalid request options "this isnt a valid option"') }
            ],
            setup(ctx) {
                ctx.inject.domains.setup(m => m.canRequestDomain('localhost:19000')).thenReturn(true);
            }
        }
    ]
});

const defaultHeaders = {
    ['accept']: '*/*',
    ['accept-encoding']: 'gzip, deflate, br',
    ['connection']: 'close',
    ['host']: 'localhost:19000',
    ['user-agent']: 'node-fetch'
};

function randomData(size: number, options = { seed: performance.now() }): Buffer {
    if (size % 4 !== 0)
        throw new Error('Size must be a multiple of 4');
    const rng = seededRng(options.seed);
    const data = Array.from({ length: size / 4 }, () => rng.next() * 0xFFFFFFFF);
    return Buffer.from(new Uint32Array(data));
}

function seededRng(seed: number): { next(): number; } {
    let a = 0x9E3779B9; // phi
    let b = 0x243F6A88; // pi
    let c = 0xB7E15162; // e
    let d = seed ^ 0xDEADBEEF; // funny word in base16
    return {
        next() {
            // sfc32
            a >>>= 0;
            b >>>= 0;
            c >>>= 0;
            d >>>= 0;
            let t = a + b | 0;
            a = b ^ b >>> 9;
            b = c + (c << 3) | 0;
            c = c << 21 | c >>> 11;
            d = d + 1 | 0;
            t = t + d | 0;
            c = c + t | 0;
            return (t >>> 0) / 4294967296;
        }
    };
}
