import { BBTagContext } from '../../BBTagContext';
import { SubtagCall } from '../../types';

export interface RuntimeLimitRule {
    check(context: BBTagContext, subtag: SubtagCall): Promise<boolean> | boolean;
    errorText(subtagName: string, scopeName: string): string;
    displayText(subtagName: string, scopeName: string): string;
}
