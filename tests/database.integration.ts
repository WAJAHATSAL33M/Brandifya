import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { db, closeDatabase, cancelOrder } from '../lib/db.ts';
const uri = process.env.TEST_DATABASE_URL;
if (!uri || !new URL(uri).pathname.endsWith('_test')) throw new Error('Set TEST_DATABASE_URL to a dedicated MySQL database ending in _test. Never use the production database.');
process.env.DATABASE_URL = uri;
const sql = db();
test('MySQL persistence, parameter binding, rollback, request serialization and cancellation', async () => {
  const customer = randomUUID(), order = randomUUID(), key = randomUUID(), media = randomUUID(), product = 990001;
  try {
    await sql`INSERT INTO products (id,name,price_minor,stock,active,description,media,attributes) VALUES (${product},${"Demo '); DROP TABLE products; --"},10000,10,true,'test',${sql.json([{ type:'image',url:'/products/best0.webp',alt:'photo' }])},${sql.json({ material:'cotton' })})`;
    const rows = await sql`SELECT * FROM products WHERE id=${product}`;
    assert.equal(rows[0].active,true);assert.equal(rows[0].media[0].alt,'photo');assert.equal(rows[0].attributes.material,'cotton');
    await assert.rejects(sql.begin(async tx => { await tx`UPDATE products SET stock=0 WHERE id=${product}`; throw Error('rollback'); }), /rollback/);
    assert.equal((await sql`SELECT stock FROM products WHERE id=${product}`)[0].stock,10);
    await sql`INSERT INTO customers (id,name,email,email_verified) VALUES (${customer},'Customer',${customer+'@example.com'},true)`;
    assert.equal((await sql`SELECT email_verified FROM customers WHERE id=${customer}`)[0].email_verified,true);
    const bytes=Buffer.from([0,1,255,42]);await sql`INSERT INTO product_media (id,mime_type,content) VALUES (${media},'image/png',${bytes})`;
    assert.deepEqual((await sql`SELECT content FROM product_media WHERE id=${media}`)[0].content,bytes);
    const attempts = await Promise.all(Array.from({length:8},()=>sql.begin(async tx => {
      await tx.lock('integration:'+key);
      if ((await tx`SELECT id FROM orders WHERE request_key=${key}`).length) return 'existing';
      const stock = await tx`SELECT stock FROM products WHERE id=${product} FOR UPDATE`;assert.equal(stock[0].stock,10);
      await tx`INSERT INTO orders (id,request_key,request_fingerprint,status,payment_method,currency,total_minor,shipping_minor,customer,customer_id) VALUES (${order},${key},${'a'.repeat(64)},'awaiting_payment','stripe','PKR',20000,0,${tx.json({name:'Customer'})},${customer})`;
      await tx`INSERT INTO order_items (order_id,product_id,name,price_minor,quantity) VALUES (${order},${product},'test',10000,2)`;
      await tx`UPDATE products SET stock=stock-2 WHERE id=${product}`;
      return 'new';
    })));
    assert.equal(attempts.filter(a=>a==='new').length,1);assert.equal((await sql`SELECT stock FROM products WHERE id=${product}`)[0].stock,8);
    await Promise.all([cancelOrder(order),cancelOrder(order)]);
    assert.equal((await sql`SELECT stock FROM products WHERE id=${product}`)[0].stock,10);
    assert.equal((await sql`SELECT customer FROM orders WHERE id=${order}`)[0].customer.name,'Customer');
    // MySQL aggregate and date syntax, including the admin summary shape.
    const summary=await sql`SELECT count(*) AS total,coalesce(sum(DATE(created_at)=current_date),0) AS today,coalesce(sum(status IN ('confirmed','paid','processing')),0) AS pending FROM orders`;
    assert.equal(typeof summary[0].total,'number');assert.ok(summary[0].today>=1);
  } finally {
    await sql`DELETE FROM order_items WHERE order_id=${order}`;await sql`DELETE FROM orders WHERE id=${order}`;
    await sql`DELETE FROM customers WHERE id=${customer}`;await sql`DELETE FROM product_media WHERE id=${media}`;await sql`DELETE FROM products WHERE id=${product}`;
    await closeDatabase();
  }
});
