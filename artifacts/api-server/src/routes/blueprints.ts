import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, blueprintsTable } from "@workspace/db";
import { GetBlueprintParams } from "@workspace/api-zod";

const router: IRouter = Router();

const serializeBlueprint = (b: typeof blueprintsTable.$inferSelect) => ({
  ...b,
  createdAt: b.createdAt.toISOString(),
});

router.get("/blueprints", async (_req, res): Promise<void> => {
  const blueprints = await db.select().from(blueprintsTable).orderBy(blueprintsTable.createdAt);
  res.json(blueprints.map(serializeBlueprint));
});

router.get("/blueprints/:blueprintId", async (req, res): Promise<void> => {
  const params = GetBlueprintParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [blueprint] = await db
    .select()
    .from(blueprintsTable)
    .where(eq(blueprintsTable.id, params.data.blueprintId));
  if (!blueprint) {
    res.status(404).json({ error: "Blueprint not found" });
    return;
  }
  res.json(serializeBlueprint(blueprint));
});

export default router;
