import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';

export class PcCheckGenerator extends BaseApiImageGenerator<`pccheck`> {
    public constructor(worker: ImageWorker) {
        super(`pccheck`, worker);
    }
}
