import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { DeleteOptions } from 'blargbot-api';

export class DeleteGenerator extends BaseApiImageGenerator<'delete'> {
    public constructor(logger: Logger, config: Configuration) {
        super('delete', logger, config.blargbot_api.token, config.blargbot_api.base, mapOptions);
    }
}

const mapOptions = mapping.mapObject<DeleteOptions>({
    text: mapping.mapString
});
