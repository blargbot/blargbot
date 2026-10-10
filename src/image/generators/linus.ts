import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function linus(request: ImageRequestData<'linus'>, context: GeneratorContext): Promise<ImageResponse> {
    return await context.renderApi('linus', { image: request.imageUrl });
}
