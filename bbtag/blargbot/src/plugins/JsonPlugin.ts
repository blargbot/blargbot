import type { BBTagVariableValue } from './VariablesPlugin.js';

export abstract class JsonPlugin {
    public abstract parse(value: string): BBTagVariableValue | undefined;
    public abstract parseQuery(path: string): Iterable<(v: BBTagVariableValue) => BBTagVariableValue>;
}
