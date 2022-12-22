import type { BBTagProcess } from '@bbtag/engine';
import { BBTagPlugin, BBTagRuntimeError } from '@bbtag/engine';

export abstract class ArrayPlugin extends BBTagPlugin {
    public abstract parseArray(value: string): BBTagArray;
    public abstract tryParseArray(value: string): BBTagArray | undefined;
}

@BBTagPlugin.factory(ArrayPlugin)
export class DefaultArrayPlugin extends ArrayPlugin {
    public static type = ArrayPlugin;
    public static createPlugin(process: BBTagProcess): DefaultArrayPlugin {
        return new DefaultArrayPlugin(process);
    }

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
