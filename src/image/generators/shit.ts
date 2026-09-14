import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function shit(request: ImageRequestData<'shit'>, context: GeneratorContext): Promise<ImageResponse> {
    return await context.renderApi('shit', { text: request.text, plural: request.plural });
}
