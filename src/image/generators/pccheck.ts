import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function pccheck(request: ImageRequestData<'pccheck'>, context: GeneratorContext): Promise<ImageResponse> {
    return await context.renderApi('pccheck', { text: request.text });
}
