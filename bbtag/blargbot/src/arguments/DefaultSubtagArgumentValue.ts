import type { BBTagStatement } from '../BBTagStatement.js';
import type { SubtagSignatureValueParameter } from '../types.js';
import type { SubtagArgument } from './SubtagArgument.js';

export class DefaultSubtagArgumentValue implements SubtagArgument {
    public readonly isCached = true;
    public get value(): string { return this.parameter.defaultValue; }
    public get code(): BBTagStatement {
        return {
            isEmpty: this.parameter.defaultValue.length === 0,
            ast: {
                start: { index: 0, line: 0, column: 0 },
                end: { index: 0, line: 0, column: 0 },
                source: this.parameter.defaultValue,
                values: []
            },
            resolve: () => this.parameter.defaultValue
        };
    }
    public get raw(): string { return this.parameter.defaultValue; }

    public constructor(public readonly parameter: SubtagSignatureValueParameter) {
    }

    public wait(): string {
        return this.parameter.defaultValue;
    }

    public execute(): string {
        return this.parameter.defaultValue;
    }
}
