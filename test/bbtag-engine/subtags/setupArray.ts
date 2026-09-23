import type { VariableStore } from '@blargbot/bbtag-engine';
import type { Mock } from '@blargbot/test-util';

import { setupVariables } from './setupVariables.js';

export function setupArray(variables: Mock<VariableStore>, itemName: string, arrName: string, arrData: JToken | undefined, expectedItems: JValue[], getPerLoop = 1): void {
    setupVariables(variables, itemName);
    variables.setup(m => m.get(arrName)).returns({ key: arrName, value: arrData }).mustHappen(1);
    for (const value of new Set(expectedItems))
        variables.setup(m => m.set(itemName, value)).mustHappen(expectedItems.filter(x => x === value).length);
    variables.setup(m => m.get(itemName)).mustHappen(expectedItems.length * getPerLoop);
    variables.setup((m, $) => m.rollback($.looksLike([itemName]))).returns().mustHappen(1);
}
