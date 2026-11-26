import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "./schema/contract.d.ts";
import contractJson from "./schema/contract.json" with { type: "json" };

export const contract = contractFromJson<Contract>(contractJson);

export const db = postgres({
  contract,
  url: process.env["DATABASE_URL"]!,
});

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];