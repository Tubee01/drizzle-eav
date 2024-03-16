import { sql } from 'drizzle-orm';
import { index, integer, jsonb, text } from 'drizzle-orm/pg-core';
import { serial, pgTable, pgEnum, boolean, timestamp, unique } from 'drizzle-orm/pg-core';

export enum CustomEntityFieldTypeEnum {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DATETIME = 'DATETIME',
  JSON = 'JSON',
  ENTITY = 'ENTITY',
}

export const customEntityFieldTypeEnum = pgEnum('custom_entity_field_type', [
  CustomEntityFieldTypeEnum.STRING,
  CustomEntityFieldTypeEnum.NUMBER,
  CustomEntityFieldTypeEnum.DATETIME,
  CustomEntityFieldTypeEnum.JSON,
]);

export const customEntity = pgTable('custom_entity', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  isPrivate: boolean('is_private').notNull().default(false),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const customEntityRelation = pgTable(
  'custom_entity_relation',
  {
    customEntityId: integer('custom_entity_id').references(() => customEntity.id),
    customEntityIdRelated: integer('custom_entity_id_related').references(() => customEntity.id),
  },
  (table) => ({
    unique: unique('UQ-custom_entity_relation_relation_id').on(table.customEntityId, table.customEntityIdRelated),
  }),
);

export const customEntityField = pgTable(
  'custom_entity_field',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    type: customEntityFieldTypeEnum('type').notNull().default(CustomEntityFieldTypeEnum.STRING),
  },
  (table) => ({
    unique: unique('UQ-custom_entity_field_name_type').on(table.name, table.type),
  }),
);

export const customEntityFieldValue = pgTable(
  'custom_entity_field_value',
  {
    id: serial('id').primaryKey(),
    customEntityId: integer('custom_entity_id').references(() => customEntity.id),
    customEntityFieldId: integer('custom_entity_field_id').references(() => customEntityField.id),
  },
  (table) => ({
    unique: unique('UQ-custom_entity_field_value_custom_entity_relation_id_custom_entity_field_id').on(table.customEntityId, table.customEntityFieldId),
    index: index('IDX-custom_entity_field_value_custom_entity_relation_id').on(table.customEntityId),
    index2: index('IDX-custom_entity_field_value_custom_entity_field_id').on(table.customEntityFieldId),
  }),
);

export const customEntityFieldValueString = pgTable(
  'custom_entity_field_value_string',
  {
    id: serial('id').primaryKey(),
    customEntityFieldValueId: serial('custom_entity_field_value_id').notNull(),
    value: text('value').notNull(),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    index: unique('UQ-custom_entity_field_value_string_custom_entity_field_value_id').on(table.customEntityFieldValueId),
  }),
);

export const customEntityFieldValueNumber = pgTable(
  'custom_entity_field_value_number',
  {
    id: serial('id').primaryKey(),
    customEntityFieldValueId: serial('custom_entity_field_value_id').notNull(),
    value: integer('value').notNull(),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    index: index('IDX-custom_entity_field_value_number_custom_entity_field_value_id').on(table.customEntityFieldValueId),
  }),
);

export const customEntityFieldValueDatetime = pgTable(
  'custom_entity_field_value_datetime',
  {
    id: serial('id').primaryKey(),
    customEntityFieldValueId: serial('custom_entity_field_value_id').notNull(),
    value: timestamp('value').notNull(),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    index: index('IDX-custom_entity_field_value_datetime_custom_entity_field_value_id').on(table.customEntityFieldValueId),
  }),
);

export const customEntityFieldValueJson = pgTable(
  'custom_entity_field_value_json',
  {
    id: serial('id').primaryKey(),
    customEntityFieldValueId: serial('custom_entity_field_value_id').notNull(),
    value: jsonb('value').notNull(),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    index: index('IDX-custom_entity_field_value_json_custom_entity_field_value_id').on(table.customEntityFieldValueId),
  }),
);
