import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { ImageWorker } from '@image/ImageWorker';

export class ShitGenerator extends BaseApiImageGenerator<'shit'> {
    public constructor(worker: ImageWorker) {
        super('shit', worker);
    }
}
