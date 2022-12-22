import { BBTagPlugin } from '@bbtag/engine';

import type { BBTagVariableValue } from './VariablesPlugin.js';

export abstract class StringPlugin {
    public abstract toString(value: BBTagVariableValue): string;
}

@BBTagPlugin.provides(StringPlugin)
export class DefaultStringPlugin extends StringPlugin {
    public override toString(value: BBTagVariableValue): string {
        switch (typeof value) {
            case 'string': return value;
            case 'object': return value === null ? '' : JSON.stringify(value);
            case 'boolean':
            case 'number':
                return value.toString();
        }
    }
}
