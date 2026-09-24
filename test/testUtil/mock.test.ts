/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable prefer-spread */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Mock, MockError } from './mock.js';

await describe('Mock', async () => {
    await describe('function mocks', async () => {
        await it('mocks a direct invocation', () => {
            const sut = new Mock<(id: string) => string>({ typeof: 'function' });

            sut.setup(x => x('123')).returns('success!');

            assert.equal(sut.instance('123'), 'success!');
            assert.throws(() => sut.instance('456'), MockError);
        });

        await it('ignores this for direct invocations', () => {
            const sut = new Mock<(id: string) => string>({ typeof: 'function' });

            sut.setup(x => x('123')).returns('success!');

            assert.equal(sut.instance.call(new Date(), '123'), 'success!');
            assert.equal(sut.instance.apply(new Date(), ['123']), 'success!');
        });

        await it('can match this through call', () => {
            const sut = new Mock<(id: string) => string>({ typeof: 'function' });

            sut.setup(x => x.call(undefined, '123')).returns('success!');

            assert.equal(sut.instance.call(undefined, '123'), 'success!');
            assert.throws(() => sut.instance.call(new Date(), '123'), MockError);
        });

        await it('can match this through apply', () => {
            const sut = new Mock<(id: string) => string>({ typeof: 'function' });

            sut.setup(x => x.apply(undefined, ['123'])).returns('success!');

            assert.equal(sut.instance.apply(undefined, ['123']), 'success!');
            assert.throws(() => sut.instance.apply(new Date(), ['123']), MockError);
        });

        await it('rejects a non-array-like argument to apply', () => {
            const sut = new Mock<(id: string) => string>({ typeof: 'function' });

            assert.throws(
                () => sut.setup(x => x.apply(undefined, 123 as never)),
                /Apply expects an argument array/
            );
        });

        await it('supports constructors', () => {
            type Constructor = new (id: string) => { id: string; };
            const sut = new Mock<Constructor>({ typeof: 'function' });
            const result = { id: '123' };

            sut.setup(x => new x('123')).returns(result);

            assert.equal(new sut.instance('123'), result);
        });

        await it('can match a derived constructor target', () => {
            type Constructor = new (id: string) => { id: string; };
            const sut = new Mock<Constructor>({ typeof: 'function' });
            const result = { id: '123' };

            sut.setup(x => new x('123')).returns(result);

            assert.equal(new sut.instance('123'), result);
        });
    });

    await describe('method mocks', async () => {
        type Shape = {
            echo(id: string): string;
            add(a: number, b: number): number;
        };

        await it('mocks a direct method call', () => {
            const sut = new Mock<Shape>({ typeof: 'object' });

            sut.setup(x => x.echo('123')).returns('success!');

            assert.equal(sut.instance.echo('123'), 'success!');
            assert.throws(() => sut.instance.echo('456'), MockError);
        });

        await it('does not require a particular this for direct method calls', () => {
            const sut = new Mock<Shape>({ typeof: 'object' });

            sut.setup(x => x.echo('123')).returns('success!');

            const echo = sut.instance.echo;

            assert.equal(echo('123'), 'success!');
            assert.equal(echo.call(new Date(), '123'), 'success!');
            assert.equal(echo.apply(new Date(), ['123']), 'success!');
        });

        await it('can match this for a method through call', () => {
            const sut = new Mock<Shape>({ typeof: 'object' });
            const receiver = {};

            sut.setup(x => x.echo.call(receiver, '123')).returns('success!');

            assert.equal(sut.instance.echo.call(receiver, '123'), 'success!');
            assert.throws(
                () => sut.instance.echo.call({}, '123'),
                MockError
            );
        });

        await it('can match this for a method through apply', () => {
            const sut = new Mock<Shape>({ typeof: 'object' });
            const receiver = {};

            sut.setup(x => x.echo.apply(receiver, ['123'])).returns('success!');

            assert.equal(sut.instance.echo.apply(receiver, ['123']), 'success!');
            assert.throws(
                () => sut.instance.echo.apply({}, ['123']),
                MockError
            );
        });

        await it('rejects directly mocking method.call', () => {
            const sut = new Mock<Shape>({ typeof: 'object' });

            assert.throws(
                () => sut.setup(x => x.echo.call as never),
                /Cannot mock .*\.call' directly/
            );
        });

        await it('rejects directly mocking method.apply', () => {
            const sut = new Mock<Shape>({ typeof: 'object' });

            assert.throws(
                () => sut.setup(x => x.echo.apply as never),
                /Cannot mock .*\.apply' directly/
            );
        });

        await it('supports methods with multiple arguments', () => {
            const sut = new Mock<Shape>({ typeof: 'object' });

            sut.setup(x => x.add(2, 3)).returns(5);

            assert.equal(sut.instance.add(2, 3), 5);
            assert.throws(() => sut.instance.add(3, 2), MockError);
        });
    });

    await describe('return and callback helpers', async () => {
        await it('returns a constant value', () => {
            const sut = new Mock<(value: string) => number>({ typeof: 'function' });

            sut.setup(x => x('value')).returns(42);

            assert.equal(sut.instance('value'), 42);
        });

        await it('invokes a callback with the invocation and mock', () => {
            const sut = new Mock<(value: string) => string>({ typeof: 'function' });

            sut.setup(x => x('value')).invokes((invocation, mock) => {
                assert.equal(invocation.kind, 'call');
                assert.deepEqual(invocation.arguments, ['value']);
                assert.equal(invocation.this, mock);

                return 'result';
            });

            assert.equal(sut.instance('value'), 'result');
        });

        await it('supports async callbacks', async () => {
            const sut = new Mock<(value: string) => Promise<string>>({ typeof: 'function' });

            sut.setup(x => x('value')).invokesAsync(async invocation => {
                return await Promise.resolve(`${String(invocation.arguments[0])}!`);
            });

            assert.equal(await sut.instance('value'), 'value!');
        });

        await it('resolves a value', async () => {
            const sut = new Mock<() => Promise<string>>({ typeof: 'function' });

            sut.setup(x => x()).resolves('success');

            assert.equal(await sut.instance(), 'success');
        });

        await it('throws an error', () => {
            const sut = new Mock<() => string>({ typeof: 'function' });
            const error = new Error('failure');

            sut.setup(x => x()).throws(error);

            assert.throws(() => sut.instance(), error);
        });

        await it('rejects with an error', async () => {
            const sut = new Mock<() => Promise<string>>({ typeof: 'function' });
            const error = new Error('failure');

            sut.setup(x => x()).rejects(error);

            await assert.rejects(sut.instance(), error);
        });
    });

    await describe('argument matchers', async () => {
        await it('matches anything', () => {
            const sut = new Mock<(value: unknown) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.anything)).returns('matched');

            assert.equal(sut.instance('hello'), 'matched');
            assert.equal(sut.instance(123), 'matched');
            assert.equal(sut.instance(null), 'matched');
        });

        await it('matches unknown', () => {
            const sut = new Mock<(value: unknown) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.unknown)).returns('matched');

            assert.equal(sut.instance('hello'), 'matched');
        });

        await it('matches undefined and null strictly', () => {
            const sut = new Mock<(value: string | null | undefined) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.undefined)).returns('undefined');
            sut.setup((x, $) => x($.null)).returns('null');

            assert.equal(sut.instance(undefined), 'undefined');
            assert.equal(sut.instance(null), 'null');
        });

        await it('matches numbers', () => {
            const sut = new Mock<(value: unknown) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.number)).returns('number');

            assert.equal(sut.instance(1), 'number');
            assert.equal(sut.instance(-1), 'number');
            assert.equal(sut.instance(1.5), 'number');
            assert.throws(() => sut.instance('1'), MockError);
        });

        await it('matches integers', () => {
            const sut = new Mock<(value: unknown) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.integer)).returns('integer');

            assert.equal(sut.instance(1), 'integer');
            assert.equal(sut.instance(-1), 'integer');
            assert.throws(() => sut.instance(1.5), MockError);
        });

        await it('matches positive numbers', () => {
            const sut = new Mock<(value: unknown) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.positive)).returns('positive');

            assert.equal(sut.instance(1), 'positive');
            assert.throws(() => sut.instance(0), MockError);
            assert.throws(() => sut.instance(-1), MockError);
        });

        await it('matches negative numbers', () => {
            const sut = new Mock<(value: unknown) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.negative)).returns('negative');

            assert.equal(sut.instance(-1), 'negative');
            assert.throws(() => sut.instance(0), MockError);
            assert.throws(() => sut.instance(1), MockError);
        });

        await it('matches strings', () => {
            const sut = new Mock<(value: unknown) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.string)).returns('string');

            assert.equal(sut.instance('hello'), 'string');
            assert.throws(() => sut.instance(123), MockError);
        });

        await it('matches symbols', () => {
            const sut = new Mock<(value: unknown) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.symbol)).returns('symbol');

            assert.equal(sut.instance(Symbol('value')), 'symbol');
            assert.throws(() => sut.instance('symbol'), MockError);
        });

        await it('matches booleans', () => {
            const sut = new Mock<(value: unknown) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.boolean)).returns('boolean');

            assert.equal(sut.instance(true), 'boolean');
            assert.equal(sut.instance(false), 'boolean');
            assert.throws(() => sut.instance(1), MockError);
        });

        await it('matches bigints', () => {
            const sut = new Mock<(value: unknown) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.bigint)).returns('bigint');

            assert.equal(sut.instance(1n), 'bigint');
            assert.throws(() => sut.instance(1), MockError);
        });

        await it('matches a strict value', () => {
            const sut = new Mock<(value: object) => string>({ typeof: 'function' });
            const value = {};

            sut.setup((x, $) => x($.strict(value))).returns('matched');

            assert.equal(sut.instance(value), 'matched');
            assert.throws(() => sut.instance({}), MockError);
        });

        await it('matches with satisfies', () => {
            const sut = new Mock<(value: unknown) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.satisfies(value => typeof value === 'string' && value.length > 3)))
                .returns('matched');

            assert.equal(sut.instance('hello'), 'matched');
            assert.throws(() => sut.instance('hi'), MockError);
        });

        await it('matches with asserts', () => {
            const sut = new Mock<(value: unknown) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.asserts(value => {
                assert(typeof value === 'string');
                assert.ok(value.length > 3);
            }))).returns('matched');

            assert.equal(sut.instance('hello'), 'matched');
            assert.throws(() => sut.instance('hi'), MockError);
        });

        await it('matches one of several values', () => {
            const sut = new Mock<(value: number) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.oneOf(1, 2, 3))).returns('matched');

            assert.equal(sut.instance(1), 'matched');
            assert.equal(sut.instance(2), 'matched');
            assert.equal(sut.instance(3), 'matched');
            assert.throws(() => sut.instance(4), MockError);
        });

        await it('matches instances of a constructor', () => {
            const sut = new Mock<(value: object) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.instanceOf(Date))).returns('date');

            assert.equal(sut.instance(new Date()), 'date');
            assert.throws(() => sut.instance({}), MockError);
        });

        await it('matches object shapes with looksLike', () => {
            const sut = new Mock<(value: { id: number; name: string; }) => string>({
                typeof: 'function'
            });

            sut.setup((x, $) => x($.looksLike({ id: 1, name: 'test' }))).returns('matched');

            assert.equal(sut.instance({ id: 1, name: 'test' }), 'matched');
            assert.throws(
                () => sut.instance({ id: 2, name: 'test' }),
                MockError
            );
        });

        await it('supports combining matchers in a single setup', () => {
            const sut = new Mock<(id: number, name: string) => string>({
                typeof: 'function'
            });

            sut.setup((x, $) => x($.positive, $.string)).returns('matched');

            assert.equal(sut.instance(10, 'test'), 'matched');
            assert.throws(() => sut.instance(-10, 'test'), MockError);
            assert.throws(() => sut.instance(10, 20 as never), MockError);
        });

        await it('matches the mock instance with this', () => {
            const sut = new Mock<() => string>({ typeof: 'function' });

            sut.setup(x => x.call(x)).returns('matched');

            assert.equal(sut.instance.call(sut.instance), 'matched');
            assert.throws(() => sut.instance.call({}), MockError);
        });
    });

    await describe('setup precedence', async () => {
        await it('prefers a more specific setup', () => {
            const sut = new Mock<(value: number) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.number)).returns('number');
            sut.setup(x => x(1)).returns('one');

            assert.equal(sut.instance(1), 'one');
            assert.equal(sut.instance(2), 'number');
        });

        await it('uses a fallback setup when no more specific setup matches', () => {
            const sut = new Mock<(value: number) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.number)).returns('fallback', { isFallback: true });
            sut.setup(x => x(1)).returns('one');

            assert.equal(sut.instance(1), 'one');
            assert.equal(sut.instance(2), 'fallback');
        });

        await it('does not let a fallback setup replace an uninvoked specific setup', () => {
            const sut = new Mock<(value: number) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.number)).returns('number', { isFallback: true });
            sut.setup(x => x(1)).returns('one');

            assert.equal(sut.instance(1), 'one');
        });

        await it('rejects conflicting method and property setups', () => {
            type Shape = {
                value: () => string;
            };

            const sut = new Mock<Shape>({ typeof: 'object' });

            sut.setup(x => x.value()).returns('method');

            assert.throws(
                () => sut.setup(x => x.value).returns(() => 'property'),
                /already configured/
            );
        });
    });

    await describe('properties', async () => {
        await it('mocks a property getter', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            sut.setup(x => x.value).returns('hello');

            assert.equal(sut.instance.value, 'hello');
        });

        await it('mocks a property setter with setupSet', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });
            let value = '';

            sut.setupSet((x, $) => x.value = $.string).invokes(invocation => {
                value = invocation.arguments[0] as string;
                return true;
            });

            sut.instance.value = 'hello';

            assert.equal(value, 'hello');
        });

        await it('supports setupProperty', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            using _ = sut.setupProperty('value', 'initial');

            assert.equal(sut.instance.value, 'initial');

            sut.instance.value = 'updated';

            assert.equal(sut.instance.value, 'updated');
        });

        await it('rejects using assignment directly in setup', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            assert.throws(
                () => sut.setup(x => x.value = 'hello'),
                /Cannot setup set methods/
            );
        });

        await it('supports Reflect.set in setup', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            sut.setup(x => Reflect.set(x, 'value', 'hello')).returns(true);

            assert.equal(Reflect.set(sut.instance, 'value', 'hello'), true);
        });

        await it('mocks the delete operator', () => {
            type Shape = { value?: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            sut.setup(x => delete x.value).returns(true);

            assert.equal(delete sut.instance.value, true);
        });

        await it('mocks the in operator', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            sut.setup(x => 'value' in x).returns(true);

            assert.equal('value' in sut.instance, true);
        });
    });

    await describe('reflection operations', async () => {
        await it('mocks getPrototypeOf', () => {
            const sut = new Mock<object>({ typeof: 'object' });
            const prototype = {};

            sut.setup(x => Reflect.getPrototypeOf(x)).returns(prototype);

            assert.equal(Reflect.getPrototypeOf(sut.instance), prototype);
        });

        await it('mocks setPrototypeOf', () => {
            const sut = new Mock<object>({ typeof: 'object' });
            const prototype = {};

            sut.setup(x => Reflect.setPrototypeOf(x, prototype)).returns(true);

            assert.equal(Reflect.setPrototypeOf(sut.instance, prototype), true);
        });

        await it('mocks ownKeys', () => {
            const sut = new Mock<object>({ typeof: 'object' });

            sut.setup(x => Reflect.ownKeys(x)).returns(['one', 'two']);

            assert.deepEqual(Reflect.ownKeys(sut.instance), ['one', 'two']);
        });

        await it('mocks a property descriptor', () => {
            const sut = new Mock<{ value: string; }>({ typeof: 'object' });

            sut.setup(x => Reflect.getOwnPropertyDescriptor(x, 'value')).returns({
                configurable: true,
                enumerable: false,
                value: 'hello',
                writable: true
            });

            assert.deepEqual(
                Reflect.getOwnPropertyDescriptor(sut.instance, 'value'),
                {
                    configurable: true,
                    enumerable: false,
                    value: 'hello',
                    writable: true
                }
            );
        });

        await it('cannot intercept, but can verify isExtensible', () => {
            const sut = new Mock<object>({ typeof: 'object' });

            sut.setup(x => Reflect.isExtensible(x)).returns(true).mustHappen();

            assert.throws(() => Reflect.isExtensible(sut.instance));

            sut.verifyAll();
        });
        await it('cannot intercept, but can verify preventExtensions', () => {
            const sut = new Mock<object>({ typeof: 'object' });

            sut.setup(x => Reflect.preventExtensions(x)).returns(true).mustHappen();

            assert.throws(() => Reflect.preventExtensions(sut.instance));

            sut.verifyAll();
        });

        await it('supports defineProperty through Reflect', () => {
            const sut = new Mock<object>({ typeof: 'object' });

            sut.setup(x => Reflect.defineProperty(x, 'value', {
                configurable: true,
                enumerable: true,
                value: 123,
                writable: true
            })).returns(true);

            assert.equal(
                Reflect.defineProperty(sut.instance, 'value', {
                    configurable: true,
                    enumerable: true,
                    value: 123,
                    writable: true
                }),
                true
            );
        });
    });

    await describe('verification', async () => {
        await it('exposes recorded invocations', () => {
            const sut = new Mock<(value: string) => string>({ typeof: 'function' });

            sut.setup(x => x('hello')).returns('result');

            sut.instance('hello');

            assert.equal(sut.invocations.length, 1);
            assert.equal(sut.invocations[0].kind, 'call');
            assert.deepEqual(sut.invocations[0].arguments, ['hello']);
        });

        await it('returns a copy of the invocation list', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x()).returns(undefined);
            sut.instance();

            const invocations = sut.invocations as unknown[];

            invocations.length = 0;

            assert.equal(sut.invocations.length, 1);
        });

        await it('supports mustHaveHappened', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x()).returns(undefined);

            sut.instance();

            sut.verify(x => x()).mustHaveHappened();
        });

        await it('supports mustHaveHappened with an exact count', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x()).returns(undefined);

            sut.instance();
            sut.instance();

            sut.verify(x => x()).mustHaveHappened(2);
        });

        await it('supports mustHaveHappened with a range', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x()).returns(undefined);

            sut.instance();
            sut.instance();

            sut.verify(x => x()).mustHaveHappened(1, 3);
        });

        await it('supports mustHaveHappened with a set of counts', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x()).returns(undefined);

            sut.instance();
            sut.instance();

            sut.verify(x => x()).mustHaveHappened([1, 2, 3]);
        });

        await it('supports mustNotHaveHappened', () => {
            const sut = new Mock<(v: string) => void>({ typeof: 'function' });

            sut.setup(x => x('called')).returns(undefined);

            sut.verify(x => x('not called')).mustNotHaveHappened();
        });

        await it('fails verification when the expected call did not happen', () => {
            const sut = new Mock<(value: string) => void>({ typeof: 'function' });

            sut.setup(x => x('called')).returns(undefined);

            assert.throws(
                () => sut.verify(x => x('called')).mustHaveHappened(),
                /have been called/
            );
        });

        await it('supports custom verification assertions', () => {
            const sut = new Mock<(value: string) => void>({ typeof: 'function' });

            sut.setup(x => x('hello')).returns(undefined);
            sut.instance('hello');

            sut.verify(x => x('hello')).satisfies(invocations => {
                assert.equal(invocations.length, 1);
                assert.deepEqual(invocations[0].arguments, ['hello']);
            });
        });

        await it('supports setup-level mustHappen', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x()).returns(undefined).mustHappen();

            sut.instance();

            sut.verifyAll();
        });

        await it('supports setup-level mustNotHappen', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x()).returns(undefined).mustNotHappen();

            sut.verifyAll();
        });

        await it('can register an assertion with addAssertion', () => {
            const sut = new Mock<(value: string) => void>({ typeof: 'function' });

            sut.setup(x => x('hello')).returns(undefined).addAssertion(invocations => {
                assert.equal(invocations.length, 1);
            });

            sut.instance('hello');

            sut.verifyAll();
        });
    });

    await describe('lifecycle', async () => {
        await it('clearInvocations removes recorded invocations', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x()).returns(undefined);
            sut.instance();

            assert.equal(sut.invocations.length, 1);

            sut.clearInvocations();

            assert.equal(sut.invocations.length, 0);
        });

        await it('clearInvocations resets invocation state used by setup matching', () => {
            const sut = new Mock<(value: number) => string>({ typeof: 'function' });

            sut.setup(x => x(1)).returns('v1');
            sut.setup(x => x(1)).returns('v2');

            assert.equal(sut.instance(1), 'v1');
            assert.equal(sut.instance(1), 'v2');

            sut.clearInvocations();

            assert.equal(sut.instance(1), 'v1');
        });

        await it('clearSetups removes all setups', () => {
            const sut = new Mock<() => string>({ typeof: 'function' });

            sut.setup(x => x()).returns('value');

            assert.equal(sut.instance(), 'value');

            sut.clearSetups();

            assert.throws(() => sut.instance(), MockError);
        });

        await it('clearVerifiers removes registered verifiers', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x()).returns(undefined).mustHappen();

            sut.clearVerifiers();

            sut.verifyAll();
        });

        await it('reset clears setups, invocations and verifiers', () => {
            const sut = new Mock<() => string>({ typeof: 'function' });

            sut.setup(x => x()).returns('value').mustHappen();

            sut.instance();

            assert.equal(sut.invocations.length, 1);

            sut.reset();

            assert.equal(sut.invocations.length, 0);
            assert.throws(() => sut.instance(), MockError);
        });

        await it('disposes an individual setup', () => {
            const sut = new Mock<() => string>({ typeof: 'function' });

            using setup = sut.setup(x => x()).returns('value');

            assert.equal(sut.instance(), 'value');

            setup[Symbol.dispose]();

            assert.throws(() => sut.instance(), MockError);
        });

        await it('disposing a setup twice is harmless', () => {
            const sut = new Mock<() => string>({ typeof: 'function' });

            const setup = sut.setup(x => x()).returns('value');

            setup[Symbol.dispose]();
            setup[Symbol.dispose]();

            assert.throws(() => sut.instance(), MockError);
        });
    });

    await describe('loose mode', async () => {
        await it('does not throw for an unconfigured invocation', () => {
            const sut = new Mock<(value: string) => string>({
                typeof: 'function',
                loose: true
            });

            assert.equal(sut.instance('hello'), undefined);
        });

        await it('returns default values for unconfigured object operations', () => {
            type Shape = {
                value?: string;
                method(): string;
            };

            const sut = new Mock<Shape>({
                typeof: 'object',
                loose: true
            });

            assert.equal(sut.instance.value, undefined);
            assert.equal(sut.instance.method, undefined);
            assert.equal('value' in sut.instance, false);
            assert.equal(delete sut.instance.value, true);
        });

        await it('still records loose-mode invocations', () => {
            const sut = new Mock<() => void>({
                typeof: 'function',
                loose: true
            });

            sut.instance();

            assert.equal(sut.invocations.length, 1);
        });
    });

    await describe('strict mode errors', async () => {
        await it('reports an unsupported invocation', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });
            const instance = sut.instance;

            assert.throws(
                () => instance(),
                {
                    name: 'MockError',
                    message: 'No setup has been configured for $mock()'
                }
            );
        });

        await it('rejects deep member setups', () => {
            type Shape = {
                foo: {
                    bar: string;
                };
            };

            const sut = new Mock<Shape>({ typeof: 'object' });

            assert.throws(
                () => sut.setup(x => x.foo.bar),
                /Cannot mock deep members/
            );
        });

        await it('rejects multiple expressions in one setup', () => {
            const sut = new Mock<(a: string) => string>({ typeof: 'function' });

            assert.throws(
                () => sut.setup(x => {
                    x('a');
                    return x('b');
                }),
                /Cannot mock multiple expressions/
            );
        });

        await it('rejects an action with no mockable operation', () => {
            const sut = new Mock<object>({ typeof: 'object' });

            assert.throws(
                () => sut.setup(() => undefined),
                /Expression is not mockable/
            );
        });

        await it('does not allow argument matchers to be interacted with', () => {
            const sut = new Mock<(value: unknown) => void>({ typeof: 'function' });

            assert.throws(
                () => sut.setup((x, $) => {
                    const matcher = $.anything as unknown as Record<string, unknown>;
                    return x(matcher.foo);
                }),
                MockError
            );
        });
    });

    await describe('prototypes', async () => {
        await it('can be used as a prototype without intercepting derived writes', () => {
            type Shape = {
                value?: string;
            };

            const sut = new Mock<Shape>({ typeof: 'object' });
            const derived = Object.create(sut.instance);

            derived.value = 'derived';

            assert.equal(derived.value, 'derived');
            assert.equal(sut.invocations.length, 0);
        });

        await it('can mock inherited method calls', () => {
            type Shape = {
                method(value: string): string;
            };

            const sut = new Mock<Shape>({ typeof: 'object' });
            const derived = Object.create(sut.instance);

            sut.setup(x => x.method('hello')).returns('world');

            assert.equal(derived.method('hello'), 'world');
        });
    });
});
