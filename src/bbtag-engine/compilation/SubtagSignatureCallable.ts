import type { SubtagSignatureParameter } from '../types.js';
import type { SubtagLogic } from './logic/index.js';

export interface SubtagSignatureCallable<Locals extends object> {
    readonly id: string;
    readonly subtagName: string | undefined;
    readonly parameters: readonly SubtagSignatureParameter[];
    readonly implementation: SubtagLogic<Locals>;
}
