import { Statement } from '../language';
import { SubtagSignatureValueParameter } from '../types';
import { SubtagArgument } from './SubtagArgument';

export class DefaultSubtagArgumentValue implements SubtagArgument {
    public readonly isCached = true;
    public get value(): string { return this.parameter.defaultValue; }
    public get code(): Statement {
        return {
            values: [this.parameter.defaultValue],
            start: { index: 0, line: 0, column: 0 },
            end: { index: 0, line: 0, column: 0 },
            source: this.parameter.defaultValue
        };
    }
    public get raw(): string { return this.parameter.defaultValue; }

    public constructor(public readonly parameter: SubtagSignatureValueParameter) {
    }

    public wait(): Promise<string> {
        return Promise.resolve(this.parameter.defaultValue);
    }

    public execute(): Promise<string> {
        return Promise.resolve(this.parameter.defaultValue);
    }
}
