import { BBTagPlugin } from '@bbtag/engine';

import type { BBTagVariableValue } from './VariablesPlugin.js';

export abstract class StringPlugin {
    public abstract toString(value: BBTagVariableValue | undefined): string;
}

@BBTagPlugin.provides(StringPlugin)
export class DefaultStringPlugin extends StringPlugin {
    public override toString(value: BBTagVariableValue | undefined): string {
        switch (typeof value) {
            case 'string': return value;
            case 'object': return value === null ? '' : JSON.stringify(value);
            case 'undefined': return '';
            case 'boolean':
            case 'number':
                return value.toString();
        }
    }
}
