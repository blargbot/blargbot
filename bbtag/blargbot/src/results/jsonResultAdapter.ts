import { processResult } from '@bbtag/engine';
import type { SubtagResultAdapter } from '@bbtag/subtag';

import { StringPlugin } from '../plugins/StringPlugin.js';
import type { BBTagVariableValue } from '../plugins/VariablesPlugin.js';

export const jsonResultAdapter = {
    execute(value, script) {
        const string = script.process.plugins.get(StringPlugin);
        return processResult(string.toString(value));
    }
} satisfies SubtagResultAdapter<BBTagVariableValue>;
