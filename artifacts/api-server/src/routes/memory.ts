import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, agentMemoryTable } from "@workspace/db";
import { GetBusinessMemoryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const serializeMemory = (m: typeof agentMemoryTable.$inferSelect) => ({
  ...m,
  createdAt: m.createdAt.toISOString(),
  updatedAt: m.updatedAt.toISOString(),
});

router.get("/memory", async (_req, res): Promise<void> => {
  const memories = await db.select().from(agentMemoryTable).orderBy(agentMemoryTable.updatedAt);
  res.json(memories.map(serializeMemory));
});

router.get("/memory/:businessId", async (req, res): Promise<void> => {
  const params = GetBusinessMemoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [memory] = await db
    .select()
    .from(agentMemoryTable)
    .where(eq(agentMemoryTable.businessId, params.data.businessId));
  if (!memory) {
    res.status(404).json({ error: "No memory found for this business" });
    return;
  }
  res.json(serializeMemory(memory));
});

export default router;
