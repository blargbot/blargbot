import { Api } from '@blargbot/api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { StoredTag } from '@blargbot/domain/models';
import { mapping } from '@blargbot/mapping';

export class TagsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/tags');

        this.addRoute('/', {
            post: req => this.createTag(req.body, this.getUserId(req, false))
        });

        this.addRoute('/:tagName', {
            get: req => this.getTag(req.params.tagName),
            patch: req => this.editTag(req.params.tagName, req.body, this.getUserId(req, false)),
            put: req => this.setTag(req.params.tagName, req.body, this.getUserId(req, false)),
            delete: req => this.deleteTag(req.params.tagName, this.getUserId(req, false))
        });
    }

    public async getTag(tagName: string): Promise<ApiResponse> {
        const tag = await this.api.database.tags.get(tagName);
        if (tag === undefined)
            return this.notFound();

        return this.ok({
            name: tag.name,
            content: tag.content,
            author: tag.author
        });
    }

    public async setTag(tagName: string, body: unknown, author: string): Promise<ApiResponse> {
        const mapped = mapUpdateTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await this.api.database.tags.get(tagName);
        if (current === undefined)
            return await this.#createTag(tagName, mapped.value.content ?? '', author);
        return await this.#editTag(tagName, mapped.value, author, current);
    }

    public async createTag(body: unknown, author: string): Promise<ApiResponse> {
        const mapped = mapCreateTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const { name: tagName, content } = mapped.value;

        const exists = await this.api.database.tags.get(tagName);
        if (exists !== undefined)
            return this.forbidden(`A tag with the name ${tagName} already exists`);

        return await this.#createTag(tagName, content, author);
    }

    async #createTag(tagName: string, content: string, author: string): Promise<ApiResponse> {
        const tag: StoredTag = {
            content: content,
            author: author,
            lastmodified: new Date(),
            name: tagName,
            uses: 0
        };
        const success = await this.api.database.tags.set(tag);

        if (!success)
            return this.internalServerError('Failed to save tag');

        return this.created(tag);
    }

    public async editTag(tagName: string, body: unknown, author: string): Promise<ApiResponse> {
        const mapped = mapUpdateTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await this.api.database.tags.get(tagName);
        if (current === undefined)
            return this.notFound();

        return await this.#editTag(tagName, mapped.value, author, current);
    }

    async #editTag(tagName: string, update: Partial<StoredTag>, author: string, current: StoredTag): Promise<ApiResponse> {
        if (current.author !== author)
            return this.forbidden(`You are not the author of the tag ${tagName}`);

        const tag: Partial<StoredTag> = { ...update, author: author };
        if (tag.name !== undefined && tag.name !== tagName && await this.api.database.tags.get(tag.name) !== undefined)
            return this.badRequest(`The tag ${tag.name} already exists`);

        let success = false;
        if (update.name !== undefined && update.name !== tagName) {
            await this.api.database.tags.delete(tagName);
            tagName = update.name;
            await this.api.database.tags.add({ ...current, name: tagName });
            success = true;
        }

        if (!await this.api.database.tags.update(tagName, tag) || success)
            return this.internalServerError('Failed to update');

        return this.ok(await this.api.database.tags.get(tag.name ?? tagName));
    }

    public async deleteTag(name: string, author: string | undefined): Promise<ApiResponse> {
        if (author === undefined)
            return this.unauthorized();

        const tag = await this.api.database.tags.get(name);
        if (tag === undefined)
            return this.notFound();

        if (tag.author !== author)
            return this.forbidden('You are not the author of this tag');

        if (!await this.api.database.tags.delete(name))
            return this.internalServerError('Failed to delete');

        return this.noContent();
    }
}

const mapCreateTag = mapping.object({
    content: mapping.string,
    name: mapping.string
});

const mapUpdateTag = mapping.object({
    content: mapping.string.optional,
    name: mapping.string.optional
});
