import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function thesearch(request: ImageRequestData<'thesearch'>, context: GeneratorContext): Promise<ImageResponse> {
    return await context.renderApi('thesearch', { text: request.text });
}
