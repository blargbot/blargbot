import type { InterruptableAsyncProcess, InterruptableProcess } from '../../../runtime/InterruptableProcess.js';
import { processResult } from '../../../runtime/processResult.js';
import type { SubtagArgument } from '../../SubtagArgument.js';
import type { SubtagParameterItem as SubtagParameterItem } from '../../SubtagParameter.js';

export class DeferredParameterItem<T> implements SubtagParameterItem<() => T> {
    readonly #read: (value: InterruptableAsyncProcess<string>) => T;

    public readonly name: string;
    public readonly maxSize: number;

    public constructor(name: string, options: DeferredParameterItemOptions<T>) {
        this.name = name;
        this.maxSize = options.maxSize;
        this.#read = options.read;
    }

    public getValue(name: string, arg: SubtagArgument): InterruptableProcess<() => T> {
        if (arg.isEvaluated)
            throw new Error(`Deferred argument has already been executed! ${JSON.stringify({ subtag: name, parameter: this.name })}`);
        return processResult(() => this.#read(arg.value()));
    }
}

export interface DeferredParameterItemOptions<T> {
    readonly read: (value: InterruptableAsyncProcess<string>) => T;
    readonly maxSize: number;
}
