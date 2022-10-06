import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';

export class LinusGeneratorGenerator extends BaseApiImageGenerator<`linus`> {
    public constructor(worker: ImageWorker) {
        super(`linus`, worker);
    }
}
