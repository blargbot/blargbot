import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { RequestSubtag } from '@blargbot/bbtag/subtags/bot/request';
import { EscapeBbtagSubtag } from '@blargbot/bbtag/subtags/misc/escapebbtag';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RequestSubtag(),
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{request;https://httpbin.org/status/200}',
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).to.deep.equal({
                    body: '',
                    status: 200,
                    statusText: 'OK',
                    contentType: 'text/html; charset=utf-8',
                    date: response.date,
                    url: 'https://httpbin.org/status/200'
                });
                expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;https://httpbin.org/post;{escapebbtag;{"method":"post"}}}',
            subtags: [new EscapeBbtagSubtag()],
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).excludingEvery(['X-Amzn-Trace-Id', 'origin']).to.deep.equal({
                    body: {
                        args: {},
                        data: '',
                        files: {},
                        form: {},
                        headers: {
                            ['Accept']: '*/*',
                            ['Accept-Encoding']: 'gzip,deflate',
                            ['Content-Length']: '0',
                            ['Content-Type']: 'text/plain;charset=UTF-8',
                            ['Host']: 'httpbin.org',
                            ['User-Agent']: 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)'
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
                expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;https://httpbin.org/post;{escapebbtag;{"method":"post","headers":{"x-test":true}}};{escapebbtag;{"age":123}}}',
            subtags: [new EscapeBbtagSubtag()],
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).excludingEvery(['X-Amzn-Trace-Id', 'origin']).to.deep.equal({
                    body: {
                        args: {},
                        data: '{"age":123}',
                        files: {},
                        form: {},
                        headers: {
                            ['Accept']: '*/*',
                            ['Accept-Encoding']: 'gzip,deflate',
                            ['Content-Length']: '11',
                            ['Content-Type']: 'application/json',
                            ['Host']: 'httpbin.org',
                            ['User-Agent']: 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
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
                expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;https://httpbin.org/post;{escapebbtag;{"method":"post","headers":{"x-test":true}}};{escapebbtag;This isnt json}}',
            subtags: [new EscapeBbtagSubtag()],
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).excludingEvery(['X-Amzn-Trace-Id', 'origin']).to.deep.equal({
                    body: {
                        args: {},
                        data: 'This isnt json',
                        files: {},
                        form: {},
                        headers: {
                            ['Accept']: '*/*',
                            ['Accept-Encoding']: 'gzip,deflate',
                            ['Content-Length']: '14',
                            ['Content-Type']: 'text/plain;charset=UTF-8',
                            ['Host']: 'httpbin.org',
                            ['User-Agent']: 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
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
                expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;https://httpbin.org/post;{escapebbtag;{"method":"post","headers":{"x-test":true,"content-type":"text/plain"}}};{escapebbtag;{"age":123}}}',
            subtags: [new EscapeBbtagSubtag()],
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).excludingEvery(['X-Amzn-Trace-Id', 'origin']).to.deep.equal({
                    body: {
                        args: {},
                        data: '{"age":123}',
                        files: {},
                        form: {},
                        headers: {
                            ['Accept']: '*/*',
                            ['Accept-Encoding']: 'gzip,deflate',
                            ['Content-Length']: '11',
                            ['Content-Type']: 'text/plain',
                            ['Host']: 'httpbin.org',
                            ['User-Agent']: 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
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
                expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;https://httpbin.org/get;{escapebbtag;{"method":"get","headers":{"x-test":true}}};{escapebbtag;{"age":123}}}',
            subtags: [new EscapeBbtagSubtag()],
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('httpbin.org')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).excludingEvery(['X-Amzn-Trace-Id', 'origin']).to.deep.equal({
                    body: {
                        args: {
                            age: '123'
                        },
                        headers: {
                            ['Accept']: '*/*',
                            ['Accept-Encoding']: 'gzip,deflate',
                            ['Host']: 'httpbin.org',
                            ['User-Agent']: 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
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
                expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('cdn.discordapp.com')).thenReturn(true);
            },
            assert(_, result) {
                const response = JSON.parse(result) as JObject;
                expect(response).to.deep.equal({
                    body: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC4UlEQVQ4EV2TS0xTQRSGa3sVJZGoMdpYWipcsSg0pSDYptJSESpagq8CWmvVUgWbgC8oaK0WRBMf+H7EBwYfUaPGxNfCa4gbFy6ICxeujS5cuXfzmRlTFG9ycmfm/uebOXPPrzMaFrNihp8FhhLGIg8xzF9Gt32QqY61JIsHSTvOoxR6SS4eYKo9wFhkVGpFjsjVuWfUyoWZUwoYi9xEiz3niPU4SmENe819dNkzKAvdJBb1cTQ0LDVCKzYUEJ0YiIVsHPMn0WKP+JX6hBZ7xruOJ/xKfUSLPebYqp4JXRaiyya+KrpP0pqmtjCGZnuKovrRPA944r2BYq1lRL2EzxSh23aEe2W3J0ASoM9zop9TjpLvRrM/x2eJopQ20l3UT2JJP/pZTqryQ7wsGEU/qwKDcTn6vHIJkYB5c20cbO7kwaLruIwhFFM1vabDMtEwt5yUeQD97Ep8+VFG1StS63QGJgNeHBjk57WHVNiD6PMc9JpSyJPlOUiZM3LsqW7h65lbjA+PMAkg7kEtdeOpW09d01ZWeTfj94Rk1Pu2cOqihfQhN2dHzPjXtNHUEp98B6KE3Woce3U9l67docuW4MKVW6wMhkn02Xl99wKnbQO8uXeRjp4ymtvi1Jj/K2FXUQxbuQ/xfAm/l++GdVH2Zxz8+KzxfeNHvo2/lYAtdXHWLNzw9w5ECUOWXtSlLtoTPTJ5X98AAhBYv50TV82Mf0jzSMslUtNBxpuZXIIjx4XD6GFbQZi1pSEcyxuo8DRyrjPJ7d4h6psjMtraV/L0sp1gVZiyadV/TiD62ZnjlpN6NSghK4oDspzW1a3EW9qp8gZpde0kVtLO0B6P1Ioc6YVl0z0TXhj1D7PAXEaiaJf8K0aTSr6lRAI2WTbhNzdyMpCWANs0J+LkOmGIbDuL/g9YgyxVKnFZ/RQUO2XsKIwyJ1eV34Qvsnpppn8BAWuDNNGgtx8RAiYiOxduFZp/Ab8B3ajWK9lV5k8AAAAASUVORK5CYII=',
                    status: 200,
                    statusText: 'OK',
                    contentType: 'image/png',
                    date: response.date,
                    url: 'https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png'
                });
                expect(response.date).to.be.string('');
                const date = new Date(response.date as string);
                expect(date).to.be.closeToTime(new Date(), 10);
            }
        },
        {
            code: '{request;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab2.png}',
            expected: '`403 Forbidden`',
            errors: [
                { start: 0, end: 124, error: new BBTagRuntimeError('403 Forbidden') }
            ],
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
            setup(ctx) {
                ctx.util.setup(m => m.canRequestDomain('cdn.discordapp.com')).thenReturn(true);
            }
        }
    ]
});
