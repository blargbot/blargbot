import type { TagVariableScope, VariablesStore as BBTagVariablesStore } from '@bbtag/blargbot';

export class VariablesStore implements BBTagVariablesStore {

    public get(scope: TagVariableScope, name: string): Promise<JToken | undefined> {
        scope;
        name;
        throw new Error('Method not implemented.');
    }

    public set(entries: Iterable<{ scope: TagVariableScope; name: string; value: JToken | undefined; }>): Promise<void> {
        entries;
        throw new Error('Method not implemented.');
    }
}
// {
//     get: (scope, name) => this.database.tagVariables.get(name, scope),
//     set: (entries) => this.database.tagVariables.upsert(entries)
// }
