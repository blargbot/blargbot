import type { BBTagScope, VariablesStore as BBTagVariablesStore } from '@bbtag/blargbot';
import type { BBTagVariableHttpClient } from '@blargbot/bbtag-variables-client';

export class VariablesStore implements BBTagVariablesStore {
    readonly #variables: BBTagVariableHttpClient;

    public constructor(variables: BBTagVariableHttpClient) {
        this.#variables = variables;
    }

    public async get(scope: BBTagScope, name: string): Promise<JToken> {
        if (scope.ownerId === 0n && scope.scope.startsWith('temp:'))
            return null;
        const variable = await this.#variables.getVariable({ ...scope, name });
        return variable.value;
    }

    public async set(entries: Iterable<{ scope: BBTagScope; name: string; value: JToken; }>): Promise<void> {
        const grouped = new Map<bigint, Map<string, Record<string, JToken>>>();
        for (const { scope: { ownerId, scope }, name, value } of entries) {
            let scopes = grouped.get(ownerId);
            if (scopes === undefined)
                grouped.set(ownerId, scopes = new Map<string, Record<string, JToken>>());
            let values = scopes.get(scope);
            if (values === undefined)
                scopes.set(scope, values = {});
            values[name] = value;
        }
        const promises = [];
        for (const [ownerId, scopes] of grouped)
            for (const [scope, values] of scopes)
                promises.push(this.#variables.setVariables({ ownerId, scope, values }));

        await Promise.all(promises);
    }
}
