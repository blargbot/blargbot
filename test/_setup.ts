import 'module-alias/register';

import * as mockito from 'ts-mockito';
import { Mocker } from 'ts-mockito/lib/Mock';
import { AbstractMethodStub } from 'ts-mockito/lib/stub/AbstractMethodStub';
import { MethodStub } from 'ts-mockito/lib/stub/MethodStub';

// Shim to allow you to create a promise that returns a mock https://github.com/NagRock/ts-mockito/issues/191
const mockitoOldInstance = mockito.instance;
(mockito as Mutable<typeof mockito>).instance = <T>(mock: T) => {
    if (typeof mock !== 'object')
        return mockitoOldInstance(mock);

    // eslint-disable-next-line @typescript-eslint/ban-types
    return new Proxy<T & object>(mockitoOldInstance(<T & object>mock), {
        get(target, prop, receiver) {
            if (['Symbol(Symbol.toPrimitive)', 'then', 'catch'].includes(prop.toString())) {
                return undefined;
            }

            return Reflect.get(target, prop, receiver) as unknown;
        }
    });
};

class MethodNotConfiguredStub extends AbstractMethodStub implements MethodStub {
    public constructor(protected readonly name: string) {
        super();
    }

    public isApplicable(): boolean {
        return true;
    }

    public execute(args: unknown[]): never {
        if (args.length > 0)
            throw new Error(`The '${this.name}' method/property hasnt been configured to accept 0 arguments`);
        throw new Error(`The '${this.name}' method hasnt been configured to accept the arguments: ${JSON.stringify(args)}`);
    }

    public getValue(): never {
        throw new Error(`The '${this.name}' property hasnt been mocked`);
    }

}

Mocker.prototype['getEmptyMethodStub'] = key => new MethodNotConfiguredStub(key);
