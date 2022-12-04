import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator.js';
import type { ImageWorker } from '@blargbot/image/ImageWorker.js';

export class SonicSaysGenerator extends BaseApiImageGenerator<'sonicsays'> {
    public constructor(worker: ImageWorker) {
        super('sonicsays', worker);
    }
}
