import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { ScheduleThunk } from '@blargbot/bbtag/subtags';
import { TimerSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const schedule = new Mock<ScheduleThunk>({ id: 'schedule', callable: true });
const now = Temporal.Instant.from('2026-09-22T22:20:00Z');
await runSubtagTests({
    subtag: new TimerSubtag({
        schedule: schedule.instance
    }),
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    names: ['timer'],
    setup(ctx, _, test) {
        ctx.addMock(schedule);
        schedule.reset();
        test.mock.timers.enable({
            apis: ['Date'],
            now: new Date(now.epochMilliseconds)
        });
    },
    cases: [
        {
            code: '{timer;abc{fail};10s}',
            retries: 3,
            expected: '',
            setup(ctx) {
                ctx.message.id = '1560411548978495584';
                ctx.message.timestamp = '1792101504321';
                ctx.message.content = 'cool content';
                ctx.message.channel_id = '1560411548978495582';
                ctx.message.author.id = '1560411548978495579';
                ctx.channels.command.id = '1560411548978495582';
                ctx.users.command.id = '1560411548978495579';
                ctx.members.command.roles = ['1560411548978495574'];
                ctx.users.authorizer.id = '1560411548978495580';
                ctx.input.tagName = 'testTag_1560411548978495585';
                ctx.input.author = '1560411548978495579';
                ctx.input.authorizer = '1560411548978495580';
                ctx.limit.setup(m => m.serialize()).returns({ type: 'mock', rules: {} }).mustHappen(1);
                const target = now.add({ seconds: 10 });
                schedule.setup((m, $) => m($({
                    msg: {
                        id: '1560411548978495584',
                        timestamp: 1792101504321,
                        content: 'cool content',
                        channel: {
                            id: '1560411548978495582',
                            serialized: JSON.stringify({
                                id: '1560411548978495582',
                                createdAt: 1792101504321,
                                type: 0,
                                name: 'commands',
                                nsfw: false,
                                permissionOverwrites: {},
                                position: 0,
                                lastMessageID: null,
                                lastPinTimestamp: null,
                                messages: {},
                                rateLimitPerUser: null,
                                topic: 'Test channel!'
                            })
                        },
                        member: {
                            id: '1560411548978495579',
                            serialized: JSON.stringify({
                                id: '1560411548978495579',
                                createdAt: 1792101504321,
                                joinedAt: 0,
                                nick: null,
                                roles: ['1560411548978495574'],
                                user: {
                                    id: '1560411548978495579',
                                    createdAt: 1792101504321,
                                    avatar: null,
                                    bot: false,
                                    discriminator: '0000',
                                    system: false,
                                    username: 'Command User'
                                },
                                voiceState: {
                                    id: '1560411548978495579',
                                    createdAt: 1792101504321,
                                    channelID: null,
                                    deaf: false,
                                    mute: false,
                                    requestToSpeakTimestamp: null,
                                    selfDeaf: false,
                                    selfMute: false,
                                    selfStream: false,
                                    selfVideo: false,
                                    sessionID: null,
                                    suppress: false
                                }
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
                        ownedMsgs: ['1560411548978495584'],
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
                    tagName: 'testTag_1560411548978495585',
                    rootTagName: 'testTag_1560411548978495585',
                    tagVars: true,
                    author: '1560411548978495579',
                    authorizer: '1560411548978495580',
                    limit: { type: 'mock', rules: {} },
                    tempVars: {}
                }), 'abc{fail}', $(target))).resolves().mustHappen(1);
            }
        },
        {
            code: '{timer;{fail};test}',
            expected: '`Invalid duration`',
            errors: [
                { start: 0, end: 19, error: new BBTagRuntimeError('Invalid duration') }
            ]
        }
    ]
});
