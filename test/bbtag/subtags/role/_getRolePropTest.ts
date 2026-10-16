import type { BBTagContext, BBTagRuntimeError } from '@blargbot/bbtag';
import { RoleNotFoundError } from '@blargbot/bbtag';
import type { APIRole } from 'discord-api-types/v9';
import * as eris from 'eris';

import type { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite.js';

export function createGetRolePropTestCases(options: GetRolePropTestData): SubtagTestCase[] {
    return [...createGetRolePropTestCasesIter(options)];
}

function* createGetRolePropTestCasesIter(options: GetRolePropTestData): Generator<SubtagTestCase, void, undefined> {
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command']));

    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command', 'q']));
    }

    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'other', [c.queryString ?? 'other role']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'other', [c.queryString ?? 'other role', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'other', [c.queryString ?? 'other role', 'q']));
    }

    const notFound = options.notFound ?? (r => new RoleNotFoundError(r));

    yield {
        code: options.generateCode('unknown role'),
        expected: `\`${notFound('unknown role').message}\``,
        errors: [
            { error: notFound('unknown role') }
        ],
        setup(ctx) {
            ctx.util.setup((m, $) => m.findRoles($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'unknown role'))
                .mustHappen(1)
                .resolves([]);
        }
    };

    if (options.quiet !== false) {
        yield {
            code: options.generateCode('unknown role', ''),
            expected: `\`${notFound('unknown role').message}\``,
            errors: [
                { error: notFound('unknown role') }
            ],
            setup(ctx) {
                ctx.util.setup((m, $) => m.findRoles($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'unknown role'))
                    .mustHappen(1)
                    .resolves([]);
            }
        };
        yield {
            code: options.generateCode('unknown role', 'q'),
            expected: options.quiet ?? `\`${notFound('unknown role').message}\``,
            errors: [
                { error: notFound('unknown role').withDisplay(options.quiet) }
            ],
            setup(ctx) {
                ctx.util.setup((m, $) => m.findRoles($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'unknown role'))
                    .mustHappen(1)
                    .resolves([]);
            }
        };
    }
}

interface GetRolePropTestData {
    cases: GetRolePropTestCase[];
    quiet?: string | false;
    generateCode: (...args: [roleStr?: string, quietStr?: string]) => string;
    notFound?: (roleStr: string) => BBTagRuntimeError;
}

interface GetRolePropTestCase {
    title?: string;
    expected: string;
    error?: BBTagRuntimeError;
    queryString?: string;
    generateCode?: (...args: [roleStr?: string, quietStr?: string]) => string;
    setup?: (role: APIRole, context: SubtagTestContext) => void;
    postSetup?: (role: eris.Role, context: BBTagContext, test: SubtagTestContext) => void;
    assert?: (result: string, role: eris.Role, context: BBTagContext, test: SubtagTestContext) => void;
}

function createTestCase(data: GetRolePropTestData, testCase: GetRolePropTestCase, roleKey: keyof SubtagTestContext['roles'], args: Parameters<GetRolePropTestData['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    return {
        code,
        title: testCase.title,
        expected: testCase.expected,
        errors: testCase.error === undefined ? [] : [{ error: testCase.error }],
        setup(ctx) {
            testCase.setup?.(ctx.roles[roleKey], ctx);
        },
        postSetup(bbctx, ctx) {
            const role = bbctx.root.message.channel.guild.roles.get(ctx.roles[roleKey].id);
            if (role === undefined)
                throw new Error('Cannot find the role under test');
            if (args[0] !== undefined && args[0] !== '') {
                ctx.util.setup(m => m.findRoles(role.guild, args[0]))
                    .resolves([role]);
            }

            testCase.postSetup?.(role, bbctx, ctx);
        },
        assert(bbctx, result, ctx) {
            if (testCase.assert === undefined)
                return;
            const role = bbctx.root.message.channel.guild.roles.get(ctx.roles[roleKey].id);
            if (role === undefined)
                throw new Error('Cannot find the role under test');
            testCase.assert(result, role, bbctx, ctx);
        }
    };
}
