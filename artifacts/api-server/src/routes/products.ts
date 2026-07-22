import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  ListProductsParams,
  CreateProductParams,
  CreateProductBody,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializeProduct = (p: typeof productsTable.$inferSelect) => ({
  ...p,
  price: p.price != null ? Number(p.price) : null,
  createdAt: p.createdAt.toISOString(),
});

router.get("/businesses/:businessId/products", async (req, res): Promise<void> => {
  const params = ListProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.businessId, params.data.businessId))
    .orderBy(productsTable.createdAt);
  res.json(products.map(serializeProduct));
});

router.post("/businesses/:businessId/products", async (req, res): Promise<void> => {
  const params = CreateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db
    .insert(productsTable)
    .values({ ...parsed.data, businessId: params.data.businessId })
    .returning();
  res.status(201).json(serializeProduct(product));
});

router.get("/products/:productId", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.productId));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(serializeProduct(product));
});

router.patch("/products/:productId", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db
    .update(productsTable)
    .set(parsed.data)
    .where(eq(productsTable.id, params.data.productId))
    .returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(serializeProduct(product));
});

router.delete("/products/:productId", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.productId))
    .returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
