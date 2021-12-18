import { IsUserBoostingSubtag } from '@cluster/subtags/user/isuserboosting';

import { runGetUserPropTests } from './_getUserPropTest';

runGetUserPropTests(new IsUserBoostingSubtag(), [
    {
        expected: 'true',
        setup(user) {
            user.premium_since = '2021-01-01T00:00:00+0000';
        }
    },
    {
        expected: 'false',
        setup(user) {
            user.premium_since = null;
        }
    },
    {
        expected: 'false',
        setup(user) {
            user.premium_since = undefined;
        }
    }
]);
