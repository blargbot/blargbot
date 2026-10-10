import { describe, it } from 'node:test';

import type { BBTagReplacer } from '@blargbot/bbtag-engine';
import { BBTagEngine, composeReplacer, createEmbedParser, replacers } from '@blargbot/bbtag-engine';
import Color from 'color';

await describe('All replacers', async () => {
    await it('Should be constructable', () => {
        const replacer = composeReplacer(b =>
            b.registerAll(replacers, {
                parseColor(channels, format) {
                    const result = new Color(channels, format);
                    return format === 'gray' ? result.rgb() : result;
                },
                parseEmbed: createEmbedParser(() => undefined),
                decodeHtml: () => '',
                encodeHtml: () => '',
                getColorByName: () => null
            })
        );
        type Locals = typeof replacer extends BBTagReplacer<infer Locals> ? Locals : never;
        new BBTagEngine<void, Locals>({
            replacer,
            * renderError(error, ctx) {
                yield error.display ?? ctx.locals.fallback ?? `\`${error.message}\``;
            },
            locals: {
                toInput() { },
                toLocals(): Locals {
                    return {
                        args: [],
                        authorId: '',
                        authorizerId: '',
                        brainfuck: () => '',
                        commmandName: '',
                        compileRegExp: () => ({
                            match: () => [],
                            replace: () => '',
                            split: () => [],
                            test: () => true
                        }),
                        debug: [],
                        decancer: () => '',
                        discord: {

                        },
                        dump: () => new URL('https://test.com'),
                        flags: { _: [] },
                        functions: {},
                        getCustomCommand: () => null,
                        getTag: () => null,
                        getUserTimezone: () => null,
                        httpRequest: () => ({
                            status: 0,
                            statusText: '',
                            body: new Uint8Array(0),
                            isTruncated: false,
                            headers: new Headers(),
                            url: ''
                        }),
                        inLock: false,
                        isCC: false,
                        isStaff: () => false,
                        lock: () => ({ [Symbol.dispose]: () => { } }),
                        nsfw: { value: null },
                        outputReplacers: [],
                        prefix: '',
                        now: () => 0,
                        schedule: () => { },
                        sleep: () => Promise.resolve(),
                        variables: {
                            get: () => ({ key: '', value: undefined }),
                            commit: () => { },
                            rollback: () => { },
                            set: () => { }
                        },
                        warnings: {
                            add: () => 0,
                            remove: () => 0,
                            get: () => 0
                        },
                        quiet: false,
                        functionParameters: null,
                        reason: null,
                        suppressLookup: false,
                        fallback: null
                    } as Locals;
                }
            },
            serializer: {
                serialize() {
                    return new Uint8Array(0);
                },
                deserialize() { }
            }
        });
    });
});
