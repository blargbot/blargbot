import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { ScheduleFeature } from '@blargbot/bbtag/subtags';
import { TimerSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<ScheduleFeature>({ id: 'features' });
const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
const variables = new Mock<Variables>({ id: 'variables' });
const now = Temporal.Instant.from('2026-09-22T22:20:00Z');

await runSubtagTests({
    subtag: new TimerSubtag(features.instance),
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    names: ['timer'],
    setup(ctx, _, test) {
        ctx.adoptMock(features);
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        test.mock.method(Temporal.Now, 'instant', () => now);
        ctx.dependencies.setup(m => m.variables).returns(variablesProvider.instance);
    },
    postSetup(bbctx) {
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
    },
    cases: [
        {
            code: '{timer;abc{fail};10s}',
            expected: '',
            setup(ctx) {
                ctx.limit.setup(m => m.serialize()).returns({ type: 'mock', rules: {} }).mustHappen(1);
                variables.setup(m => m.list).returns([]).mustHappen(1);
                const target = now.add({ seconds: 10 });
                features.setup((m, $) => m.scheduleBBTag($({
                    msg: {
                        id: ctx.messageId,
                        timestamp: 0,
                        content: '',
                        channel: {
                            id: ctx.channelId,
                            serialized: JSON.stringify({
                                id: ctx.channelId
                            })
                        },
                        member: {
                            id: ctx.userId,
                            serialized: JSON.stringify({
                                id: ctx.userId
                            })
                        },
                        attachments: [],
                        embeds: []
                    },
                    isCC: false,
                    scope: {
                        functions: {},
                        isTag: false,
                        inLock: false,
                        fallback: undefined,
                        noLookupErrors: undefined,
                        paramsarray: undefined,
                        quiet: undefined,
                        reaction: undefined,
                        reactUser: undefined,
                        reason: undefined
                    },
                    inputRaw: '',
                    data: {
                        allowedMentions: {
                            everybody: false,
                            roles: [],
                            users: []
                        },
                        ownedMsgs: [ctx.messageId],
                        query: {
                            count: 0,
                            channel: {},
                            role: {},
                            user: {}
                        },
                        stackSize: 0
                    },
                    prefix: undefined,
                    flags: [],
                    tagName: ctx.tagName,
                    rootTagName: ctx.tagName,
                    tagVars: true,
                    author: ctx.authorId,
                    authorizer: ctx.authorizerId,
                    limit: { type: 'mock', rules: {} },
                    tempVars: {}
                }), 'abc{fail}', $(target))).resolves().mustHappen(1);
            }
        },
        {
            code: '{timer;{fail};test}',
            expected: '`Invalid duration`',
            errors: [
                { error: new BBTagRuntimeError('Invalid duration') }
            ]
        }
    ]
});
