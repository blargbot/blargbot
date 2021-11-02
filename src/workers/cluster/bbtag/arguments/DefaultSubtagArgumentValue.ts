import { Statement, SubtagArgumentValue, SubtagHandlerValueParameter } from '@cluster/types';

export class DefaultSubtagArgumentValue implements SubtagArgumentValue {
    public readonly isCached = true;
    public get value(): string { return this.parameter.defaultValue; }
    public get code(): Statement { return [this.parameter.defaultValue]; }
    public get raw(): string { return this.parameter.defaultValue; }

    public constructor(public readonly parameter: SubtagHandlerValueParameter) {
    }

    public wait(): Promise<string> {
        return Promise.resolve(this.parameter.defaultValue);
    }

    public execute(): Promise<string> {
        return Promise.resolve(this.parameter.defaultValue);
    }
}
