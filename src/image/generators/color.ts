import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function color(request: ImageRequestData<'color'>, context: GeneratorContext): Promise<ImageResponse> {
    return await context.renderApi('color', { color: request.color });
}
