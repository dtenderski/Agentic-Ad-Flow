import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, businessesTable } from "@workspace/db";
import {
  CreateBusinessBody,
  UpdateBusinessBody,
  GetBusinessParams,
  UpdateBusinessParams,
  DeleteBusinessParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/businesses", async (req, res): Promise<void> => {
  const businesses = await db.select().from(businessesTable).orderBy(businessesTable.createdAt);
  res.json(businesses.map(b => ({ ...b, createdAt: b.createdAt.toISOString() })));
});

router.post("/businesses", async (req, res): Promise<void> => {
  const parsed = CreateBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [business] = await db.insert(businessesTable).values(parsed.data).returning();
  res.status(201).json({ ...business, createdAt: business.createdAt.toISOString() });
});

router.get("/businesses/:businessId", async (req, res): Promise<void> => {
  const params = GetBusinessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, params.data.businessId));
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  res.json({ ...business, createdAt: business.createdAt.toISOString() });
});

router.patch("/businesses/:businessId", async (req, res): Promise<void> => {
  const params = UpdateBusinessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [business] = await db
    .update(businessesTable)
    .set(parsed.data)
    .where(eq(businessesTable.id, params.data.businessId))
    .returning();
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  res.json({ ...business, createdAt: business.createdAt.toISOString() });
});

router.delete("/businesses/:businessId", async (req, res): Promise<void> => {
  const params = DeleteBusinessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [business] = await db
    .delete(businessesTable)
    .where(eq(businessesTable.id, params.data.businessId))
    .returning();
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
