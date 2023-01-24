import type { TypeMapping } from '@blargbot/mapping';
import { mapping } from '@blargbot/mapping';
import fetch from 'node-fetch';

import type { BBTagUtilities, BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.request;

const domainRegex = /^https?:\/\/(.+?)(?:\/.?|$)/i;

@Subtag.id('request')
@Subtag.ctorArgs(Subtag.util(), Subtag.converter())
export class RequestSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;
    readonly #converter: BBTagValueConverter;
    readonly #mapOptions: TypeMapping<RequestOptions>;

    public constructor(util: BBTagUtilities, converter: BBTagValueConverter) {
        super({
            category: SubtagType.BOT,
            description: tag.description,
            definition: [
                {
                    parameters: ['url', 'options?', 'data?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json',
                    execute: (_, [url, options, data]) => this.requestUrl(url.value, options.value, data.value)
                }
            ]
        });

        this.#util = util;
        this.#converter = converter;
        this.#mapOptions = createMapOptions(this.#converter);
    }

    public async requestUrl(
        url: string,
        optionsStr: string,
        dataStr: string
    ): Promise<JObject> {
        const domainMatch = domainRegex.exec(url);
        if (domainMatch === null)
            throw new BBTagRuntimeError(`A domain could not be extracted from url: ${url}`);

        const domain = domainMatch[1];
        if (!this.#util.canRequestDomain(domain))
            throw new BBTagRuntimeError(`Domain is not whitelisted: ${domain}`);

        const request = {
            method: 'GET',
            headers: {} as Record<string, string>,
            size: 8000000,
            body: undefined as string | undefined
        };

        if (optionsStr !== '') {
            const mappedOptions = this.#mapOptions(optionsStr);
            if (!mappedOptions.valid)
                throw new BBTagRuntimeError('', `Invalid request options "${optionsStr}"`);
            request.method = mappedOptions.value.method;
            request.headers = mappedOptions.value.headers;
        }

        let data;
        try {
            data = JSON.parse(dataStr);
        } catch { /* NOOP */ }

        let query;
        if (request.method === 'GET') {
            if (typeof data === 'object' && data !== null) {
                query = new URLSearchParams(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, this.#converter.string(v as JToken)] as const))).toString();
                data = undefined;
            }
        } else if (data !== undefined) {
            if (!Object.keys(request.headers).map(h => h.toLowerCase()).includes('content-type'))
                request.headers['Content-Type'] = 'application/json';
            request.body = JSON.stringify(data);
        } else {
            request.body = dataStr;
        }

        const response = await fetch(url + (query !== undefined ? `?${query}` : ''), request);
        const result = {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            date: response.headers.get('date'),
            url: response.url
        };

        /*
                I personally absolutely hate how blarg decides to error if a status code is not consider 'ok'
                A lot of APIs actually have meaningful errors, coupled with a 'not-ok' status and it's ass that blarg doesn't return it.
                TODO change this to return always regardless of statusCode OR add a parameter like [rawResponse] for getting the response object always without breaking bbtag.
            */
        if (!(response.status >= 200 && response.status < 400))
            throw new BBTagRuntimeError(`${response.status} ${response.statusText}`);

        if (result.contentType?.startsWith('text') !== false)
            return { body: await response.text(), ...result };

        if (result.contentType.includes('application/json'))
            return { body: await response.json() as JToken, ...result };

        const body = await response.arrayBuffer();
        return { body: Buffer.from(body).toString('base64'), ...result };
    }
}

interface RequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers: Record<string, string>;
}

function createMapOptions(converter: BBTagValueConverter): TypeMapping<RequestOptions> {
    return mapping.json(mapping.object<RequestOptions>({
        method: mapping.string
            .map(s => s.toUpperCase())
            .chain(mapping.in('GET', 'POST', 'PUT', 'PATCH', 'DELETE'))
            .optional
            .map(v => v ?? 'GET'),
        headers: mapping.choice(
            mapping.json(mapping.record(mapping.jToken.map(converter.string))),
            mapping.record(mapping.jToken.map(converter.string))
        ).optional.map(v => v ?? {})
    }));
}
