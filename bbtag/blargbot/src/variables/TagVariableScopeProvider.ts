import type { VariableScopeProvider } from '@bbtag/variables';
import type { IFormattable } from '@blargbot/formatting';

import type { BBTagRuntime } from '../BBTagRuntime.js';
import type { TagVariableScope } from './TagVariableScope.js';

export interface TagVariableScopeProvider extends VariableScopeProvider<BBTagRuntime, TagVariableScope> {
    readonly name: IFormattable<string>;
    readonly prefix: string;
    readonly description: IFormattable<string>;
}
