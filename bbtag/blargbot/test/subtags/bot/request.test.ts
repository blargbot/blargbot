import { BBTagRuntimeError } from '@bbtag/blargbot';
import { EscapeBBTagSubtag, RequestSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { setupRequestResponse } from '../setupRequestResponse.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: RequestSubtag,
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{request;http://localhost:19000/get-test}',
            setup(ctx) {
                setupRequestResponse(ctx,
                    'http://localhost:19000/get-test',
                    {
                        method: 'GET',
                        headers: {},
                        size: 8000000,
                        body: undefined
                    },
                    {
                        status: 200,
                        statusText: 'OK',
                        headers: {
                            'content-type': 'application/json',
                            'date': 'abc123'
                        },
                        json: { response: 'get-test success' }
                    }
                );
            },
            assert(_, result) {
                assertResult(result, {
                    body: { response: 'get-test success' },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: 'abc123',
                    url: 'http://localhost:19000/get-test'
                });
            }
        },
        {
            code: '{request;http://localhost:19000/empty-post;{escapebbtag;{"method":"post"}}}',
            subtags: [EscapeBBTagSubtag],
            setup(ctx) {
                setupRequestResponse(ctx,
                    'http://localhost:19000/empty-post',
                    {
                        method: 'POST',
                        headers: {},
                        size: 8000000,
                        body: ''
                    },
                    {
                        status: 200,
                        statusText: 'OK',
                        headers: {
                            'content-type': 'application/json',
                            'date': 'def456'
                        },
                        json: { response: 'empty-post success' }
                    }
                );
            },
            assert(_, result) {
                assertResult(result, {
                    body: { response: 'empty-post success' },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: 'def456',
                    url: 'http://localhost:19000/empty-post'
                });
            }
        },
        {
            code: '{request;http://localhost:19000/post-with-json;{escapebbtag;{"method":"post","headers":{"x-test":true}}};{escapebbtag;{"age":123}}}',
            subtags: [EscapeBBTagSubtag],
            setup(ctx) {
                setupRequestResponse(ctx,
                    'http://localhost:19000/post-with-json',
                    {
                        method: 'POST',
                        headers: {
                            'x-test': 'true',
                            'Content-Type': 'application/json'
                        },
                        size: 8000000,
                        body: '{"age":123}'
                    },
                    {
                        status: 200,
                        statusText: 'OK',
                        headers: {
                            'content-type': 'application/json',
                            'date': 'ghi789'
                        },
                        json: { response: 'post-with-json success' }
                    }
                );
            },
            assert(_, result) {
                assertResult(result, {
                    body: { response: 'post-with-json success' },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: 'ghi789',
                    url: 'http://localhost:19000/post-with-json'
                });
            }
        },
        {
            code: '{request;http://localhost:19000/post-with-text;{escapebbtag;{"method":"post","headers":{"x-test":true}}};{escapebbtag;This isnt json}}',
            subtags: [EscapeBBTagSubtag],
            setup(ctx) {
                setupRequestResponse(ctx,
                    'http://localhost:19000/post-with-text',
                    {
                        method: 'POST',
                        headers: {
                            'x-test': 'true'
                        },
                        size: 8000000,
                        body: 'This isnt json'
                    },
                    {
                        status: 200,
                        statusText: 'OK',
                        headers: {
                            'content-type': 'application/json',
                            'date': 'jkl012'
                        },
                        json: { response: 'post-with-text success' }
                    }
                );
            },
            assert(_, result) {
                assertResult(result, {
                    body: { response: 'post-with-text success' },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: 'jkl012',
                    url: 'http://localhost:19000/post-with-text'
                });
            }
        },
        {
            code: '{request;http://localhost:19000/post-with-text-json;{escapebbtag;{"method":"post","headers":{"x-test":true,"content-type":"text/plain"}}};{escapebbtag;{"age":123}}}',
            subtags: [EscapeBBTagSubtag],
            setup(ctx) {
                setupRequestResponse(ctx,
                    'http://localhost:19000/post-with-text-json',
                    {
                        method: 'POST',
                        headers: {
                            'x-test': 'true',
                            'content-type': 'text/plain'
                        },
                        size: 8000000,
                        body: '{"age":123}'
                    },
                    {
                        status: 200,
                        statusText: 'OK',
                        headers: {
                            'content-type': 'application/json',
                            'date': 'mno345'
                        },
                        json: { response: 'post-with-text-json success' }
                    }
                );
            },
            assert(_, result) {
                assertResult(result, {
                    body: { response: 'post-with-text-json success' },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: 'mno345',
                    url: 'http://localhost:19000/post-with-text-json'
                });
            }
        },
        {
            code: '{request;http://localhost:19000/get-with-query;{escapebbtag;{"method":"get","headers":{"x-test":true}}};{escapebbtag;{"age":123}}}',
            subtags: [EscapeBBTagSubtag],
            setup(ctx) {
                setupRequestResponse(ctx,
                    'http://localhost:19000/get-with-query?age=123',
                    {
                        method: 'GET',
                        headers: {
                            'x-test': 'true'
                        },
                        size: 8000000,
                        body: undefined
                    },
                    {
                        status: 200,
                        statusText: 'OK',
                        headers: {
                            'content-type': 'application/json',
                            'date': 'pqr678'
                        },
                        json: { response: 'get-with-query success' }
                    }
                );
            },
            assert(_, result) {
                assertResult(result, {
                    body: { response: 'get-with-query success' },
                    status: 200,
                    statusText: 'OK',
                    contentType: 'application/json',
                    date: 'pqr678',
                    url: 'http://localhost:19000/get-with-query?age=123'
                });
            }
        },
        {
            code: '{request;http://localhost:19000/get-forbidden}',
            expected: '`403 Forbidden`',
            errors: [
                { start: 0, end: 46, error: new BBTagRuntimeError('403 Forbidden') }
            ],
            setup(ctx) {
                setupRequestResponse(ctx,
                    'http://localhost:19000/get-forbidden',
                    {
                        method: 'GET',
                        headers: {},
                        size: 8000000,
                        body: undefined
                    },
                    {
                        status: 403,
                        statusText: 'Forbidden',
                        headers: {
                            'content-type': 'text/plain',
                            'date': ''
                        },
                        text: ''
                    }
                );
            }
        },
        {
            code: '{request;http://localhost:19000/never-called;this isnt a valid option}',
            expected: '``',
            errors: [
                { start: 0, end: 70, error: new BBTagRuntimeError('', 'Invalid request options "this isnt a valid option"') }
            ]
        }
    ]
});

function assertResult(result: string, expected: JObject): void {
    let parsed: unknown;
    function tryParseResult(result: string): unknown {
        return parsed = JSON.parse(result);
    }
    chai.expect(tryParseResult.bind(null, result)).to.not.throw();
    chai.expect(parsed).to.be.an('object');
    chai.expect(parsed).to.deep.equal(expected);
}
