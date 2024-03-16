import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { CustomEntityRepository, NewCustomEntity } from './db/custom-entity.repository';
import { CustomEntityFieldTypeEnum } from './db/schema';

// for query purposes
const queryClient = postgres('postgres://eav:eav@0.0.0.0:5432/eav2');
const db = drizzle(queryClient, { logger: false });

const customEntityInsert: NewCustomEntity = {
  name: 'Custom Entity',
  parentId: 49,
  fields: [
    {
      name: 'count',
      type: CustomEntityFieldTypeEnum.NUMBER,
      value: 5,
    },
    {
      name: 'name',
      type: CustomEntityFieldTypeEnum.STRING,
      value: 'csöcsös',
    },
    {
      name: 'date',
      type: CustomEntityFieldTypeEnum.DATETIME,
      value: new Date(),
    },
    {
      name: 'json',
      type: CustomEntityFieldTypeEnum.JSON,
      value: { key: 'value' },
    },
  ],
};

async function main() {
  db.transaction(async (trx) => {
    const repo = new CustomEntityRepository(trx);
    const entity = await repo.create(customEntityInsert);

    // await repo.setName(entity.id!, 'csöcsös');

    console.dir(await repo.get(13), { depth: null });
  });
}

main()
  .then(() => {
    console.log('Done.');
  })
  .catch((err) => {
    console.error(err);
  })
  .finally(async () => await queryClient.end().then(() => console.log('Connection closed.')));
