import type { VariableStore } from '@blargbot/bbtag-engine';
import type { Mock } from '@blargbot/test-util';

export function setupVariables(variables: Mock<VariableStore>, name: string, initial?: JToken): void {
    let current = initial;
    variables.setup((m, $) => m.set(name, $.anything)).invokes(i => void (current = i.arguments[1] as JToken | undefined));
    variables.setup(m => m.get(name)).invokes(() => ({ key: name, value: current }));
}
