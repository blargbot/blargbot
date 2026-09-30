import { describe, it } from 'node:test';

import { BBTagEngine, composeReplacer, createEmbedParser, replacers } from '@blargbot/bbtag-engine';
import Color from 'color';

await describe('All replacers', async () => {
    await it('Should be constructable', () => {
        new BBTagEngine({
            replacer: composeReplacer(b =>
                b.registerAll(replacers, {
                    parseColor(channels, format) {
                        const result = new Color(channels, format);
                        return format === 'gray' ? result.rgb() : result;
                    },
                    parseEmbed: createEmbedParser(() => undefined)
                })
            ),
            * renderError(error, ctx) {
                yield error.display ?? ctx.locals.fallback ?? `\`${error.message}\``;
            },
            locals: {
                toInput() {
                    return {};
                },
                toLocals() {
                    return {
                        test: '',
                        args: [],
                        authorId: '',
                        authorizerId: '',
                        banGuildMember: () => true,
                        brainfuck: () => '',
                        commmandName: '',
                        compileRegExp: () => ({
                            match: () => [],
                            replace: () => '',
                            split: () => [],
                            test: () => true
                        }),
                        createDM: () => 0n,
                        debug: [],
                        decancer: () => '',
                        dump: () => new URL('https://google.com'),
                        flags: { _: [] },
                        functions: {},
                        getAllGuildMembers: () => [],
                        getCustomCommand: () => undefined,
                        getGuildMemberActivity: () => undefined,
                        getGuildMemberBoostSince: () => undefined,
                        getGuildMemberWarnings: () => 0,
                        getTag: () => undefined,
                        htmlEncoder: {
                            encode: () => '',
                            decode: () => ''
                        },
                        httpRequest: () => ({
                            body: new Uint8Array(0),
                            headers: new Headers(),
                            isTruncated: false,
                            status: 0,
                            statusText: '',
                            url: ''
                        }),
                        inLock: false,
                        isCC: true,
                        isStaff: true,
                        isUserStaff: () => false,
                        kickGuildMember: () => { },
                        lock: () => ({ [Symbol.asyncDispose]: () => Promise.resolve() }),
                        nsfw: {},
                        pardonGuildMember: () => 0,
                        parseTime: () => ({ format: () => '' }),
                        prefix: '',
                        queryUser: () => 0n,
                        outputReplacers: [],
                        schedule: () => { },
                        sleep: () => Promise.resolve(),
                        timeoutGuildMember: () => true,
                        unbanGuildMember: () => true,
                        userId: 0n,
                        variables: {
                            commit: () => { },
                            get: () => ({ key: '', value: undefined }),
                            rollback: () => { },
                            set: () => { }
                        },
                        warnGuildMember: () => 0,
                        fallback: undefined,
                        functionParameters: [],
                        quiet: undefined,
                        reason: undefined,
                        suppressLookup: undefined
                    };
                }
            },
            serializer: {
                serialize() {
                    return new Uint8Array(0);
                },
                deserialize() {
                    return {};
                }
            }
        });
    });
});
