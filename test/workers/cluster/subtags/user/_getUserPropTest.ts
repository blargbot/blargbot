import { BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError, UserNotFoundError } from '@cluster/bbtag/errors';
import { APIGuildMember } from 'discord-api-types';
import { Member } from 'eris';

import { argument } from '../../../../mock';
import { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite';

export function createGetUserPropTestCases(options: GetUserPropTestData): SubtagTestCase[] {
    const ifQuietAndNotFound = options.ifQuietAndNotFound ?? '';
    return [
        ...options.cases.map<SubtagTestCase>(c => ({
            code: c.generateCode?.() ?? options.generateCode(),
            expected: c.expected,
            errors: c.error === undefined ? [] : [
                { start: 0, end: (c.generateCode?.() ?? options.generateCode()).length, error: c.error }
            ],
            setup(ctx) {
                c.setup?.(ctx.members.command, ctx);
            },
            postSetup(bbctx, ctx) {
                const member = bbctx.guild.members.get(ctx.members.command.user.id);
                if (member === undefined)
                    throw new Error('Cannot find the member under test');
                c.postSetup?.(member, bbctx, ctx);
            }
        })),
        ...options.cases.map<SubtagTestCase>(c => ({
            code: c.generateCode?.('other user') ?? options.generateCode('other user'),
            expected: c.expected,
            errors: c.error === undefined ? [] : [
                { start: 0, end: (c.generateCode?.('other user') ?? options.generateCode('other user')).length, error: c.error }
            ],
            setup(ctx) {
                c.setup?.(ctx.members.other, ctx);
            },
            postSetup(bbctx, ctx) {
                const member = bbctx.guild.members.get(ctx.members.other.user.id);
                if (member === undefined)
                    throw new Error('Cannot find the member under test');
                c.postSetup?.(member, bbctx, ctx);
            }
        })),
        ...options.cases.map<SubtagTestCase>(c => ({
            code: c.generateCode?.('other user', '') ?? options.generateCode('other user', ''),
            expected: c.expected,
            errors: c.error === undefined ? [] : [
                { start: 0, end: (c.generateCode?.('other user', '') ?? options.generateCode('other user', '')).length, error: c.error }
            ],
            setup(ctx) {
                c.setup?.(ctx.members.other, ctx);
            },
            postSetup(bbctx, ctx) {
                const member = bbctx.guild.members.get(ctx.members.other.user.id);
                if (member === undefined)
                    throw new Error('Cannot find the member under test');
                c.postSetup?.(member, bbctx, ctx);
            }
        })),
        ...options.cases.map<SubtagTestCase>(c => ({
            code: c.generateCode?.('other user', 'q') ?? options.generateCode('other user', 'q'),
            expected: c.expected,
            errors: c.error === undefined ? [] : [
                { start: 0, end: (c.generateCode?.('other user', 'q') ?? options.generateCode('other user', 'q')).length, error: c.error }
            ],
            setup(ctx) {
                c.setup?.(ctx.members.other, ctx);
            },
            postSetup(bbctx, ctx) {
                const member = bbctx.guild.members.get(ctx.members.other.user.id);
                if (member === undefined)
                    throw new Error('Cannot find the member under test');
                c.postSetup?.(member, bbctx, ctx);
            }
        })),
        {
            code: options.generateCode('unknown user'),
            expected: '`No user found`',
            errors: [
                { start: 0, end: options.generateCode('unknown user').length, error: new UserNotFoundError('unknown user') }
            ],
            setup(ctx) {
                ctx.options.rootTagName = 'myCoolTag';
                ctx.discord.setup(m => m.createMessage(ctx.channels.command.id, argument.isDeepEqual({ content: 'No user matching `unknown user` found in tag `myCoolTag`.' }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.createMessage(ctx.channels.command.id, argument.isDeepEqual({ content: 'No user matching `unknown user` found in tag `myCoolTag`.' }), undefined)).once();
            }
        },
        {
            code: options.generateCode('unknown user', ''),
            expected: '`No user found`',
            errors: [
                { start: 0, end: options.generateCode('unknown user', '').length, error: new UserNotFoundError('unknown user') }
            ],
            setup(ctx) {
                ctx.options.rootTagName = 'myCoolTag';
                ctx.discord.setup(m => m.createMessage(ctx.channels.command.id, argument.isDeepEqual({ content: 'No user matching `unknown user` found in tag `myCoolTag`.' }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.createMessage(ctx.channels.command.id, argument.isDeepEqual({ content: 'No user matching `unknown user` found in tag `myCoolTag`.' }), undefined)).once();
            }
        },
        {
            code: options.generateCode('unknown user', 'q'),
            expected: ifQuietAndNotFound,
            errors: [
                { start: 0, end: options.generateCode('unknown user', 'q').length, error: new UserNotFoundError('unknown user').withDisplay(ifQuietAndNotFound) }
            ]
        }
    ];
}

interface GetUserPropTestData {
    cases: GetUserPropTestCase[];
    ifQuietAndNotFound?: string;
    generateCode: (...args: [userStr?: string, quietStr?: string]) => string;
}

interface GetUserPropTestCase {
    expected: string;
    error?: BBTagRuntimeError;
    generateCode?: (...args: [userStr?: string, quietStr?: string]) => string;
    setup?: (member: RequiredProps<APIGuildMember, 'user'>, context: SubtagTestContext) => void;
    postSetup?: (member: Member, context: BBTagContext, test: SubtagTestContext) => void;
}
