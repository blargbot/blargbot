import type { IVariableScopeProvider } from '@bbtag/variables';
import type { IFormattable } from '@blargbot/formatting';

import type { BBTagRuntime } from '../BBTagRuntime.js';
import type { BBTagScope } from './BBTagScope.js';

export interface TagVariableScopeProvider extends IVariableScopeProvider<BBTagRuntime, BBTagScope> {
    readonly name: IFormattable<string>;
    readonly prefix: string;
    readonly description: IFormattable<string>;
}
