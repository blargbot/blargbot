import { processResult } from '@bbtag/engine';
import type { SubtagResult } from '@bbtag/subtag';

import { StringPlugin } from '../index.js';
import type { BBTagVariableValue } from '../plugins/VariablesPlugin.js';

export default {
    execute(value, script) {
        const string = script.process.plugins.get(StringPlugin);
        return processResult(string.toString(value));
    }
} satisfies SubtagResult<BBTagVariableValue>;
