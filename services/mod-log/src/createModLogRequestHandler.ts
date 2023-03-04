import express, { asyncHandler } from '@blargbot/express';
import { mapping } from '@blargbot/mapping';
import { json } from '@blargbot/serialization';

import type { ModLogEntry } from './ModLogEntry.js';
import { modLogEntrySerializer } from './ModLogEntry.js';
import type { ModLogService } from './ModLogService.js';

export function createModLogRequestHandler(service: ModLogService): express.RequestHandler {
    const router = express.Router();

    router.route('/:guildId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const modLogs = await service.getAllModLogs(BigInt(req.params.guildId));
            res.status(200)
                .contentType('application/json')
                .end(modLogArray.write(modLogs));
        }))
        .post(asyncHandler(async (req, res) => {
            const mapped = mapCreate(req.body);
            if (!mapped.valid) {
                res.status(400).send({ error: 'Request body is invalid' });
                return;
            }

            const caseId = await service.createModLog(BigInt(req.params.guildId), mapped.value);
            res.status(200).send({ caseId });
        }));

    router.route('/:guildId(\\d+)/:caseId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const modLog = await service.getModLog(BigInt(req.params.guildId), Number(req.params.caseId));
            if (modLog === undefined) {
                res.status(404).end();
                return;
            }

            res.status(200)
                .contentType('application/json')
                .end(modLogEntrySerializer.write(modLog));
        }))
        .patch(asyncHandler(async (req, res) => {
            const mapped = mapUpdate(req.body);
            if (!mapped.valid) {
                res.status(400).send({ error: 'Request body is invalid' });
                return;
            }

            await service.updateModLog(BigInt(req.params.guildId), Number(req.params.caseId), mapped.value);
            res.status(204).end();
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.deleteModLog(BigInt(req.params.guildId), Number(req.params.caseId));
            res.status(204).end();
        }));

    return router;
}

const modLogArray = json.array(modLogEntrySerializer);

const mapUpdate = mapping.object<Partial<Omit<ModLogEntry, 'caseId'>>>({
    channelId: mapping.bigInt.nullish,
    messageId: mapping.bigInt.nullish,
    moderatorId: mapping.bigInt.nullish,
    reason: mapping.string.nullish,
    type: mapping.string.nullish,
    userId: mapping.bigInt.optional
});

const mapCreate = mapping.object<Omit<ModLogEntry, 'caseId'>>({
    channelId: mapping.bigInt.nullable,
    messageId: mapping.bigInt.nullable,
    moderatorId: mapping.bigInt.nullable,
    reason: mapping.string.nullable,
    type: mapping.string.nullable,
    userId: mapping.bigInt
});
