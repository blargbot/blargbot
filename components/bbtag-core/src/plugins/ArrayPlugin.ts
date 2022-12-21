import { BBTagRuntimeError } from '../errors/BBTagRuntimeError.js';
import type { BBTagProcess } from '../runtime/BBTagProcess.js';
import { BBTagPlugin } from './BBTagPlugin.js';

export abstract class ArrayPlugin extends BBTagPlugin {
    public abstract parseArray(value: string): BBTagArray;
}

export class DefaultArrayPlugin extends ArrayPlugin {
    public static type = ArrayPlugin;
    public static createPlugin(process: BBTagProcess): DefaultArrayPlugin {
        return new DefaultArrayPlugin(process);
    }

    public override parseArray(value: string): BBTagArray {
        // TODO: Proper implementation
        value;
        throw new BBTagRuntimeError('Invalid date');
    }
}

export interface BBTagArray {
    readonly n?: string;
    readonly v: readonly string[];
}
