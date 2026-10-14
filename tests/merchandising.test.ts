import test from 'node:test';
import assert from 'node:assert/strict';
import { merchandising } from '../lib/merchandising.ts';
const p = { id: 1, stock: 2, badge: 'Countdown Timer', promotionActive: true, promotionStartsAt: '2026-10-14T00:00:00Z', promotionEndsAt: '2026-10-15T00:00:00Z' } as any;
test('countdown uses saved dates, advances and expires without restarting', () => {
  assert.equal(merchandising(p, Date.parse('2026-10-14T23:59:58Z')).badge, '00:00:02');
  assert.equal(merchandising(p, Date.parse('2026-10-14T23:59:59Z')).badge, '00:00:01');
  assert.equal(merchandising(p, Date.parse(p.promotionEndsAt)).badge, null);
  assert.equal(merchandising(p, null).badge, null);
  assert.equal(merchandising({...p, promotionActive: false}, Date.parse(p.promotionStartsAt)).badge, null);
});
test('stock-driven badges and unavailable claims do not contradict inventory', () => {
  assert.equal(merchandising({...p, stock: 0}, null).badge, 'Sold Out');
  assert.equal(merchandising({...p, badge: 'Few Left'}, null).badge, 'Few Left');
  assert.equal(merchandising({...p, badge: 'Few Left', stock: 12}, null).badge, null);
  assert.equal(merchandising({...p, badge: 'Sold Out'}, null).badge, null);
  assert.equal(merchandising({...p, badge: "In 15 People's Carts"}, null).badge, null);
});
