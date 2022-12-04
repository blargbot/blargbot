import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator.js';
import type { ImageWorker } from '@blargbot/image/ImageWorker.js';

export class PcCheckGenerator extends BaseApiImageGenerator<'pccheck'> {
    public constructor(worker: ImageWorker) {
        super('pccheck', worker);
    }
}
