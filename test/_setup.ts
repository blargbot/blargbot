import 'module-alias/register';

import * as chai from 'chai';
import chaiExclude from 'chai-exclude';
import * as mockito from 'ts-mockito';
import { Matcher } from 'ts-mockito/lib/matcher/type/Matcher';
import { Mocker } from 'ts-mockito/lib/Mock';
import { AbstractMethodStub } from 'ts-mockito/lib/stub/AbstractMethodStub';
import { MethodStub } from 'ts-mockito/lib/stub/MethodStub';
import { RejectPromiseMethodStub } from 'ts-mockito/lib/stub/RejectPromiseMethodStub';
import { ResolvePromiseMethodStub } from 'ts-mockito/lib/stub/ResolvePromiseMethodStub';
import { ReturnValueMethodStub } from 'ts-mockito/lib/stub/ReturnValueMethodStub';
import { ThrowErrorMethodStub } from 'ts-mockito/lib/stub/ThrowErrorMethodStub';
import { isProxy } from 'util/types';

chai.use(chaiExclude);

Object.assign(mockito, <Partial<typeof mockito>>{
    mock(obj?: unknown) {
        const ctx: Record<PropertyKey, unknown> = {};

        if (typeof obj === 'function')
            // eslint-disable-next-line @typescript-eslint/ban-types
            Object.setPrototypeOf(ctx, <object | null>obj.prototype);

        for (const symbol of ['Symbol(Symbol.toPrimitive)', 'then', 'catch'])
            if (!(symbol in ctx))
                ctx[symbol] = undefined;

        const mocker = new Mocker(obj, ctx);
        mocker.isStrict = true;
        return mocker.getMock() as unknown;
    },
    setStrict(obj: unknown, strict) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        (<{ __tsmockitoMocker: Mocker; }>obj).__tsmockitoMocker.isStrict = strict;
    },
    satisfies<T>(test: (value: T) => boolean) {
        return new SatisfiesMatcher<T>(test);
    }
});

class MethodNotConfiguredStub extends AbstractMethodStub implements MethodStub {
    public constructor(protected readonly name: string) {
        super();
    }

    public isApplicable(): boolean {
        return true;
    }

    public execute(args: unknown[]): never {
        if (args.length === 0)
            throw new Error(`The '${this.name}' method/property hasnt been configured to accept 0 arguments`);
        throw new Error(`The '${this.name}' method hasnt been configured to accept the arguments: ${JSON.stringify(args.map(arg => isProxy(arg) ? 'PROXY' : arg))}`);
    }

    public getValue(): never {
        throw new Error(`The '${this.name}' property hasnt been mocked`);
    }
}

class SatisfiesMatcher<T> extends Matcher {
    public constructor(private readonly test: (value: T) => boolean) {
        super();
    }

    public match(value: unknown): boolean {
        return this.test(value as T);
    }

    public toString(): string {
        return `satisfies(${this.test.name})`;
    }
}

Mocker.prototype['getEmptyMethodStub'] = function (this: Mocker, key) {
    if (this.isStrict)
        return new MethodNotConfiguredStub(key);
    return new ReturnValueMethodStub(-1, [], null);
};

function setPropertyDisallowMock<T>(object: T, name: string): void {
    Object.defineProperty(object, name, {
        set: function (this: Record<string, unknown>, value: unknown) {
            if (typeof value === 'object' && value !== null && '__tsmockitoMocker' in value)
                throw new Error('Cannot directly use a mocked object. Pass it to `instance(mock)` first.');
            this[`_${name}`] = value;
        },
        get: function (this: Record<string, unknown>): unknown {
            return this[`_${name}`];
        }
    });
}

setPropertyDisallowMock(ReturnValueMethodStub.prototype, 'returns');
setPropertyDisallowMock(ThrowErrorMethodStub.prototype, 'error');
setPropertyDisallowMock(ResolvePromiseMethodStub.prototype, 'value');
setPropertyDisallowMock(RejectPromiseMethodStub.prototype, 'value');
