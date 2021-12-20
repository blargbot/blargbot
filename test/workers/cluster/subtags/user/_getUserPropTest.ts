import { BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError, UserNotFoundError } from '@cluster/bbtag/errors';
import { APIGuildMember } from 'discord-api-types';
import { Member } from 'eris';

import { argument } from '../../../../mock';
import { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite';

export function createGetUserPropTestCases(options: GetUserPropTestData): SubtagTestCase[] {
    return [
        ...options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', [])),
        ...options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', [''])),
        ...options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['', ''])),
        ...options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['', 'q'])),
        ...options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'other', [c.queryString ?? 'other user'])),
        ...options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'other', [c.queryString ?? 'other user', ''])),
        ...options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'other', [c.queryString ?? 'other user', 'q'])),
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
        options.ifQuietAndNotFound === undefined
            ? {
                code: options.generateCode('unknown user', 'q'),
                expected: '`No user found`',
                errors: [
                    { start: 0, end: options.generateCode('unknown user', 'q').length, error: new UserNotFoundError('unknown user') }
                ]
            }
            : {
                code: options.generateCode('unknown user', 'q'),
                expected: options.ifQuietAndNotFound,
                errors: [
                    { start: 0, end: options.generateCode('unknown user', 'q').length, error: new UserNotFoundError('unknown user').withDisplay(options.ifQuietAndNotFound) }
                ]
            }
    ];
}

interface GetUserPropTestData {
    cases: GetUserPropTestCase[];
    ifQuietAndNotFound: string | undefined;
    generateCode: (...args: [userStr?: string, quietStr?: string]) => string;
}

interface GetUserPropTestCase {
    expected: string;
    error?: BBTagRuntimeError;
    queryString?: string;
    generateCode?: (...args: [userStr?: string, quietStr?: string]) => string;
    setup?: (member: RequiredProps<APIGuildMember, 'user'>, context: SubtagTestContext) => void;
    postSetup?: (member: Member, context: BBTagContext, test: SubtagTestContext) => void;
    assert?: (result: string, member: Member, context: BBTagContext, test: SubtagTestContext) => void;
}

function createTestCase(data: GetUserPropTestData, testCase: GetUserPropTestCase, memberKey: keyof SubtagTestContext['members'], args: Parameters<GetUserPropTestData['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    return {
        code,
        expected: testCase.expected,
        errors: testCase.error === undefined ? [] : [{ start: 0, end: code.length, error: testCase.error }],
        setup(ctx) {
            testCase.setup?.(ctx.members[memberKey], ctx);
        },
        postSetup(bbctx, ctx) {
            if (testCase.postSetup === undefined)
                return;
            const member = bbctx.guild.members.get(ctx.members[memberKey].user.id);
            if (member === undefined)
                throw new Error('Cannot find the member under test');
            testCase.postSetup(member, bbctx, ctx);
        },
        assert(bbctx, result, ctx) {
            if (testCase.assert === undefined)
                return;
            const member = bbctx.guild.members.get(ctx.members[memberKey].user.id);
            if (member === undefined)
                throw new Error('Cannot find the member under test');
            testCase.assert(result, member, bbctx, ctx);
        }
    };
}
