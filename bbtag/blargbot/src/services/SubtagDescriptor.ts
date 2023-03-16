import type { BBTagRunner } from '../BBTagRunner.js';
import type { ISubtag } from '../ISubtag.js';

export interface SubtagDescriptor<T extends ISubtag = ISubtag> {
    createInstance(engine: BBTagRunner): T;
    readonly id: string;
    readonly names: string[];
}
