import test from 'node:test';
import assert from 'node:assert/strict';
import { saleState, saleTimeLeft } from '../lib/sale-products.ts';
const p = { id: 1, stock: 2, price: 100, originalPrice: 150 } as any;
const scheduled = {...p, promotionActive: true, promotionStartsAt: '2026-10-20T00:00:00Z', promotionEndsAt: '2026-10-22T00:00:00Z'};
test('sale section selects discounted available products and respects schedules',()=>{
 const now=Date.parse('2026-10-21T00:00:00Z');
 assert.equal(saleState([p,{...p,stock:0},{...p,originalPrice:100},{...p,price:NaN},{...p,id:-1}],now).products.length,1);
 assert.equal(saleState([scheduled],now).deadline,Date.parse(scheduled.promotionEndsAt));
 assert.equal(saleState([scheduled],Date.parse('2026-10-19T00:00:00Z')).products.length,0);
 assert.equal(saleState([scheduled],Date.parse(scheduled.promotionEndsAt)).products.length,0);
 assert.equal(saleState([p],now).deadline,null);
});
test('countdown uses actual remaining time and stops at zero',()=>{
 assert.deepEqual(saleTimeLeft(90061000,0),['01','01','01','01']);
 assert.deepEqual(saleTimeLeft(1000,2000),['00','00','00','00']);
});
