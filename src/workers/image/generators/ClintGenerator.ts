import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { ClintOptions } from 'blargbot-api';

export class ClintGenerator extends BaseApiImageGenerator<'clint'> {
    public constructor(logger: Logger, config: Configuration) {
        super('clint', logger, config.blargbot_api.token, config.blargbot_api.base, mapOptions);
    }
}

const mapOptions = mapping.mapObject<ClintOptions>({
    image: mapping.mapString
});
