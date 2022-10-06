import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';

export class SonicSaysGenerator extends BaseApiImageGenerator<`sonicsays`> {
    public constructor(worker: ImageWorker) {
        super(`sonicsays`, worker);
    }
}
