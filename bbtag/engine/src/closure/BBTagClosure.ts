import { BBTagClosureData } from './BBTagClosureData.js';

export class BBTagClosure {
    public data: BBTagClosureData;

    public fallback?: string;

    public constructor(parent?: BBTagClosure) {
        this.data = new BBTagClosureData(parent?.data);
    }
}
