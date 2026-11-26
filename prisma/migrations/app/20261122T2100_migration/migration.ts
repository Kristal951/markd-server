#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/88ef872f38779569c35cb8c8092afd3c2d294a24711100beede5d652d585090d/contract';
import endContract from '../../snapshots/88ef872f38779569c35cb8c8092afd3c2d294a24711100beede5d652d585090d/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c91ff20cef92c4ae16327f05bf8f6c387e637c19a15f231d4a592a31cb14a96a/contract';
import startContract from '../../snapshots/c91ff20cef92c4ae16327f05bf8f6c387e637c19a15f231d4a592a31cb14a96a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [this.dropNotNull({ schema: 'public', table: 'User', column: 'department' })];
  }
}

MigrationCLI.run(import.meta.url, M);
