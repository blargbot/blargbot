import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';
import fetch, { RequestInit } from 'node-fetch';

const domainRegex = /^https?:\/\/(.+?)(?:\/.?|$)/i;

type HTTPMethod = 'GET' | 'PATCH' | 'POST' | 'DELETE' | 'PUT';

interface Header {
    [key: string]: string;
}
interface OptionsObject {
    headers?: Header;
    method: HTTPMethod;
}

interface ResponseObject {
    body: Buffer;
    text?: string;
    status: number;
    statusText: string;
    contentType: string | null;
    date: string | null;
    url: string;
}

export class RequestSubtag extends Subtag {
    public constructor() {
        super({
            name: 'request',
            category: SubtagType.BOT,
            desc: 'Only certain whitelisted domains can be used for `url`. See [here](https://blargbot.xyz/domains) for the list.' +
                'The output is a JSON object with the following structure. It is recommended to use {jsonget} to navigate it.\n' +
                '```json\n{\n  "body": {}, // the body of the request\n  "status": 200, // the HTTP status code\n  "statusText": "OK", // the human readable translation of the status code\n' +
                '  "date": "Thu, 1 Jan 1970 00:00:00 GMT", // the date sent in the headers\n  "contentType": "application/json", // the content type of the response\n' +
                '  "url": "https://fancy.url/here" // the url that was requested\n}\n```',
            definition: [
                {
                    parameters: ['url'],
                    description: 'Performs a GET request to `url`. ',
                    exampleCode: '{jget;{request;https://blargbot.xyz/output/1111111111111111/raw};body}',
                    exampleOut: 'Hello, world!',
                    returns: 'json',
                    execute: (ctx, args) => this.requestUrl(ctx, args[0].value, '', '')
                },
                {
                    parameters: ['url', 'options', 'data?'],
                    description: 'Performs a HTTP request to `url`, with provided `options` and `data`.' +
                        '`options` is a JSON object with the following structure. It is recommended to use {jsonset} to create it.\n' +
                        '```json\n{\n  "method": "GET|POST|PUT|PATCH|DELETE", // defaults to GET\n' +
                        '  "headers": { "key": "value" }\n}\n```' +
                        'If the method is GET and a JSON object is provided for `data`, it will be formatted as query strings.',
                    exampleCode: '{jget;{request;https://example.com/update/user;{jset;;method;POST};{jset;;user;Stupid cat}};body}',
                    exampleOut: 'Stupid cat updated!',
                    returns: 'json',
                    execute: (ctx, args) => this.requestUrl(ctx, args[0].value, args[1].value, args[2].value)
                }
            ]
        });
    }

    public async requestUrl(
        context: BBTagContext,
        url: string,
        optionsStr: string,
        dataStr: string
    ): Promise<JObject> {
        let domain;
        if (domainRegex.test(url)) {
            const domainRegexMatches = domainRegex.exec(url);
            domain = domainRegexMatches !== null ? domainRegexMatches[1] : '';
            const whitelisted = context.util.cluster.domains.isWhitelisted(domain);
            if (!whitelisted) {
                throw new BBTagRuntimeError('Domain is not whitelisted: ' + domain);
            }
        } else {
            throw new BBTagRuntimeError('A domain could not be extracted from url: ' + url);
        }

        const options: OptionsObject = {
            method: 'GET'
        };

        if (optionsStr !== '') {
            try {
                let parsedJson = JSON.parse(optionsStr);
                if (typeof parsedJson !== 'object' || parsedJson === null || Array.isArray(parsedJson))
                    parsedJson = {};
                if (guard.hasValue(parsedJson.method)) {
                    const method = parsedJson.method.toString().toUpperCase();
                    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method))
                        throw new BBTagRuntimeError('');
                    options.method = method as HTTPMethod;
                } else {
                    options.method = 'GET';
                }

                if (guard.hasValue(parsedJson.headers)) {
                    if (typeof parsedJson.headers === 'string') {
                        try {
                            options.headers = <Header>JSON.parse(parsedJson.headers);
                        } catch (err: unknown) {
                            options.headers = {};
                        }
                    } else if (typeof parsedJson.headers === 'object' && !Array.isArray(parsedJson.headers)) {
                        options.headers = <Header>parsedJson.headers;
                    } else options.headers = {};
                }

            } catch (e: unknown) {
                if (e instanceof Error)
                    throw new BBTagRuntimeError(e.message);
            }
        }
        let dataObject: JToken | undefined;
        if (dataStr !== '') {
            try {
                dataObject = JSON.parse(dataStr);
                if (guard.hasValue(options.headers))
                    options.headers['Content-Type'] = 'application/json';
                else // eslint-disable-next-line @typescript-eslint/naming-convention
                    options.headers = { 'Content-Type': 'application/json' };
            } catch (err: unknown) {
                dataObject = dataStr;
            }
        }
        let data: string | undefined;
        let query: string | undefined;
        if (typeof dataObject === 'object' && options.method === 'GET')
            query = new URLSearchParams(dataObject !== null ? <Record<string, string>>dataObject : {}).toString();
        else {
            data = JSON.stringify(dataObject);
        }

        const requestOptions: RequestInit = {
            headers: options.headers,
            method: options.method,
            size: 8000000,
            body: data
        };

        try {
            const res = await fetch(url + (query !== undefined ? '?' + query : ''), requestOptions);
            const contentType = res.headers.get('content-type');
            const response: ResponseObject = {
                body: await res.buffer(),
                status: res.status,
                statusText: res.statusText,
                contentType,
                date: res.headers.get('date'),
                url: res.url
            };
            /*
                I personally absolutely hate how blarg decides to error if a status code is not consider 'ok'
                A lot of APIs actually have meaningful errors, coupled with a 'not-ok' status and it's ass that blarg doesn't return it.
                TODO change this to return always regardless of statusCode OR add a parameter like [rawResponse] for getting the response object always without breaking bbtag.
            */
            if (!(res.status >= 200 && res.status < 400))
                throw Error(`${res.status} ${res.statusText}`);

            let bodyStr: string;
            if (contentType === null || contentType.startsWith('text') === true)
                bodyStr = response.body.toString('utf8');
            else if (contentType.includes('application/json'))
                bodyStr = response.body.toString('utf-8');
            else
                bodyStr = response.body.toString('base64');
            try {
                if (typeof response.body === 'string')
                    return { ...response, body: JSON.parse(response.body) };
            } catch (e: unknown) {
                //no-op
            }
            return { ...response, body: bodyStr };
        } catch (e: unknown) {
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
            throw e;
        }
    }
}
