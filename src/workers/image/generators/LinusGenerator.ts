import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { LinusOptions } from 'blargbot-api';

export class LinusGenerator extends BaseApiImageGenerator<'linus'> {
    public constructor(logger: Logger, config: Configuration) {
        super('linus', logger, config.blargbot_api.token, config.blargbot_api.base, mapOptions);
    }
}

const mapOptions = mapping.mapObject<LinusOptions>({
    image: mapping.mapString
});
