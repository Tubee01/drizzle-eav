import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
    CustomEntityFieldTypeEnum,
    customEntity,
    customEntityField,
    customEntityFieldValue,
    customEntityFieldValueDatetime,
    customEntityFieldValueJson,
    customEntityFieldValueNumber,
    customEntityFieldValueString,
    customEntityRelation,
} from './schema';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { and, eq, inArray, sql } from 'drizzle-orm';

export interface NewCustomEntityField<
    FieldType extends Exclude<CustomEntityFieldTypeEnum, CustomEntityFieldTypeEnum.ENTITY> = Exclude<CustomEntityFieldTypeEnum, CustomEntityFieldTypeEnum.ENTITY>,
> extends Omit<typeof customEntity.$inferInsert, 'id'> {
    name: string;
    type: FieldType;
    value: FieldType extends CustomEntityFieldTypeEnum.STRING
    ? string
    : FieldType extends CustomEntityFieldTypeEnum.NUMBER
    ? number
    : FieldType extends CustomEntityFieldTypeEnum.DATETIME
    ? Date
    : FieldType extends CustomEntityFieldTypeEnum.JSON
    ? object
    : never;
}

export interface NewCustomEntity extends Omit<typeof customEntity.$inferInsert, 'id'> {
    parentId: number | null;
    fields?: NewCustomEntityField[];
}

export class CustomEntityRepository {
    constructor(private db: PostgresJsDatabase | PgTransaction<any>) { }

    async create(data: NewCustomEntity) {
        const [entity] = await this.db
            .insert(customEntity)
            .values({
                ...data,
            })
            .returning({
                id: customEntity.id,
            });

        if (data.parentId) {
            this.db
                .insert(customEntityRelation)
                .values({
                    customEntityId: entity.id,
                    customEntityIdRelated: data.parentId,
                })
                .onConflictDoNothing({ target: [customEntityRelation.customEntityId, customEntityRelation.customEntityIdRelated] })
                .execute();
        }

        if (data.fields) {
            await this.setFields(entity.id, data.fields);
        }

        return this.get(entity.id);
    }

    async setField(customEntityId: number, field: NewCustomEntityField) {
        let [entityField] = await this.db
            .insert(customEntityField)
            .values({
                ...field,
            })
            .returning({
                id: customEntityField.id,
            })
            .onConflictDoNothing({ target: [customEntityField.name, customEntityField.type] });

        if (!entityField) {
            [entityField] = await this.db
                .select({ id: customEntityField.id })
                .from(customEntityField)
                .where(and(eq(customEntityField.name, field.name), eq(customEntityField.type, field.type)));
        }

        let [entityFieldValueId] = await this.db
            .insert(customEntityFieldValue)
            .values({
                customEntityFieldId: entityField.id,
                customEntityId,
            })
            .returning({
                id: customEntityFieldValue.id,
            })
            .onConflictDoNothing({ target: [customEntityFieldValue.customEntityFieldId, customEntityFieldValue.customEntityId] });

        if (!entityFieldValueId) {
            [entityFieldValueId] = await this.db
                .select({ id: customEntityFieldValue.id })
                .from(customEntityFieldValue)
                .where(and(eq(customEntityFieldValue.customEntityFieldId, entityField.id), eq(customEntityFieldValue.customEntityId, customEntityId)));
        }

        const fieldValueTable =
            field.type === CustomEntityFieldTypeEnum.STRING
                ? customEntityFieldValueString
                : field.type === CustomEntityFieldTypeEnum.NUMBER
                    ? customEntityFieldValueNumber
                    : field.type === CustomEntityFieldTypeEnum.DATETIME
                        ? customEntityFieldValueDatetime
                        : customEntityFieldValueJson;

        this.db
            .insert(fieldValueTable)
            .values({
                customEntityFieldValueId: entityFieldValueId.id,
                value:
                    field.type === CustomEntityFieldTypeEnum.STRING
                        ? field.value
                        : field.type === CustomEntityFieldTypeEnum.NUMBER
                            ? Number(field.value)
                            : field.type === CustomEntityFieldTypeEnum.DATETIME
                                ? new Date(field.value as string)
                                : field.type === CustomEntityFieldTypeEnum.JSON
                                    ? field.value
                                    : field.value,
            })
            .returning({
                id: customEntityFieldValueString.id,
            })
            .execute();
    }

    async setFields(customEntityId: number, fields: NewCustomEntityField[]) {
        for (const field of fields) {
            await this.setField(customEntityId, field);
        }
    }

