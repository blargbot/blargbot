import { BBTagPlugin, BBTagRuntimeError } from '@bbtag/engine';

import type { BBTagVariableValue } from './VariablesPlugin.js';

export abstract class ArrayPlugin {
    public abstract parseArray(value: string): BBTagArrayRef;
    public abstract tryParseArray(value: string): BBTagArrayRef | undefined;
    public abstract serialize(value: BBTagArrayRef['v'], name?: string): string;
}

@BBTagPlugin.provides(ArrayPlugin)
export class DefaultArrayPlugin extends ArrayPlugin {
    public override parseArray(value: string): BBTagArrayRef {
        const result = this.tryParseArray(value);
        if (result === undefined)
            throw new BBTagRuntimeError('Invalid array');
        return result;
    }

    public override tryParseArray(value: string): BBTagArrayRef | undefined {
        // TODO: Proper implementation
        value;
        return undefined;
    }

    public override serialize(value: BBTagArrayRef['v'], name?: string): string {
        if (name === undefined)
            return JSON.stringify(value);
        return JSON.stringify({
            n: name,
            v: value
        });
    }
}

export interface BBTagArrayRef {
    readonly n?: string;
    readonly v: BBTagVariableValue[];
}
