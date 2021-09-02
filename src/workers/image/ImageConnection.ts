import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { WorkerConnection } from '@core/worker';
import { ImageGeneratorMap, ImageResult } from '@image/types';

export class ImageConnection extends WorkerConnection<'image'> {
    public constructor(
        id: number,
        logger: Logger
    ) {
        super(id, 'image', logger);
        this.env.IMAGE_ID = id.toString();
    }

    public async render<T extends keyof ImageGeneratorMap>(command: T, data: ImageGeneratorMap[T]): Promise<ImageResult | undefined> {
        try {
            const result = await this.request('img', { command, data });
            const mapped = mapImageResult(result);
            if (!mapped.valid)
                return undefined;

            return {
                data: Buffer.from(mapped.value.data, 'base64'),
                fileName: mapped.value.fileName
            };
        } catch (err: unknown) {
            this.logger.error(err);
        }
        return undefined;
    }
}

const mapImageResult = mapping.mapObject<ImageResult<string>>({
    data: mapping.mapString,
    fileName: mapping.mapString
});
