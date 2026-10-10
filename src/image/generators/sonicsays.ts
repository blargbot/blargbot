import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function sonicsays(request: ImageRequestData<'sonicsays'>, context: GeneratorContext): Promise<ImageResponse> {
    return await context.renderApi('sonicsays', { text: request.text });
}
