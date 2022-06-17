import { BBTagContext } from '../BBTagContext';

export interface RuntimeLimitRule {
    check(context: BBTagContext, subtagName: string): Awaitable<void>;
    displayText(subtagName: string, scopeName: string): string;
    state(): JToken;
    load(state: JToken): void;
}
