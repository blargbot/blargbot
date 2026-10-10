/* eslint-disable @typescript-eslint/naming-convention */
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
            assert.throws(
                () => sut.instance.call(new Date(), '123'),
                MockError
            );
        });

        await it('can match this through apply', () => {
            const sut = new Mock<(id: string) => string>({ typeof: 'function' });

            sut.setup(x => x.apply(undefined, ['123'])).returns('success!');

            assert.equal(sut.instance.apply(undefined, ['123']), 'success!');
            assert.throws(
                () => sut.instance.apply(new Date(), ['123']),
                MockError
            );
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

    await describe('nested constructors', async () => {
        interface SomeObject {
            id: string;
        }

        interface SomeType {
            InnerClass: new (id: string) => SomeObject;
        }

        await it('mocks a nested constructor', () => {
            const sut = new Mock<SomeType>({ typeof: 'object' });
            const expected: SomeObject = { id: 'abc' };

            sut.setup(x => new x.InnerClass('abc')).returns(expected);

            assert.equal(new sut.instance.InnerClass('abc'), expected);
        });

        await it('matches arguments passed to a nested constructor', () => {
            const sut = new Mock<SomeType>({ typeof: 'object' });

            const abc: SomeObject = { id: 'abc' };
            const def: SomeObject = { id: 'def' };

            sut.setup(x => new x.InnerClass('abc')).returns(abc);
            sut.setup(x => new x.InnerClass('def')).returns(def);

            assert.equal(new sut.instance.InnerClass('abc'), abc);
            assert.equal(new sut.instance.InnerClass('def'), def);
        });

        await it('throws when a nested constructor invocation has no matching setup', () => {
            const sut = new Mock<SomeType>({ typeof: 'object' });

            sut.setup(x => new x.InnerClass('abc')).returns({ id: 'abc' });

            assert.throws(
                () => new sut.instance.InnerClass('def'),
                error => error instanceof MockError
            );
        });

        await it('records nested constructor invocations', () => {
            const sut = new Mock<SomeType>({ typeof: 'object' });
            const expected: SomeObject = { id: 'abc' };

            sut.setup(x => new x.InnerClass('abc')).returns(expected);

            new sut.instance.InnerClass('abc');

            assert.equal(sut.invocations.length, 1);
            assert.equal(sut.invocations[0].kind, 'newNested');
            assert.deepEqual(sut.invocations[0].arguments, ['abc']);
        });

        await it('verifies nested constructor invocations', () => {
            const sut = new Mock<SomeType>({ typeof: 'object' });
            const expected: SomeObject = { id: 'abc' };

            sut.setup(x => new x.InnerClass('abc')).returns(expected);

            new sut.instance.InnerClass('abc');

            sut.verify(x => new x.InnerClass('abc')).mustHaveHappened();
        });

        await it('supports argument matchers for nested constructors', () => {
            const sut = new Mock<SomeType>({ typeof: 'object' });
            const expected: SomeObject = { id: 'abc' };

            sut.setup((x, $) => new x.InnerClass($.string)).returns(expected);

            assert.equal(
                new sut.instance.InnerClass('abc'),
                expected
            );

            assert.equal(
                new sut.instance.InnerClass('def'),
                expected
            );
        });

        await it('supports multiple nested constructors on the same mock', () => {
            interface ExtendedType extends SomeType {
                OtherClass: new (value: number) => SomeObject;
            }

            const sut = new Mock<ExtendedType>({ typeof: 'object' });

            const first: SomeObject = { id: 'first' };
            const second: SomeObject = { id: 'second' };

            sut.setup(x => new x.InnerClass('abc')).returns(first);
            sut.setup(x => new x.OtherClass(123)).returns(second);

            assert.equal(new sut.instance.InnerClass('abc'), first);
            assert.equal(new sut.instance.OtherClass(123), second);
        });

        await it('supports a nested constructor used through a local reference', () => {
            const sut = new Mock<SomeType>({ typeof: 'object' });
            const expected: SomeObject = { id: 'abc' };

            sut.setup(x => new x.InnerClass('abc')).returns(expected);

            const InnerClass = sut.instance.InnerClass;

            assert.equal(new InnerClass('abc'), expected);
        });

        await it('supports repeated nested constructor invocations', () => {
            const sut = new Mock<SomeType>({ typeof: 'object' });

            const first: SomeObject = { id: 'first' };
            const second: SomeObject = { id: 'second' };

            sut.setup(x => new x.InnerClass('abc')).returns(first);
            sut.setup(x => new x.InnerClass('abc')).returns(second);

            assert.equal(new sut.instance.InnerClass('abc'), first);
            assert.equal(new sut.instance.InnerClass('abc'), second);
            assert.throws(
                () => new sut.instance.InnerClass('abc'),
                MockError
            );
        });

        await it('supports a fallback setup for a nested constructor', () => {
            const sut = new Mock<SomeType>({ typeof: 'object' });

            const expected: SomeObject = { id: 'fallback' };

            sut.setup((x, $) => new x.InnerClass($.string))
                .returns(expected, { isFallback: true });

            assert.equal(
                new sut.instance.InnerClass('abc'),
                expected
            );

            assert.equal(
                new sut.instance.InnerClass('def'),
                expected
            );
        });

        await it('supports loose nested constructors', () => {
            const sut = new Mock<SomeType>({
                typeof: 'object',
                loose: true
            });

            assert.equal(
                new sut.instance.InnerClass('abc'),
                null
            );
        });

        await it('does not allow a property to be configured as both a getter and a constructor', () => {
            const sut = new Mock<SomeType>({ typeof: 'object' });

            sut.setup(x => new x.InnerClass('abc')).returns({ id: 'abc' });

            assert.throws(
                () => sut.setup(x => x.InnerClass).returns(class InnerClass { public id = 'abc'; }),
                /already configured/
            );
        });

        await it('does not allow a property to be configured as both a constructor and a method', () => {
            const sut = new Mock<SomeType>({ typeof: 'object' });

            sut.setup(x => new x.InnerClass('abc')).returns({ id: 'abc' });

            assert.throws(
                // @ts-expect-error Intentional, we want to make sure this is caught and prevented
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                () => sut.setup(x => x.InnerClass('abc')).returns({ id: 'value' }),
                /already configured/
            );
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

        await it('supports matching this through the this matcher', () => {
            const sut = new Mock<Shape>({ typeof: 'object' });

            sut.setup((x, $) => x.echo.call($.this, '123'))
                .returns('success!');

            assert.equal(sut.instance.echo('123'), 'success!');

            assert.throws(
                () => sut.instance.echo.call({}, '123'),
                MockError
            );
        });

        await it('supports the this matcher for derived objects', () => {
            const sut = new Mock<Shape>({ typeof: 'object' });
            const derived = Object.create(sut.instance);

            sut.setup((x, $) => x.echo.call($.this, '123'))
                .returns('success!');

            assert.equal(derived.echo('123'), 'success!');
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
            const sut = new Mock<(value: string) => Promise<string>>({
                typeof: 'function'
            });

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
            const sut = new Mock<(value: string | null | undefined) => string>({
                typeof: 'function'
            });

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

            sut.setup((x, $) => x($.satisfies(
                value => typeof value === 'string' && value.length > 3
            ))).returns('matched');

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
            const sut = new Mock<(value: { id: number; name: string; }) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.looksLike({
                id: 1,
                name: 'test'
            }))).returns('matched');

            assert.equal(
                sut.instance({ id: 1, name: 'test' }),
                'matched'
            );

            assert.throws(
                () => sut.instance({ id: 2, name: 'test' }),
                MockError
            );
        });

        await it('supports combining matchers in a single setup', () => {
            const sut = new Mock<(id: number, name: string) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.positive, $.string)).returns('matched');

            assert.equal(sut.instance(10, 'test'), 'matched');
            assert.throws(() => sut.instance(-10, 'test'), MockError);
            assert.throws(() => sut.instance(10, 20 as never), MockError);
        });

        await it('supports matchers inside looksLike', () => {
            type Value = {
                id: number;
                name: string;
            };

            const sut = new Mock<(value: Value) => string>({
                typeof: 'function'
            });

            sut.setup((x, $) => x($.looksLike({
                id: $.positive,
                name: $.string
            }))).returns('matched');

            assert.equal(
                sut.instance({ id: 123, name: 'test' }),
                'matched'
            );

            assert.throws(
                () => sut.instance({ id: -1, name: 'test' }),
                MockError
            );
        });

        await it('supports matchers inside arrays in looksLike', () => {
            type Value = {
                values: number[];
            };

            const sut = new Mock<(value: Value) => string>({
                typeof: 'function'
            });

            sut.setup((x, $) => x($.looksLike({
                values: [$.positive, $.positive]
            }))).returns('matched');

            assert.equal(
                sut.instance({ values: [1, 2] }),
                'matched'
            );

            assert.throws(
                () => sut.instance({ values: [1, -2] }),
                MockError
            );

            assert.throws(
                () => sut.instance({ values: [1, 2, 3] }),
                MockError
            );
        });

        await it('supports matchers as options in oneOf', () => {
            const sut = new Mock<(value: unknown) => string>({
                typeof: 'function'
            });

            sut.setup((x, $) => x($.oneOf($.string, 123)))
                .returns('matched');

            assert.equal(sut.instance('value'), 'matched');
            assert.equal(sut.instance(123), 'matched');
            assert.throws(() => sut.instance(false), MockError);
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

            sut.setup((x, $) => x($.number))
                .returns('fallback', { isFallback: true });

            sut.setup(x => x(1)).returns('one');

            assert.equal(sut.instance(1), 'one');
            assert.equal(sut.instance(2), 'fallback');
        });

        await it('does not let a fallback setup replace an uninvoked specific setup', () => {
            const sut = new Mock<(value: number) => string>({ typeof: 'function' });

            sut.setup((x, $) => x($.number))
                .returns('number', { isFallback: true });

            sut.setup(x => x(1)).returns('one');

            assert.equal(sut.instance(1), 'one');
        });

        await it('uses a previously unused specific setup before a fallback', () => {
            const sut = new Mock<(value: number) => string>({
                typeof: 'function'
            });

            sut.setup(x => x(1)).returns('one');
            sut.setup((x, $) => x($.number))
                .returns('fallback', { isFallback: true });

            assert.equal(sut.instance(1), 'one');
            assert.equal(sut.instance(1), 'fallback');
        });

        await it('allows multiple specific setups for the same expression', () => {
            const sut = new Mock<(value: number) => string>({
                typeof: 'function'
            });

            sut.setup(x => x(1)).returns('first');
            sut.setup(x => x(1)).returns('second');

            assert.equal(sut.instance(1), 'first');
            assert.equal(sut.instance(1), 'second');

            assert.throws(() => sut.instance(1), MockError);
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

        await it('setupSet can match a specific value', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            sut.setupSet(x => x.value = 'expected').returns(true);

            assert.equal(
                Reflect.set(sut.instance, 'value', 'expected'),
                true
            );

            assert.throws(
                () => Reflect.set(sut.instance, 'value', 'different'),
                MockError
            );
        });

        await it('setupSet can return false', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            sut.setupSet((x, $) => x.value = $.string).returns(false);

            assert.equal(
                Reflect.set(sut.instance, 'value', 'value'),
                false
            );
        });

        await it('rejects setupSet for a non-set expression', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            assert.throws(
                () => sut.setupSet(x => x.value as never),
                /Only expressions of the form/
            );
        });

        await it('supports setupProperty', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            using _ = sut.setupProperty('value', 'initial');

            assert.equal(sut.instance.value, 'initial');

            sut.instance.value = 'updated';

            assert.equal(sut.instance.value, 'updated');
        });

        await it('setupProperty tracks successive assignments', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            using _ = sut.setupProperty('value', 'initial');

            sut.instance.value = 'first';
            assert.equal(sut.instance.value, 'first');

            sut.instance.value = 'second';
            assert.equal(sut.instance.value, 'second');
        });

        await it('disposing setupProperty removes its getter and setter', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            const setup = sut.setupProperty('value', 'initial');

            assert.equal(sut.instance.value, 'initial');

            setup[Symbol.dispose]();

            assert.throws(() => sut.instance.value, MockError);
            assert.throws(
                () => {
                    sut.instance.value = 'updated';
                },
                MockError
            );
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

            assert.equal(
                Reflect.set(sut.instance, 'value', 'hello'),
                true
            );
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

            assert.equal(
                Reflect.setPrototypeOf(sut.instance, prototype),
                true
            );
        });

        await it('mocks ownKeys', () => {
            const sut = new Mock<object>({ typeof: 'object' });

            sut.setup(x => Reflect.ownKeys(x)).returns(['one', 'two']);

            assert.deepEqual(
                Reflect.ownKeys(sut.instance),
                ['one', 'two']
            );
        });

        await it('mocks a property descriptor', () => {
            const sut = new Mock<{ value: string; }>({ typeof: 'object' });

            sut.setup(x => Reflect.getOwnPropertyDescriptor(x, 'value'))
                .returns({
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

            sut.setup(x => Reflect.isExtensible(x))
                .returns(true)
                .mustHappen();

            assert.throws(
                () => Reflect.isExtensible(sut.instance),
                MockError
            );

            sut.verifyAll();
        });

        await it('can allow an uninterceptable isExtensible setup', () => {
            const sut = new Mock<object>({ typeof: 'object' });

            sut.setup(x => Reflect.isExtensible(x))
                .returns(false, {
                    allowUninterceptableInvocations: true
                });

            assert.equal(
                Reflect.isExtensible(sut.instance),
                true
            );

            assert.equal(sut.invocations.length, 1);
            assert.equal(sut.invocations[0].canIntercept, false);
        });

        await it('cannot intercept, but can verify preventExtensions', () => {
            const sut = new Mock<object>({ typeof: 'object' });

            sut.setup(x => Reflect.preventExtensions(x))
                .returns(true)
                .mustHappen();

            assert.throws(
                () => Reflect.preventExtensions(sut.instance),
                MockError
            );

            sut.verifyAll();
        });

        await it('can allow an uninterceptable preventExtensions setup', () => {
            const sut = new Mock<object>({ typeof: 'object' });

            sut.setup(x => Reflect.preventExtensions(x))
                .returns(false, {
                    allowUninterceptableInvocations: true
                });

            assert.equal(
                Reflect.preventExtensions(sut.instance),
                true
            );

            assert.equal(
                Reflect.isExtensible(sut.instance),
                false
            );
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

        await it('supports a non-configurable property definition', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            sut.setup(x => Reflect.defineProperty(x, 'value', {
                configurable: false,
                enumerable: true,
                value: 'value',
                writable: true
            })).returns(true);

            assert.equal(
                Reflect.defineProperty(sut.instance, 'value', {
                    configurable: false,
                    enumerable: true,
                    value: 'value',
                    writable: true
                }),
                true
            );

            assert.deepEqual(
                Reflect.getOwnPropertyDescriptor(sut.instance, 'value'),
                {
                    configurable: false,
                    enumerable: true,
                    value: 'value',
                    writable: true
                }
            );
        });

        await it('falls back to the real property descriptor after it becomes non-configurable', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            Object.defineProperty(sut.instance, 'value', {
                configurable: false,
                enumerable: true,
                value: 'actual',
                writable: true
            });

            assert.equal(sut.instance.value, 'actual');
            assert.equal('value' in sut.instance, true);
            assert.deepEqual(
                Reflect.getOwnPropertyDescriptor(sut.instance, 'value'),
                {
                    configurable: false,
                    enumerable: true,
                    value: 'actual',
                    writable: true
                }
            );
        });

        await it('writes to a writable non-configurable property', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            Object.defineProperty(sut.instance, 'value', {
                configurable: false,
                enumerable: true,
                value: 'actual',
                writable: true
            });

            assert.equal(
                Reflect.set(sut.instance, 'value', 'updated'),
                true
            );

            assert.equal(sut.instance.value, 'updated');
        });

        await it('does not delete a non-configurable property', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            Object.defineProperty(sut.instance, 'value', {
                configurable: false,
                enumerable: true,
                value: 'actual',
                writable: true
            });

            assert.equal(
                Reflect.deleteProperty(sut.instance, 'value'),
                false
            );

            assert.equal('value' in sut.instance, true);
        });

        await it('uses the real own keys after preventExtensions', () => {
            type Shape = { value: string; };
            const sut = new Mock<Shape>({ typeof: 'object' });

            Object.defineProperty(sut.instance, 'value', {
                configurable: true,
                enumerable: true,
                value: 'actual',
                writable: true
            });

            Object.preventExtensions(sut.instance);

            assert.deepEqual(
                Reflect.ownKeys(sut.instance),
                ['value']
            );
        });

        await it('uses the real prototype after preventExtensions', () => {
            const sut = new Mock<object>({ typeof: 'object' });
            const prototype = {};

            Object.setPrototypeOf(sut.instance, prototype);
            Object.preventExtensions(sut.instance);

            assert.equal(
                Object.getPrototypeOf(sut.instance),
                prototype
            );
        });

        await it('rejects an Object.setPrototypeOf setup', () => {
            const sut = new Mock<object>({ typeof: 'object' });

            assert.throws(
                () => sut.setup(x => Object.setPrototypeOf(x, null) as object),
                /Cannot setup using Object\.setPrototypeOf/
            );
        });

        await it('accepts a Reflect.setPrototypeOf setup', () => {
            const sut = new Mock<object>({ typeof: 'object' });
            const prototype = {};

            sut.setup(x => Reflect.setPrototypeOf(x, prototype)).returns(true);

            assert.equal(
                Reflect.setPrototypeOf(sut.instance, prototype),
                true
            );
        });

        await it('rejects an Object.defineProperty setup', () => {
            const sut = new Mock<object>({ typeof: 'object' });

            assert.throws(
                () => sut.setup(x => Object.defineProperty(x, 'value', {
                    configurable: true,
                    value: 'value'
                })),
                /Cannot setup using Object\.defineProperty/
            );
        });

        await it('rejects an Object.preventExtensions setup', () => {
            const sut = new Mock<object>({ typeof: 'object' });

            assert.throws(
                () => sut.setup(x => Object.preventExtensions(x)),
                /Cannot setup using Object\.preventExtensions/
            );
        });
    });

    await describe('verification', async () => {
        await it('exposes recorded invocations', () => {
            const sut = new Mock<(value: string) => string>({
                typeof: 'function'
            });

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
            const sut = new Mock<(v: string) => void>({
                typeof: 'function'
            });

            sut.setup(x => x('called')).returns(undefined);

            sut.verify(x => x('not called')).mustNotHaveHappened();
        });

        await it('fails verification when the expected call did not happen', () => {
            const sut = new Mock<(value: string) => void>({
                typeof: 'function'
            });

            sut.setup(x => x('called')).returns(undefined);

            assert.throws(
                () => sut.verify(x => x('called')).mustHaveHappened(),
                /have been called/
            );
        });

        await it('supports custom verification assertions', () => {
            const sut = new Mock<(value: string) => void>({
                typeof: 'function'
            });

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

        await it('supports setup-level mustHappen with an exact count', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x()).returns(undefined).mustHappen(2);

            sut.instance();
            sut.instance();

            sut.verifyAll();
        });

        await it('supports setup-level mustHappen with a range', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x()).returns(undefined).mustHappen(1, 2);

            sut.instance();

            sut.verifyAll();
        });

        await it('supports setup-level mustHappen with a set of counts', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x()).returns(undefined).mustHappen([1, 2]);

            sut.instance();

            sut.verifyAll();
        });

        await it('supports setup-level mustNotHappen', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x()).returns(undefined).mustNotHappen();

            sut.verifyAll();
        });

        await it('can register an assertion with addAssertion', () => {
            const sut = new Mock<(value: string) => void>({
                typeof: 'function'
            });

            sut.setup(x => x('hello'))
                .returns(undefined)
                .addAssertion(invocations => {
                    assert.equal(invocations.length, 1);
                });

            sut.instance('hello');

            sut.verifyAll();
        });

        await it('can dispose an assertion', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            const assertion = sut.setup(x => x())
                .returns(undefined)
                .mustHappen();

            assertion[Symbol.dispose]();

            sut.verifyAll();
        });

        await it('throws the verifier error when one verifier fails', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x())
                .returns(undefined)
                .mustHappen();

            assert.throws(
                () => sut.verifyAll(),
                assert.AssertionError
            );
        });

        await it('aggregates multiple verifier failures', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });

            sut.setup(x => x())
                .returns(undefined)
                .mustHappen();

            sut.setup(x => x())
                .returns(undefined)
                .mustHappen();

            assert.throws(
                () => sut.verifyAll(),
                AggregateError
            );
        });

        await it('verification does not consume a setup', () => {
            const sut = new Mock<(value: number) => string>({
                typeof: 'function'
            });

            sut.setup(x => x(1)).returns('result');

            sut.instance(1);

            sut.verify(x => x(1)).mustHaveHappened();

            assert.equal(sut.instance(1), 'result');
        });

        await it('supports matcher-based verification', () => {
            const sut = new Mock<(value: number) => void>({
                typeof: 'function'
            });

            sut.setup((x, $) => x($.positive)).returns(undefined);

            sut.instance(1);
            sut.instance(2);

            sut.verify((x, $) => x($.positive))
                .mustHaveHappened(2);
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
            const sut = new Mock<(value: number) => string>({
                typeof: 'function'
            });

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
            sut.verifyAll();
        });

        await it('disposes an individual setup', () => {
            const sut = new Mock<() => string>({ typeof: 'function' });

            const setup = sut.setup(x => x()).returns('value');

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

        await it('returns null for an unconfigured nested constructor', () => {
            interface Shape {
                InnerClass: new () => object;
            }

            const sut = new Mock<Shape>({
                typeof: 'object',
                loose: true
            });

            assert.equal(new sut.instance.InnerClass(), null);
        });
    });

    await describe('strict mode errors', async () => {
        await it('reports an unsupported invocation', () => {
            const sut = new Mock<() => void>({ typeof: 'function' });
            const instance = sut.instance;

            assert.throws(
                () => instance(),
                error =>
                    error instanceof MockError
                    && error.message ===
                    'No setup has been configured for $mock()'
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
            const sut = new Mock<(a: string) => string>({
                typeof: 'function'
            });

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
            const sut = new Mock<(value: unknown) => void>({
                typeof: 'function'
            });

            assert.throws(
                () => sut.setup((x, $) => {
                    const matcher =
                        $.anything as unknown as Record<string, unknown>;

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

        await it('does not intercept writes to an inherited mock property', () => {
            type Shape = {
                value?: string;
            };

            const sut = new Mock<Shape>({ typeof: 'object' });
            const derived = Object.create(sut.instance);

            sut.setupSet((x, $) => x.value = $.string).returns(true);

            derived.value = 'derived';

            assert.equal(derived.value, 'derived');
            assert.equal(
                Object.prototype.hasOwnProperty.call(derived, 'value'),
                true
            );
            assert.equal(sut.invocations.length, 0);
        });

        await it('supports the this matcher for methods called on derived objects', () => {
            type Shape = {
                method(value: string): string;
            };

            const sut = new Mock<Shape>({ typeof: 'object' });
            const derived = Object.create(sut.instance);

            sut.setup((x, $) => x.method.call($.this, 'hello'))
                .returns('world');

            assert.equal(derived.method('hello'), 'world');
        });
    });
});
