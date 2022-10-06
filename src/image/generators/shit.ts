import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';

export class ShitGenerator extends BaseApiImageGenerator<`shit`> {
    public constructor(worker: ImageWorker) {
        super(`shit`, worker);
    }
}
