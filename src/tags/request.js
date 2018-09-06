/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:15
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-06 15:36:03
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');
const snekfetch = require('snekfetch');
const { parse: UrlParse } = require('url');
const domainRegex = /^https?:\/\/(.+?)(?:\/.?|$)/i;

module.exports = Builder.AutoTag('request')
    .withArgs(a => [a.require('url'), a.optional('options'), a.optional('data')])
    .withDesc('if cat pushes without filling this out, kill him')
    .withExample(
    'if cat pushes without filling this out, kill him',
    'if cat pushes without filling this out, kill him'
    )
    .whenArgs(0, Builder.errors.notEnoughArguments)
    .whenArgs('1-3', async function (subtag, context, args) {
        let url = args[0].toLowerCase();
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
        let options = { method: 'GET' }, data;
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
            headers: options.headers
        };

        if (data) {
            if (typeof data === 'object' && options.method === 'GET') {
                requestOptions.query = data;
                data = undefined;
            }
        }

        const Request = new snekfetch(options.method, url, requestOptions);

        let res;
        try {
            res = await Request.send(data);
        } catch (err) {
            res = err;
        }

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
            if (res.headers['content-type'].startsWith('text'))
                response.body = response.body.toString('utf8');
            else
                response.body = response.body.toString('base64');
        }

        return JSON.stringify(response);
    }).whenDefault(Builder.errors.tooManyArguments)
    .build();