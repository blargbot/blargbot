import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function clint(request: ImageRequestData<'clint'>, context: GeneratorContext): Promise<ImageResponse> {
    return await context.renderApi('clint', { image: request.imageUrl });
}
