import assert from 'node:assert/strict';

import type { getLock as defaultGetLock, RwLock, TagVariableScopeDetails, Variables, VariablesProvider } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag';
import { LockSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import type { TagVariableScope } from '@blargbot/domain';
import { TagVariableType } from '@blargbot/domain';
import { FormatString } from '@blargbot/formatting';
import { Mock } from '@blargbot/test-util';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { AssertSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const formattableString = FormatString.create(snowflake.create().toString(), '');
const guildId = '23904768237436873424';
const authorId = '823764823946284623234';
const tempId = snowflake.create().toString();
const tagName = 'testTag';
const invalidModeMessage = 'Mode must be \'read\' or \'write\'';
const getLock = new Mock<typeof defaultGetLock>({ id: 'getLock', callable: true });
const lock = new Mock<RwLock>({ id: 'lock' });
const lockHandle = new Mock<AsyncDisposable>({ id: 'lockHandle' });
const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new LockSubtag({
        getLock: getLock.instance,
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    names: ['lock'],
    setup(ctx) {
        ctx.adoptMock(lock);
        ctx.adoptMock(getLock);
        ctx.adoptMock(lockHandle);
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
    },
    postSetup(bbctx) {
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
    },
    cases: [
        {
            title: 'Already inside a lock',
            code: '{lock;write;myLock;{fail}}',
            expected: '`Lock cannot be nested`',
            errors: [
                { error: new BBTagRuntimeError('Lock cannot be nested') }
            ],
            setup() {
                variables.setup(m => m.scopes).returns([
                    toTagVariableScopeDetails('', { type: TagVariableType.GLOBAL })
                ]);
            },
            postSetup(ctx) {
                ctx.root.inLock = true;
            }
        },
        {
            title: 'Nested lock inside the code of another lock',
            code: '{lock;write;outer;{lock;read;inner;{fail}}}',
            expected: '`Lock cannot be nested`',
            errors: [
                { start: 18, end: 42, error: new BBTagRuntimeError('Lock cannot be nested') }
            ],
            setup(ctx) {
                const lock = ctx.createMock<RwLock>({ id: 'lock' });
                const release = ctx.createMock<AsyncDisposable>({ id: 'release' });
                const scope = { type: TagVariableType.GLOBAL } as const;
                getLock.setup(m => m(scope, 'outer'))
                    .returns(lock.instance)
                    .mustHappen(1);
                lock.setup(m => m.enterWrite())
                    .resolves(release.instance)
                    .mustHappen(1);
                release[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
                variables.setup(m => m.scopes).returns([
                    toTagVariableScopeDetails('', scope)
                ]);
            },
            assert(ctx) {
                assert(!ctx.local.inLock);
            }
        },
        {
            title: 'Nested check happens before mode validation',
            code: '{lock;bad;;{fail}}',
            expected: '`Lock cannot be nested`',
            errors: [
                { error: new BBTagRuntimeError('Lock cannot be nested') }
            ],
            postSetup(ctx) {
                ctx.root.inLock = true;
            }
        },
        {
            title: 'Mode validation happens before key validation',
            code: '{lock;bad;;{fail}}',
            expected: `\`${invalidModeMessage}\``,
            errors: [
                { error: new BBTagRuntimeError(invalidModeMessage, 'bad') }
            ],
            assert(ctx) {
                assert(!ctx.local.inLock);
            }
        },
        ...generateInvalidModeTestCases(),
        ...generateEmptyKeyTestCases(),
        ...generateModeTestCases(),
        ...generateScopeTestCases(true),
        ...generateScopeTestCases(false),
        {
            title: 'Only the first prefix is stripped from the key',
            code: '{lock;read;*@myLock;done}',
            expected: 'done',
            setup() {
                const scope = { type: TagVariableType.GLOBAL } as const;
                getLock.setup(m => m(scope, '@myLock'))
                    .returns(lock.instance)
                    .mustHappen(1);
                lock.setup(m => m.enterRead())
                    .resolves(lockHandle.instance)
                    .mustHappen(1);
                lockHandle[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
                variables.setup(m => m.scopes).returns([
                    toTagVariableScopeDetails('*', scope),
                    toTagVariableScopeDetails('@', { type: TagVariableType.TEMP, id: 'FAIL' })
                ]);
            },
            assert(ctx) {
                assert(!ctx.local.inLock);
            }
        },
        {
            title: 'Holds the lock while the code runs, then releases it',
            code: '{lock;write;myLock;{assert}}',
            expected: 'code result',
            subtags: [new AssertSubtag(() => {
                getLock.verify((m, $) => m($({ type: TagVariableType.GLOBAL }), 'myLock')).mustHaveHappened(1);
                lock.verify(m => m.enterWrite()).mustHaveHappened(1);
                lockHandle[Symbol.asyncDispose].verify(m => m()).mustNotHaveHappened();
                return 'code result';
            })],
            setup() {
                const scope = { type: TagVariableType.GLOBAL } as const;
                getLock.setup(m => m(scope, 'myLock')).returns(lock.instance).mustHappen(1);
                lock.setup(m => m.enterWrite()).resolves(lockHandle.instance).mustHappen(1);
                lockHandle[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
                variables.setup(m => m.scopes).returns([
                    toTagVariableScopeDetails('', scope)
                ]);
            },
            assert(ctx) {
                assert(!ctx.local.inLock);
            }
        },
        {
            title: 'Releases the lock when the code contains an error',
            code: '{lock;write;myLock;{eval}}',
            expected: '',
            errors: [
                { start: 19, end: 25, error: new MarkerError('eval', 19) }
            ],
            setup() {
                const scope = { type: TagVariableType.GLOBAL } as const;
                getLock.setup(m => m(scope, 'myLock'))
                    .returns(lock.instance)
                    .mustHappen(1);
                lock.setup(m => m.enterWrite())
                    .resolves(lockHandle.instance)
                    .mustHappen(1);
                lockHandle[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
                variables.setup(m => m.scopes).returns([
                    toTagVariableScopeDetails('', scope)
                ]);
            },
            assert(ctx) {
                assert(!ctx.local.inLock);
            }
        },
        {
            title: 'Is only flagged as locked while the code runs',
            code: '{lock;write;myLock;{assert}}',
            expected: '',
            subtags: [
                new AssertSubtag(ctx => {
                    assert(ctx.local.inLock);
                    return '';
                })
            ],
            setup() {
                const scope = { type: TagVariableType.GLOBAL } as const;
                getLock.setup(m => m(scope, 'myLock'))
                    .returns(lock.instance)
                    .mustHappen(1);
                lock.setup(m => m.enterWrite())
                    .resolves(lockHandle.instance)
                    .mustHappen(1);
                lockHandle[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
                variables.setup(m => m.scopes).returns([
                    toTagVariableScopeDetails('', scope)
                ]);
            },
            assert(ctx) {
                assert(!ctx.local.inLock);
            }
        }
    ]
});

function getScopes(tagVars: boolean): Array<{ prefix: string; scope: TagVariableScope; }> {
    return [
        { prefix: '_', scope: tagVars ? { type: TagVariableType.GUILD_TAG, guildId } : { type: TagVariableType.GUILD_CC, guildId } },
        { prefix: '@', scope: { type: TagVariableType.AUTHOR, authorId } },
        { prefix: '*', scope: { type: TagVariableType.GLOBAL } },
        { prefix: '~', scope: { type: TagVariableType.TEMP, id: tempId } },
        { prefix: '', scope: tagVars ? { type: TagVariableType.LOCAL_TAG, name: tagName } : { type: TagVariableType.LOCAL_CC, guildId, name: tagName } }
    ];
}

function* generateInvalidModeTestCases(): Generator<SubtagTestCase> {
    // The error detail is the lowercased mode
    for (const mode of ['', 'abc', 'readwrite', 'ABC']) {
        yield {
            code: `{lock;${mode};myLock;{fail}}`,
            expected: `\`${invalidModeMessage}\``,
            errors: [
                { error: new BBTagRuntimeError(invalidModeMessage, mode) }
            ],
            assert(ctx) {
                assert(!ctx.local.inLock);
            }
        };
    }
}

function* generateEmptyKeyTestCases(): Generator<SubtagTestCase> {
    for (const mode of ['read', 'write']) {
        yield {
            code: `{lock;${mode};;{fail}}`,
            expected: '`Key cannot be empty`',
            errors: [
                { error: new BBTagRuntimeError('Key cannot be empty') }
            ],
            assert(ctx) {
                assert(!ctx.local.inLock);
            }
        };
    }
}
type LockMode = 'enterRead' | 'enterWrite';
function* generateModeTestCases(): Generator<SubtagTestCase> {
    const modes: Array<[string, LockMode]> = [
        ['read', 'enterRead'], ['READ', 'enterRead'], ['Read', 'enterRead'],
        ['write', 'enterWrite'], ['WRITE', 'enterWrite'], ['Write', 'enterWrite']
    ];
    for (const [mode, lockMode] of modes) {
        const scope = { type: TagVariableType.LOCAL_TAG, name: snowflake.create().toString() } as const;
        yield {
            title: 'Mode is case insensitive',
            code: `{lock;${mode};myLock;{assert}}`,
            expected: 'code result',
            subtags: [new AssertSubtag(() => {
                getLock.verify(m => m(scope, 'myLock')).mustHaveHappened(1);
                lock.verify(m => m[lockMode]()).mustHaveHappened(1);
                lockHandle[Symbol.asyncDispose].verify(m => m()).mustNotHaveHappened();
                return 'code result';
            })],
            setup() {
                getLock.setup(m => m(scope, 'myLock')).returns(lock.instance).mustHappen(1);
                lock.setup(m => m[lockMode]()).resolves(lockHandle.instance).mustHappen(1);
                lockHandle[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
                variables.setup(m => m.scopes).returns([
                    toTagVariableScopeDetails('', scope)
                ]).mustHappen(1);
            },
            assert(ctx) {
                assert(!ctx.local.inLock);
            }
        };
    }
}

function* generateScopeTestCases(tagVars: boolean): Generator<SubtagTestCase> {
    const title = tagVars ? 'Tag' : 'Custom command';
    for (const [mode, lockMode] of [['read', 'enterRead'], ['write', 'enterWrite']] as const) {
        const scopes = getScopes(tagVars);
        for (const { prefix, scope } of scopes) {
            yield {
                title: `${title} using ${mode} with prefix ${JSON.stringify(prefix)}`,
                code: `{lock;${mode};${prefix}myLock;done}`,
                expected: 'done',
                subtags: [new AssertSubtag(() => {
                    getLock.verify(m => m(scope, 'myLock')).mustHaveHappened(1);
                    lock.verify(m => m[lockMode]()).mustHaveHappened(1);
                    lockHandle[Symbol.asyncDispose].verify(m => m()).mustNotHaveHappened();
                    return 'code result';
                })],
                setup(ctx) {
                    ctx.userId = authorId;
                    ctx.tagName = tagName;
                    getLock.setup(m => m(scope, 'myLock')).returns(lock.instance).mustHappen(1);
                    lock.setup(m => m[lockMode]()).resolves(lockHandle.instance).mustHappen(1);
                    lockHandle[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
                    variables.setup(m => m.scopes).returns(
                        scopes.map(({ prefix, scope }) => toTagVariableScopeDetails(prefix, scope))
                    );
                },
                assert(ctx) {
                    assert(!ctx.local.inLock);
                }
            };
        }
    }
}

function toTagVariableScopeDetails(prefix: string, scope: TagVariableScope): TagVariableScopeDetails {
    return {
        prefix,
        scope,
        description: formattableString,
        name: formattableString
    };
}
