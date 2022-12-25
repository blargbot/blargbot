import type { SubtagResultAdapter } from '@bbtag/subtag';

import { StringPlugin } from '../plugins/StringPlugin.js';
import type { BBTagVariableValue } from '../plugins/VariablesPlugin.js';

export const jsonResultAdapter = {
    async * execute(value, script) {
        const string = script.process.plugins.get(StringPlugin);
        return string.toString(await value);
    }
} satisfies SubtagResultAdapter<Awaitable<BBTagVariableValue | undefined>>;
