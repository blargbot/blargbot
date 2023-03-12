import type { VariableScopeProvider } from '@bbtag/variables';
import type { IFormattable } from '@blargbot/formatting';

import type { BBTagContext } from '../index.js';
import type { TagVariableScope } from './TagVariableScope.js';

export interface TagVariableScopeProvider extends VariableScopeProvider<BBTagContext, TagVariableScope> {
    readonly name: IFormattable<string>;
    readonly prefix: string;
    readonly description: IFormattable<string>;
}
