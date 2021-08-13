import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { SonicSaysOptions } from 'blargbot-api';

export class SonicSaysGenerator extends BaseApiImageGenerator<'sonicsays'> {
    public constructor(logger: Logger, config: Configuration) {
        super('sonicsays', logger, config.blargbot_api.token, config.blargbot_api.base, mapOptions);
    }
}

const mapOptions = mapping.mapObject<SonicSaysOptions>({
    text: mapping.mapString
});
