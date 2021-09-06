import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { ImageWorker } from '@image/ImageWorker';

export class LinusGeneratorGenerator extends BaseApiImageGenerator<'linus'> {
    public constructor(worker: ImageWorker) {
        super('linus', worker);
    }
}
