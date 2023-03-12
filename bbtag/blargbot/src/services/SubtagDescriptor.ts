import type { BBTagEngine } from '../BBTagEngine.js';
import type { Subtag } from '../Subtag.js';

export interface SubtagDescriptor<T extends Subtag = Subtag> {
    createInstance(engine: BBTagEngine): T;
    readonly name: string;
    readonly aliases: string[];
}
