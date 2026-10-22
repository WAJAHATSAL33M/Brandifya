import { products } from '../lib/catalog.ts';
import { db, closeDatabase } from '../lib/db.ts';
if (process.env.STORE_LIVE === 'true') throw new Error('Demo import is disabled for live stores.');
try {
  await db().begin(async sql => {
    await sql.lock('product-id');
    for (const p of products) {
      await sql`INSERT INTO products (id,name,price_minor,original_price_minor,currency,stock,active,category,image,color,description,media,attributes)
        VALUES (${p.id},${p.name},${Math.round(p.price * 100)},${p.originalPrice ? Math.round(p.originalPrice * 100) : null},${process.env.NEXT_PUBLIC_STORE_CURRENCY || 'PKR'},${p.stock},false,${p.category},${p.image},${p.color},${p.description},${sql.json(p.media || [])},${sql.json(p.attributes || {})})
        ON DUPLICATE KEY UPDATE id=id`;
    }
  });
  console.log('Demo products imported as INACTIVE. Existing IDs preserved. Review and activate each product in /admin. Demo reviews and sales figures were not imported.');
} finally { await closeDatabase(); }
