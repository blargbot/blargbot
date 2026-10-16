import assert from 'node:assert/strict';

import type { getLock as defaultGetLock, RwLock } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag';
import { LockSubtag } from '@blargbot/bbtag/subtags';
import type { TagVariableScope } from '@blargbot/domain';
import { TagVariableType } from '@blargbot/domain';
import { Mock } from '@blargbot/test-util';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { AssertSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const guildId = '23904768237436873424';
const authorId = '823764823946284623234';
const tagName = 'testTag';
const invalidModeMessage = 'Mode must be \'read\' or \'write\'';
const getLock = new Mock<typeof defaultGetLock>({ id: 'getLock', callable: true });
const lock = new Mock<RwLock>({ id: 'lock' });
const lockHandle = new Mock<AsyncDisposable>({ id: 'lockHandle' });

await runSubtagTests({
    subtag: new LockSubtag({
        getLock: getLock.instance
    }),
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    names: ['lock'],
    setup(ctx) {
        ctx.addMock(lock);
        ctx.addMock(getLock);
        ctx.addMock(lockHandle);
        lock.reset();
        getLock.reset();
        lockHandle.reset();
    },
    cases: [
        {
            title: 'Already inside a lock',
            code: '{lock;write;myLock;{fail}}',
            expected: '`Lock cannot be nested`',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Lock cannot be nested') }
            ],
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
                getLock.setup((m, $) => m($({ type: TagVariableType.LOCAL_TAG, name: ctx.input.tagName }), 'outer'))
                    .returns(lock.instance)
                    .mustHappen(1);
                lock.setup(m => m.enterWrite())
                    .resolves(release.instance)
                    .mustHappen(1);
                release[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
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
                { start: 0, end: 18, error: new BBTagRuntimeError('Lock cannot be nested') }
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
                { start: 0, end: 18, error: new BBTagRuntimeError(invalidModeMessage, 'bad') }
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
                getLock.setup((m, $) => m($({ type: TagVariableType.GLOBAL }), '@myLock'))
                    .returns(lock.instance)
                    .mustHappen(1);
                lock.setup(m => m.enterRead())
                    .resolves(lockHandle.instance)
                    .mustHappen(1);
                lockHandle[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
            },
            assert(ctx) {
                assert(!ctx.local.inLock);
            }
        },
        {
            title: 'Holds the lock while the code runs, then releases it',
            code: '{lock;write;myLock;{assert}}',
            expected: 'code result',
            subtags: [new AssertSubtag((ctx) => {
                getLock.verify((m, $) => m($({ type: TagVariableType.LOCAL_TAG, name: ctx.root.tagName }), 'myLock'))
                    .mustHaveHappened(1);
                lock.verify(m => m.enterWrite()).mustHaveHappened(1);
                lockHandle[Symbol.asyncDispose].verify(m => m()).mustNotHaveHappened();
                return 'code result';
            })],
            setup(ctx) {
                getLock.setup((m, $) => m($({ type: TagVariableType.LOCAL_TAG, name: ctx.input.tagName }), 'myLock'))
                    .returns(lock.instance)
                    .mustHappen(1);
                lock.setup(m => m.enterWrite())
                    .resolves(lockHandle.instance)
                    .mustHappen(1);
                lockHandle[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
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
            setup(ctx) {
                getLock.setup((m, $) => m($({ type: TagVariableType.LOCAL_TAG, name: ctx.input.tagName }), 'myLock'))
                    .returns(lock.instance)
                    .mustHappen(1);
                lock.setup(m => m.enterWrite())
                    .resolves(lockHandle.instance)
                    .mustHappen(1);
                lockHandle[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
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
            setup(ctx) {
                getLock.setup((m, $) => m($({ type: TagVariableType.LOCAL_TAG, name: ctx.input.tagName }), 'myLock'))
                    .returns(lock.instance)
                    .mustHappen(1);
                lock.setup(m => m.enterWrite())
                    .resolves(lockHandle.instance)
                    .mustHappen(1);
                lockHandle[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
            },
            assert(ctx) {
                assert(!ctx.local.inLock);
            }
        }
    ]
});

function getScopes(tagVars: boolean): Array<{ prefix: string; scope: TagVariableScope | undefined; }> {
    return [
        { prefix: '_', scope: tagVars ? { type: TagVariableType.GUILD_TAG, guildId } : { type: TagVariableType.GUILD_CC, guildId } },
        { prefix: '@', scope: { type: TagVariableType.AUTHOR, authorId } },
        { prefix: '*', scope: { type: TagVariableType.GLOBAL } },
        { prefix: '~', scope: undefined },
        { prefix: '', scope: tagVars ? { type: TagVariableType.LOCAL_TAG, name: tagName } : { type: TagVariableType.LOCAL_CC, guildId, name: tagName } }
    ];
}

function* generateInvalidModeTestCases(): Generator<SubtagTestCase> {
    // The error detail is the lowercased mode
    for (const mode of ['', 'abc', 'readwrite', 'ABC']) {
        const code = `{lock;${mode};myLock;{fail}}`;
        yield {
            code,
            expected: `\`${invalidModeMessage}\``,
            errors: [
                { start: 0, end: code.length, error: new BBTagRuntimeError(invalidModeMessage, mode) }
            ],
            assert(ctx) {
                assert(!ctx.local.inLock);
            }
        };
    }
}

function* generateEmptyKeyTestCases(): Generator<SubtagTestCase> {
    for (const mode of ['read', 'write']) {
        const code = `{lock;${mode};;{fail}}`;
        yield {
            code,
            expected: '`Key cannot be empty`',
            errors: [
                { start: 0, end: code.length, error: new BBTagRuntimeError('Key cannot be empty') }
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
        yield {
            title: 'Mode is case insensitive',
            code: `{lock;${mode};myLock;{assert}}`,
            expected: 'code result',
            subtags: [new AssertSubtag((ctx) => {
                getLock.verify((m, $) => m($({ type: TagVariableType.LOCAL_TAG, name: ctx.root.tagName }), 'myLock'))
                    .mustHaveHappened(1);
                lock.verify(m => m[lockMode]()).mustHaveHappened(1);
                lockHandle[Symbol.asyncDispose].verify(m => m()).mustNotHaveHappened();
                return 'code result';
            })],
            setup(ctx) {
                getLock.setup((m, $) => m($({ type: TagVariableType.LOCAL_TAG, name: ctx.input.tagName }), 'myLock'))
                    .returns(lock.instance)
                    .mustHappen(1);
                lock.setup(m => m[lockMode]())
                    .resolves(lockHandle.instance)
                    .mustHappen(1);
                lockHandle[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
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
        for (const { prefix, scope } of getScopes(tagVars)) {
            yield {
                title: `${title} using ${mode} with prefix ${JSON.stringify(prefix)}`,
                code: `{lock;${mode};${prefix}myLock;done}`,
                expected: 'done',
                subtags: [new AssertSubtag(() => {
                    getLock.verify((m, $) => m($(scope), 'myLock'))
                        .mustHaveHappened(1);
                    lock.verify(m => m[lockMode]()).mustHaveHappened(1);
                    lockHandle[Symbol.asyncDispose].verify(m => m()).mustNotHaveHappened();
                    return 'code result';
                })],
                setup(ctx) {
                    ctx.guild.id = guildId;
                    ctx.roles.everyone.id = guildId;
                    ctx.users.command.id = authorId;
                    ctx.input.tagVars = tagVars;
                    ctx.input.tagName = tagName;
                    getLock.setup((m, $) => m($(scope), 'myLock'))
                        .returns(lock.instance)
                        .mustHappen(1);
                    lock.setup(m => m[lockMode]())
                        .resolves(lockHandle.instance)
                        .mustHappen(1);
                    lockHandle[Symbol.asyncDispose].setup(m => m()).resolves().mustHappen(1);
                },
                assert(ctx) {
                    assert(!ctx.local.inLock);
                }
            };
        }
    }
}
