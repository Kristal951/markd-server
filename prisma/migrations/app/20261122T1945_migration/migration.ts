#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/680e004bf891ca01a1029b17dedb3a7b0e7a35eb6b4b240dee823f805ae194e3/contract.js';
import endContract from '../../snapshots/680e004bf891ca01a1029b17dedb3a7b0e7a35eb6b4b240dee823f805ae194e3/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'User',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('fullName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('matricNo', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('staffId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('User_role_check_70928d93', sql`"role" IN ('STUDENT', 'LECTURER')`),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_matricNo_key',
        columns: ['matricNo'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_staffId_key',
        columns: ['staffId'],
      }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'User' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
