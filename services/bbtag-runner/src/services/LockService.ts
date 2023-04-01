import { DefaultLockService } from "@bbtag/blargbot";

export class LockService extends DefaultLockService {
    public constructor() {
        super({
            createLock(id) {
                id;
                throw null;
            },
        })
    }
}