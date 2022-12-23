import { BBTagPlugin } from '@bbtag/engine';

import type { BBTagVariableValue } from './VariablesPlugin.js';

export abstract class ArrayPlugin {
    public abstract parseArray(value: string): BBTagArrayRef | undefined;
    public abstract serialize(value: BBTagArrayRef['v'], name?: string): string;
    public abstract flatten(values: readonly BBTagVariableValue[]): BBTagVariableValue[];
}

@BBTagPlugin.provides(ArrayPlugin)
export class DefaultArrayPlugin extends ArrayPlugin {
    public override parseArray(value: string): BBTagArrayRef | undefined {
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

    public override flatten(values: readonly BBTagVariableValue[]): BBTagVariableValue[] {
        const result: BBTagVariableValue[] = [];
        for (const item of values) {
            switch (typeof item) {
                case 'string': {
                    const parsed = this.parseArray(item);
                    if (parsed === undefined)
                        result.push(item);
                    else
                        result.push(...parsed.v);
                    break;
                }
                case 'object': {
                    if (Array.isArray(item))
                        result.push(...item);
                    else
                        result.push(item);
                    break;
                }
                default:
                    result.push(item);
                    break;
            }
        }
        return result;
    }
}

export interface BBTagArrayRef {
    readonly n?: string;
    readonly v: BBTagVariableValue[];
}
