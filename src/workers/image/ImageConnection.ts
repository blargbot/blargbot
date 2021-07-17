import { WorkerConnection, Logger, ImageGeneratorMap, ImageRequest } from '@image/core';

export class ImageConnection extends WorkerConnection {
    public constructor(
        id: number,
        logger: Logger
    ) {
        super(id, 'image', logger);
    }

    public async render<T extends keyof ImageGeneratorMap>(command: T, data: ImageGeneratorMap[T]): Promise<Buffer | undefined> {
        try {
            const result = await this.request<ImageRequest<T>, string | undefined>('img', { command, data });
            if (typeof result === 'string')
                return Buffer.from(result, 'base64');
        } catch (err: unknown) {
            this.logger.error(err);
        }
        return undefined;
    }
}
