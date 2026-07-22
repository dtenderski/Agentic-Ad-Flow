import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adsetsTable } from "@workspace/db";
import {
  ListAdSetsParams,
  CreateAdSetParams,
  CreateAdSetBody,
  GetAdSetParams,
  UpdateAdSetParams,
  UpdateAdSetBody,
  DeleteAdSetParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializeAdset = (a: typeof adsetsTable.$inferSelect) => ({
  ...a,
  budget: a.budget != null ? Number(a.budget) : null,
  createdAt: a.createdAt.toISOString(),
});

router.get("/campaigns/:campaignId/adsets", async (req, res): Promise<void> => {
  const params = ListAdSetsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const adsets = await db
    .select()
    .from(adsetsTable)
    .where(eq(adsetsTable.campaignId, params.data.campaignId))
    .orderBy(adsetsTable.createdAt);
  res.json(adsets.map(serializeAdset));
});

router.post("/campaigns/:campaignId/adsets", async (req, res): Promise<void> => {
  const params = CreateAdSetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateAdSetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [adset] = await db
    .insert(adsetsTable)
    .values({ ...parsed.data, campaignId: params.data.campaignId })
    .returning();
  res.status(201).json(serializeAdset(adset));
});

router.get("/adsets/:adsetId", async (req, res): Promise<void> => {
  const params = GetAdSetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [adset] = await db
    .select()
    .from(adsetsTable)
    .where(eq(adsetsTable.id, params.data.adsetId));
  if (!adset) {
    res.status(404).json({ error: "Ad set not found" });
    return;
  }
  res.json(serializeAdset(adset));
});

router.patch("/adsets/:adsetId", async (req, res): Promise<void> => {
  const params = UpdateAdSetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAdSetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [adset] = await db
    .update(adsetsTable)
    .set(parsed.data)
    .where(eq(adsetsTable.id, params.data.adsetId))
    .returning();
  if (!adset) {
    res.status(404).json({ error: "Ad set not found" });
    return;
  }
  res.json(serializeAdset(adset));
});

router.delete("/adsets/:adsetId", async (req, res): Promise<void> => {
  const params = DeleteAdSetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [adset] = await db
    .delete(adsetsTable)
    .where(eq(adsetsTable.id, params.data.adsetId))
    .returning();
  if (!adset) {
    res.status(404).json({ error: "Ad set not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
