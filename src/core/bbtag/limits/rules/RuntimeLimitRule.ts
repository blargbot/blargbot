import { RuntimeContext } from '../../RuntimeContext';
import { SubtagCall } from '../../types';

export interface RuntimeLimitRule {
    check(context: RuntimeContext, subtag: SubtagCall): Promise<boolean> | boolean;
    errorText(subtagName: string, scopeName: string): string;
    displayText(subtagName: string, scopeName: string): string;
}
