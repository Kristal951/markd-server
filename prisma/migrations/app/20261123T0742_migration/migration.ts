#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/06f6b8fa91a60f0e187bb6c7740b67dbf960e64f69208d97817616aee0ba749e/contract';
import startContract from '../../snapshots/06f6b8fa91a60f0e187bb6c7740b67dbf960e64f69208d97817616aee0ba749e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/bdf713e988d34aeb2a9a95f6152a31125e2e7fa10e193b6bbb97034d029d883a/contract';
import endContract from '../../snapshots/bdf713e988d34aeb2a9a95f6152a31125e2e7fa10e193b6bbb97034d029d883a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [this.setNotNull({ schema: 'public', table: 'User', column: 'department' })];
  }
}

MigrationCLI.run(import.meta.url, M);
