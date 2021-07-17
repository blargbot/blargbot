/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:15
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-10-17 13:16:01
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const snekfetch = require('snekfetch');
const Builder = require('../structures/TagBuilder');

const domainRegex = /^https?:\/\/(.+?)(?:\/.?|$)/i;

function makeRequest(request) {
    return new Promise((resolve, reject) => {
        request.then(resolve).catch(err => {
            if (err instanceof Error) reject(err);
            else resolve(err);
        });
    });
}

module.exports = Builder.AutoTag('request')
    .withArgs(a => [a.required('url'), a.optional('options'), a.optional('data')])
    .withDesc('Performs an HTTP request to `url`, with provided `options` and `data`.\n'
        + 'Only certain whitelisted domains can be used for `url`. See [here](https://blargbot.xyz/domains) for the list.\n\n'
        + '`options` is a JSON object with the following structure. It is recommended to use {jsonset} to create it.\n'
        + '```json\n{\n  "method": "GET|POST|PUT|PATCH|DELETE", // defaults to GET\n'
        + '  "headers": { "key": "value" }\n}\n```'
        + 'If the method is GET and a JSON object is provided for `data`, it will be formatted as query strings.\n\n'
        + 'The output is a JSON object with the following structure. It is recommended to use {jsonget} to navigate it.\n'
        + '```json\n{\n  "body": {}, // the body of the request\n  "status": 200, // the HTTP status code\n  "statusText": "OK", // the human readable translation of the status code\n'
        + '  "date": "Thu, 1 Jan 1970 00:00:00 GMT", // the date sent in the headers\n  "contentType": "application/json", // the content type of the response\n'
        + '  "url": "https://fancy.url/here" // the url that was requested\n}\n```')
    .withExample(
        '{jget;{request;https://blargbot.xyz/output/1111111111111111/raw};body}',
        'Hello, world!'
    )
    .whenArgs(0, Builder.errors.notEnoughArguments)
    .whenArgs('1-3', async function (subtag, context, args) {
        let url = args[0];
        let domain;
        if (domainRegex.test(url)) {
            domain = url.match(domainRegex)[1];
            let whitelisted = (await bot.sender.awaitMessage({
                message: 'whitelistedDomain',
                domain
            })).result;
            if (!whitelisted) {
                return Builder.errors.domainNotWhitelisted(subtag, context, domain);
            }
        } else {
            return Builder.errors.invalidDomain(subtag, context, url);
        }
        let options = { method: 'GET' };
        let data;
        if (args[1]) {
            try {
                options = JSON.parse(args[1]);
                if (typeof options !== 'object') options = {};

                if (!options.method || typeof options.method !== 'string') options.method = 'GET';
                else {
                    options.method = options.method.toUpperCase();
                    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method))
                        return Builder.errors.customError(subtag, context);
                }

                if (options.headers && typeof options.headers !== 'object') {
                    if (typeof options.headers === 'string') {
                        try {
                            options.headers = JSON.parse(options.headers);
                        } catch (err) {
                            options.headers = {};
                        }
                    } else options.headers = {};
                }
            } catch (err) {
                return Builder.errors.customError(subtag, context, err.message);
            }
        }

        if (args[2]) {
            try {
                data = JSON.parse(args[2]);
            } catch (err) {
                data = args[2];
            }
        }

        let requestOptions = {
            headers: options.headers,
            maxBytes: 8000000
        };

        if (data) {
            if (typeof data === 'object' && options.method === 'GET') {
                requestOptions.query = data;
                data = undefined;
            }
        }

        const Request = new snekfetch(options.method, url, requestOptions);
        Request.send(data);

        let res;
        try {
            res = await makeRequest(Request);
        } catch (err) {
            console.error(err);
            return Builder.errors.customError(subtag, context, err.message);
        }

        console.log(res);

        let response = {
            body: res.body,
            text: res.text,
            status: res.statusCode,
            statusText: res.statusText,
            contentType: res.headers['content-type'],
            date: res.headers['date'],
            url: Request.options.url
        };

        if (response.body instanceof Buffer) {
            if (!res.headers['content-type'] || res.headers['content-type'].startsWith('text'))
                response.body = response.body.toString('utf8');
            else
                response.body = response.body.toString('base64');
        }

        return JSON.stringify(response);
    }).whenDefault(Builder.errors.tooManyArguments)
    .build();
