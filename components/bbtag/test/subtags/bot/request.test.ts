import { Server } from 'node:http';
import { promisify } from 'node:util';

import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { RequestSubtag } from '@blargbot/bbtag/subtags/bot/request.js';
import { EscapeBBTagSubtag } from '@blargbot/bbtag/subtags/misc/escapeBBTag.js';
import chai from 'chai';
import express from 'express';

import { runSubtagTests } from '../SubtagTestSuite.js';

const app = express().all('/*', (req, res) => {
    for (const [expected, resolve] of requests) {
        try {
            const keys = new Set(Object.keys(expected));
            const data = Object.fromEntries(Object.entries(req).filter(x => keys.has(x[0])));
            chai.expect(data).to.deep.equal(expected);
        } catch (err: unknown) {
            if (err instanceof chai.AssertionError)
                continue;
            throw err;
        }
        requests.delete(expected);
        resolve(res);
        return;
    }
    res.status(500).json('Failed');
});
const server = new Server(app);
const start = promisify(server.listen.bind(server, 19000));
const stop = promisify(server.close.bind(server));

const requests = new Map<Partial<express.Request>, (res: express.Response) => void>();

runSubtagTests({
    subtag: new RequestSubtag(),
    argCountBounds: { min: 1, max: 3 },
    async setup() {
        await start();
    },
    async teardown() {
        await stop();
    },
    cases: [
        {
            code: '{request;http://localhost:19000/get-test}',
            timeout: 10000,
            setup(ctx) {
                requests.set({ method: 'GET', url: '/get-test' }, res => res.status(200).json({ success: true }));
                ctx.util.setup(m => m.canRequestDomain('localhost:19000')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                chai.expect(response).to.deep.equal({
                    body: { success: true },
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
            subtags: [new EscapeBBTagSubtag()],
            timeout: 10000,
            setup(ctx) {
                requests.set({ method: 'GET', url: '/get-test' }, res => res.status(200).json({ success: true }));
                ctx.util.setup(m => m.canRequestDomain('localhost:19000')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                chai.expect(response).excludingEvery(['X-Amzn-Trace-Id', 'origin']).to.deep.equal({
                    body: { success: true },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: response.date,
                    url: 'http://localhost:19000/empty-post'
                });
                chai.expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                chai.expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;https://httpbin.org/post;{escapebbtag;{"method":"post","headers":{"x-test":true}}};{escapebbtag;{"age":123}}}',
            subtags: [new EscapeBBTagSubtag()],
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                chai.expect(response).excludingEvery(['X-Amzn-Trace-Id', 'origin']).to.deep.equal({
                    body: {
                        args: {},
                        data: '{"age":123}',
                        files: {},
                        form: {},
                        headers: {
                            ['Accept']: '*/*',
                            ['Accept-Encoding']: 'gzip, deflate, br',
                            ['Content-Length']: '11',
                            ['Content-Type']: 'application/json',
                            ['Host']: 'httpbin.org',
                            ['User-Agent']: 'node-fetch',
                            ['X-Test']: 'true'
                        },
                        json: {
                            age: 123
                        },
                        url: 'https://httpbin.org/post'
                    },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: response.date,
                    url: 'https://httpbin.org/post'
                });
                chai.expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                chai.expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;https://httpbin.org/post;{escapebbtag;{"method":"post","headers":{"x-test":true}}};{escapebbtag;This isnt json}}',
            subtags: [new EscapeBBTagSubtag()],
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                chai.expect(response).excludingEvery(['X-Amzn-Trace-Id', 'origin']).to.deep.equal({
                    body: {
                        args: {},
                        data: 'This isnt json',
                        files: {},
                        form: {},
                        headers: {
                            ['Accept']: '*/*',
                            ['Accept-Encoding']: 'gzip, deflate, br',
                            ['Content-Length']: '14',
                            ['Content-Type']: 'text/plain;charset=UTF-8',
                            ['Host']: 'httpbin.org',
                            ['User-Agent']: 'node-fetch',
                            ['X-Test']: 'true'
                        },
                        json: null,
                        url: 'https://httpbin.org/post'
                    },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: response.date,
                    url: 'https://httpbin.org/post'
                });
                chai.expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                chai.expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;https://httpbin.org/post;{escapebbtag;{"method":"post","headers":{"x-test":true,"content-type":"text/plain"}}};{escapebbtag;{"age":123}}}',
            subtags: [new EscapeBBTagSubtag()],
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                chai.expect(response).excludingEvery(['X-Amzn-Trace-Id', 'origin']).to.deep.equal({
                    body: {
                        args: {},
                        data: '{"age":123}',
                        files: {},
                        form: {},
                        headers: {
                            ['Accept']: '*/*',
                            ['Accept-Encoding']: 'gzip, deflate, br',
                            ['Content-Length']: '11',
                            ['Content-Type']: 'text/plain',
                            ['Host']: 'httpbin.org',
                            ['User-Agent']: 'node-fetch',
                            ['X-Test']: 'true'
                        },
                        json: {
                            age: 123
                        },
                        url: 'https://httpbin.org/post'
                    },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: response.date,
                    url: 'https://httpbin.org/post'
                });
                chai.expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                chai.expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;https://httpbin.org/get;{escapebbtag;{"method":"get","headers":{"x-test":true}}};{escapebbtag;{"age":123}}}',
            subtags: [new EscapeBBTagSubtag()],
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                chai.expect(response).excludingEvery(['X-Amzn-Trace-Id', 'origin']).to.deep.equal({
                    body: {
                        args: {
                            age: '123'
                        },
                        headers: {
                            ['Accept']: '*/*',
                            ['Accept-Encoding']: 'gzip, deflate, br',
                            ['Host']: 'httpbin.org',
                            ['User-Agent']: 'node-fetch',
                            ['X-Test']: 'true'
                        },
                        url: 'https://httpbin.org/get?age=123'
                    },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: response.date,
                    url: 'https://httpbin.org/get?age=123'
                });
                chai.expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                chai.expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            timeout: 10000,
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('cdn.discordapp.com')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                chai.expect(response).to.deep.equal({
                    body: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC4UlEQVQ4EV2TS0xTQRSGa3sVJZGoMdpYWipcsSg0pSDYptJSESpagq8CWmvVUgWbgC8oaK0WRBMf+H7EBwYfUaPGxNfCa4gbFy6ICxeujS5cuXfzmRlTFG9ycmfm/uebOXPPrzMaFrNihp8FhhLGIg8xzF9Gt32QqY61JIsHSTvOoxR6SS4eYKo9wFhkVGpFjsjVuWfUyoWZUwoYi9xEiz3niPU4SmENe819dNkzKAvdJBb1cTQ0LDVCKzYUEJ0YiIVsHPMn0WKP+JX6hBZ7xruOJ/xKfUSLPebYqp4JXRaiyya+KrpP0pqmtjCGZnuKovrRPA944r2BYq1lRL2EzxSh23aEe2W3J0ASoM9zop9TjpLvRrM/x2eJopQ20l3UT2JJP/pZTqryQ7wsGEU/qwKDcTn6vHIJkYB5c20cbO7kwaLruIwhFFM1vabDMtEwt5yUeQD97Ep8+VFG1StS63QGJgNeHBjk57WHVNiD6PMc9JpSyJPlOUiZM3LsqW7h65lbjA+PMAkg7kEtdeOpW09d01ZWeTfj94Rk1Pu2cOqihfQhN2dHzPjXtNHUEp98B6KE3Woce3U9l67docuW4MKVW6wMhkn02Xl99wKnbQO8uXeRjp4ymtvi1Jj/K2FXUQxbuQ/xfAm/l++GdVH2Zxz8+KzxfeNHvo2/lYAtdXHWLNzw9w5ECUOWXtSlLtoTPTJ5X98AAhBYv50TV82Mf0jzSMslUtNBxpuZXIIjx4XD6GFbQZi1pSEcyxuo8DRyrjPJ7d4h6psjMtraV/L0sp1gVZiyadV/TiD62ZnjlpN6NSghK4oDspzW1a3EW9qp8gZpde0kVtLO0B6P1Ioc6YVl0z0TXhj1D7PAXEaiaJf8K0aTSr6lRAI2WTbhNzdyMpCWANs0J+LkOmGIbDuL/g9YgyxVKnFZ/RQUO2XsKIwyJ1eV34Qvsnpppn8BAWuDNNGgtx8RAiYiOxduFZp/Ab8B3ajWK9lV5k8AAAAASUVORK5CYII=',
                    status: 200,
                    statusText: 'OK',
                    contentType: 'image/png',
                    date: response.date,
                    url: 'https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png'
                });
                chai.expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                chai.expect(date).to.be.closeToTime(new Date(), 10);
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
