import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { ImageWorker } from '@image/ImageWorker';

export class ClintGenerator extends BaseApiImageGenerator<'clint'> {
    public constructor(worker: ImageWorker) {
        super('clint', worker);
    }
}
