import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';

export class TheSearchGenerator extends BaseApiImageGenerator<`thesearch`> {
    public constructor(worker: ImageWorker) {
        super(`thesearch`, worker);
    }
}
