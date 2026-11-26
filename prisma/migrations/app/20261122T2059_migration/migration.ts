#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/680e004bf891ca01a1029b17dedb3a7b0e7a35eb6b4b240dee823f805ae194e3/contract';
import startContract from '../../snapshots/680e004bf891ca01a1029b17dedb3a7b0e7a35eb6b4b240dee823f805ae194e3/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c91ff20cef92c4ae16327f05bf8f6c387e637c19a15f231d4a592a31cb14a96a/contract';
import endContract from '../../snapshots/c91ff20cef92c4ae16327f05bf8f6c387e637c19a15f231d4a592a31cb14a96a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'User',
        column: 'department',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
