import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function $delete(request: ImageRequestData<'delete'>, context: GeneratorContext): Promise<ImageResponse> {
    return await context.renderApi('delete', { text: request.text });
}
