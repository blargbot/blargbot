import { RuntimeContext } from '../../RuntimeContext';
import { BBSubtagCall } from '../../types';

export interface RuntimeLimitRule {
    check(context: RuntimeContext, subtag: BBSubtagCall): Promise<boolean> | boolean;
    errorText(subtagName: string, scopeName: string): string;
    displayText(subtagName: string, scopeName: string): string;
}
