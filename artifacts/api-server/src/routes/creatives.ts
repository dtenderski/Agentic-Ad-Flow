import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, creativesTable } from "@workspace/db";
import {
  ListCreativesParams,
  CreateCreativeParams,
  CreateCreativeBody,
  GetCreativeParams,
  UpdateCreativeParams,
  UpdateCreativeBody,
  DeleteCreativeParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializeCreative = (c: typeof creativesTable.$inferSelect) => ({
  ...c,
  createdAt: c.createdAt.toISOString(),
});

router.get("/adsets/:adsetId/creatives", async (req, res): Promise<void> => {
  const params = ListCreativesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const creatives = await db
    .select()
    .from(creativesTable)
    .where(eq(creativesTable.adsetId, params.data.adsetId))
    .orderBy(creativesTable.createdAt);
  res.json(creatives.map(serializeCreative));
});

router.post("/adsets/:adsetId/creatives", async (req, res): Promise<void> => {
  const params = CreateCreativeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateCreativeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [creative] = await db
    .insert(creativesTable)
    .values({ ...parsed.data, adsetId: params.data.adsetId })
    .returning();
  res.status(201).json(serializeCreative(creative));
});

router.get("/creatives/:creativeId", async (req, res): Promise<void> => {
  const params = GetCreativeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [creative] = await db
    .select()
    .from(creativesTable)
    .where(eq(creativesTable.id, params.data.creativeId));
  if (!creative) {
    res.status(404).json({ error: "Creative not found" });
    return;
  }
  res.json(serializeCreative(creative));
});

router.patch("/creatives/:creativeId", async (req, res): Promise<void> => {
  const params = UpdateCreativeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCreativeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [creative] = await db
    .update(creativesTable)
    .set(parsed.data)
    .where(eq(creativesTable.id, params.data.creativeId))
    .returning();
  if (!creative) {
    res.status(404).json({ error: "Creative not found" });
    return;
  }
  res.json(serializeCreative(creative));
});

router.delete("/creatives/:creativeId", async (req, res): Promise<void> => {
  const params = DeleteCreativeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [creative] = await db
    .delete(creativesTable)
    .where(eq(creativesTable.id, params.data.creativeId))
    .returning();
  if (!creative) {
    res.status(404).json({ error: "Creative not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