    async get(id: number) {
        const [entity, fields, childEntities] = await Promise.all([this.getEntity(id), this.getFields(id), this.getChildEntities(id)]);

        if (childEntities.length) {
            for (const childEntity of childEntities) {
                fields.push({
                    customEntityId: childEntity.id,
                    name: childEntity.name,
                    type: CustomEntityFieldTypeEnum.ENTITY as any,
                    value: childEntity.fields as any,
                    id: childEntity.id,
                });
            }
        }

        return {
            ...entity,
            fields,
        };
    }

    private getFields(id: number | number[]) {
        if (!id || (Array.isArray(id) && !id.length)) {
            return [];
        }
        return this.db
            .select({
                customEntityId: customEntityFieldValue.customEntityId,
                id: customEntityFieldValue.id,
                name: customEntityField.name,
                type: customEntityField.type,
                valueString: customEntityFieldValueString.value,
                valueNumber: customEntityFieldValueNumber.value,
                valueDatetime: customEntityFieldValueDatetime.value,
                valueJson: customEntityFieldValueJson.value,
            })
            .from(customEntityField)
            .innerJoin(customEntityFieldValue, eq(customEntityFieldValue.customEntityFieldId, customEntityField.id))
            .leftJoin(customEntityFieldValueString, eq(customEntityFieldValueString.customEntityFieldValueId, customEntityFieldValue.id))
            .leftJoin(customEntityFieldValueNumber, eq(customEntityFieldValueNumber.customEntityFieldValueId, customEntityFieldValue.id))
            .leftJoin(customEntityFieldValueDatetime, eq(customEntityFieldValueDatetime.customEntityFieldValueId, customEntityFieldValue.id))
            .leftJoin(customEntityFieldValueJson, eq(customEntityFieldValueJson.customEntityFieldValueId, customEntityFieldValue.id))
            .where(Array.isArray(id) ? inArray(customEntityFieldValue.customEntityId, id) : eq(customEntityFieldValue.customEntityId, id))
            .execute().then((res) => res.reduce((acc, row) => {
                const value = row.valueString ?? row.valueNumber ?? row.valueDatetime ?? row.valueJson ?? null as any;
                acc.push({
                    id: row.id,
                    customEntityId: row.customEntityId!,
                    name: row.name,
                    value,
                    type: row.type,
                });
                return acc;
            }, [] as {
                customEntityId: number;
                id: number;
                name: string;
                type: CustomEntityFieldTypeEnum;
                value: string | number | Date | object;
            }[]));
    }

    private async getChildEntities(id: number) {
        const childs = await this.db.execute(sql`
         WITH RECURSIVE cte_custom_entity_relation AS (
            SELECT
                custom_entity_id,
                custom_entity_id_related
            FROM
                custom_entity_relation
            WHERE
                custom_entity_id_related = ${id}
            UNION
            SELECT
                cer.custom_entity_id,
                cer.custom_entity_id_related
            FROM
                custom_entity_relation cer
            INNER JOIN cte_custom_entity_relation cte
            ON
                cer.custom_entity_id_related = cte.custom_entity_id
        )
        SELECT
            id,
            name
        FROM
            custom_entity
        WHERE
            id IN (SELECT custom_entity_id FROM cte_custom_entity_relation)
        `) as { id: number; name: string }[];

        const childFields = await this.getFields(childs.map((e) => e.id));

        for (const childEntity of childs) {
            const value = childFields.filter((f) => f.customEntityId === childEntity.id);
            if(value.some((f) => f.type === CustomEntityFieldTypeEnum.ENTITY)) {
                Reflect.set(childEntity, 'fields', await this.getChildEntities(childEntity.id));
            } else {
                Reflect.set(childEntity, 'fields', value);
            }

        }


        return childs as {
            id: number;
            name: string;
            fields: {
                customEntityId: number;
                id: number;
                name: string;
                type: CustomEntityFieldTypeEnum;
                value: string | number | Date | object;
            }[];
        }[];
    }

    private getEntity(id: number) {
        return this.db
            .select({
                id: customEntity.id,
                name: customEntity.name,
                parentId: customEntityRelation.customEntityIdRelated,
            })
            .from(customEntity)
            .leftJoin(customEntityRelation, eq(customEntityRelation.customEntityId, customEntity.id))
            .where(eq(customEntity.id, id))
            .execute()
            .then((res) => res?.[0] ?? null);
    }
}
