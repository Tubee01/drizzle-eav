CREATE TYPE "custom_entity_field_type" AS ENUM ('STRING', 'NUMBER', 'DATETIME', 'JSON');

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE "custom_entity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "is_private" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK-custom_entity" PRIMARY KEY ("id")
);


CREATE TABLE "custom_entity_relation" (
    "custom_entity_id" INTEGER NOT NULL,
    "custom_entity_id_related" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "UQ-custom_entity_relation_relation_id"
ON "custom_entity_relation" ("custom_entity_id", "custom_entity_id_related");

CREATE TABLE "custom_entity_field" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "custom_entity_field_type" NOT NULL,
    CONSTRAINT "PK-custom_entity_field" PRIMARY KEY ("id")
);  

CREATE UNIQUE INDEX "UQ-custom_entity_field_name_type"
ON "custom_entity_field" ("name", "type");


CREATE TABLE "custom_entity_field_value" (
    "id" SERIAL NOT NULL,
    "custom_entity_id" INTEGER NOT NULL,
    "custom_entity_field_id" INTEGER NOT NULL,
    CONSTRAINT "PK-custom_entity_field_value" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UQ-custom_entity_field_value_custom_entity_id_custom_entity_field_id"
ON "custom_entity_field_value" ("custom_entity_id", "custom_entity_field_id");


CREATE TABLE "custom_entity_field_value_string" (
    "id" SERIAL NOT NULL,
    "custom_entity_field_value_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "PK-custom_entity_field_value_string" PRIMARY KEY ("id")
);

CREATE INDEX "IDX-custom_entity_field_value_string_custom_entity_field_value_id"
ON "custom_entity_field_value_string" ("custom_entity_field_value_id");

CREATE TRIGGER "update_custom_entity_field_value_string_updated_at"
BEFORE UPDATE
ON "custom_entity_field_value_string"
FOR EACH ROW
EXECUTE FUNCTION "update_updated_at_column"();


CREATE TABLE "custom_entity_field_value_number" (
    "id" SERIAL NOT NULL,
    "custom_entity_field_value_id" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "PK-custom_entity_field_value_number" PRIMARY KEY ("id")
);

CREATE TRIGGER "update_custom_entity_field_value_number_updated_at"
BEFORE UPDATE
ON "custom_entity_field_value_number"
FOR EACH ROW
EXECUTE FUNCTION "update_updated_at_column"();


CREATE TABLE "custom_entity_field_value_datetime" (
    "id" SERIAL NOT NULL,
    "custom_entity_field_value_id" INTEGER NOT NULL,
    "value" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "PK-custom_entity_field_value_datetime" PRIMARY KEY ("id")
);

CREATE TRIGGER "update_custom_entity_field_value_datetime_updated_at"
BEFORE UPDATE
ON "custom_entity_field_value_datetime"
FOR EACH ROW
EXECUTE FUNCTION "update_updated_at_column"();


CREATE TABLE "custom_entity_field_value_json" (
    "id" SERIAL NOT NULL,
    "custom_entity_field_value_id" INTEGER NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "PK-custom_entity_field_value_json" PRIMARY KEY ("id")
);

CREATE TRIGGER "update_custom_entity_field_value_json_updated_at"
BEFORE UPDATE
ON "custom_entity_field_value_json"
FOR EACH ROW
EXECUTE FUNCTION "update_updated_at_column"();


-- create foreing KEYS

ALTER TABLE "custom_entity_relation"
ADD CONSTRAINT "FK-custom_entity_relation_custom_entity_id"
FOREIGN KEY ("custom_entity_id")
REFERENCES "custom_entity" ("id")
ON DELETE CASCADE;

ALTER TABLE "custom_entity_relation"
ADD CONSTRAINT "FK-custom_entity_relation_custom_entity_id_related"
FOREIGN KEY ("custom_entity_id_related")
REFERENCES "custom_entity" ("id")
ON DELETE CASCADE;


ALTER TABLE "custom_entity_field_value"
ADD CONSTRAINT "FK-custom_entity_field_value_custom_entity_id"
FOREIGN KEY ("custom_entity_id")
REFERENCES "custom_entity" ("id")
ON DELETE CASCADE;

ALTER TABLE "custom_entity_field_value"
ADD CONSTRAINT "FK-custom_entity_field_value_custom_entity_field_id"
FOREIGN KEY ("custom_entity_field_id")
REFERENCES "custom_entity_field" ("id")
ON DELETE CASCADE;

ALTER TABLE "custom_entity_field_value_string"
ADD CONSTRAINT "FK-custom_entity_field_value_string_custom_entity_field_value_id"
FOREIGN KEY ("custom_entity_field_value_id")
REFERENCES "custom_entity_field_value" ("id")
ON DELETE CASCADE;

ALTER TABLE "custom_entity_field_value_number"
ADD CONSTRAINT "FK-custom_entity_field_value_number_custom_entity_field_value_id"
FOREIGN KEY ("custom_entity_field_value_id")
REFERENCES "custom_entity_field_value" ("id")
ON DELETE CASCADE;

ALTER TABLE "custom_entity_field_value_datetime"
ADD CONSTRAINT "FK-custom_entity_field_value_datetime_custom_entity_field_value_id"
FOREIGN KEY ("custom_entity_field_value_id")
REFERENCES "custom_entity_field_value" ("id")
ON DELETE CASCADE;

ALTER TABLE "custom_entity_field_value_json"
ADD CONSTRAINT "FK-custom_entity_field_value_json_custom_entity_field_value_id"
FOREIGN KEY ("custom_entity_field_value_id")
REFERENCES "custom_entity_field_value" ("id")
ON DELETE CASCADE;

-- drop all table

-- DROP TABLE "custom_entity_field_value_json";
-- DROP TABLE "custom_entity_field_value_datetime";
-- DROP TABLE "custom_entity_field_value_number";
-- DROP TABLE "custom_entity_field_value_string";
-- DROP TABLE "custom_entity_field_value";
-- DROP TABLE "custom_entity_field";
-- DROP TABLE "custom_entity_relation";
-- DROP TABLE "custom_entity";
