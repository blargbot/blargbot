import 'module-alias/register';

import * as mockito from 'ts-mockito';
import { Mocker } from 'ts-mockito/lib/Mock';
import { AbstractMethodStub } from 'ts-mockito/lib/stub/AbstractMethodStub';
import { MethodStub } from 'ts-mockito/lib/stub/MethodStub';
import { ReturnValueMethodStub } from 'ts-mockito/lib/stub/ReturnValueMethodStub';
import { isProxy } from 'util/types';

(mockito as Mutable<typeof mockito>).mock = (obj?: unknown) => {
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
};
(mockito as Mutable<typeof mockito>).setStrict = (obj: unknown, strict) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<{ __tsmockitoMocker: Mocker; }>obj).__tsmockitoMocker.isStrict = strict;
};

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

Mocker.prototype['getEmptyMethodStub'] = function (this: Mocker, key) {
    if (this.isStrict)
        return new MethodNotConfiguredStub(key);
    return new ReturnValueMethodStub(-1, [], null);
};
