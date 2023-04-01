import { DistributedCooldownService } from "@bbtag/blargbot";

export class CooldownService extends DistributedCooldownService {
    public constructor() {
        super({
            get(key) {
                key;
                throw null;
            },
            set(key, value) {
                key;
                value;
                throw null;
            },
        })
    }
}