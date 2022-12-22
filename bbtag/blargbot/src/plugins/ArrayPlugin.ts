import { BBTagPlugin, BBTagRuntimeError } from '@bbtag/engine';

export abstract class ArrayPlugin {
    public abstract parseArray(value: string): BBTagArray;
    public abstract tryParseArray(value: string): BBTagArray | undefined;
}

@BBTagPlugin.provides(ArrayPlugin)
export class DefaultArrayPlugin extends ArrayPlugin {
    public override parseArray(value: string): BBTagArray {
        const result = this.tryParseArray(value);
        if (result === undefined)
            throw new BBTagRuntimeError('Invalid array');
        return result;
    }

    public override tryParseArray(value: string): BBTagArray | undefined {
        // TODO: Proper implementation
        value;
        return undefined;
    }
}

export interface BBTagArray {
    readonly n?: string;
    readonly v: readonly string[];
}
