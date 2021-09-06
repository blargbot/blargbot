import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { ImageWorker } from '@image/ImageWorker';

export class TheSearchGenerator extends BaseApiImageGenerator<'thesearch'> {
    public constructor(worker: ImageWorker) {
        super('thesearch', worker);
    }
}
