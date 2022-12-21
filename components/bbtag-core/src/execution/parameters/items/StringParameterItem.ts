import type { InterruptableAsyncProcess } from '../../../runtime/InterruptableProcess.js';
import type { SubtagArgument } from '../../SubtagArgument.js';
import type { SubtagParameterItem as SubtagParameterItem } from '../../SubtagParameter.js';

export class StringParameterItem implements SubtagParameterItem<string> {
    readonly #ifEmpty: string;
    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, options: StringParameterItemOptions) {
        this.#ifEmpty = options.ifEmpty;
        this.name = name;
        this.maxSize = options.maxSize;
    }

    public async * getValue(_name: string, arg: SubtagArgument): InterruptableAsyncProcess<string> {
        const value = yield* arg.value();
        return value.length === 0 ? this.#ifEmpty : value;
    }
}

export interface StringParameterItemOptions {
    readonly maxSize: number;
    readonly ifEmpty: string;
}
