import test from 'node:test';
import assert from 'node:assert/strict';
import { cardChips } from '../lib/card-badges.ts';
const product = { id: 1, stock: 2, rating: 4.7, reviewCount: 120, soldCount: 5300 } as any;
const state = { badge: 'Featured', lowStock: false, promotion: false, minutesLeft: null };
test('mobile chips use verified counts and show applicable supporting labels', () => {
  assert.deepEqual(cardChips(product, state).map(c => c.label), ['5.3K sold', 'Top Rated']);
  assert.equal(cardChips({ ...product, rating: 5, reviewCount: 0, soldCount: NaN }, state).length, 0);
  assert.equal(cardChips({ ...product, stock: 0 }, state).length, 0);
});
test('active ending promotions and low stock take priority without duplicating image badges', () => {
  assert.deepEqual(cardChips(product, { ...state, lowStock: true, promotion: true, minutesLeft: 30 }).map(c => c.label), ['5.3K sold', 'Ends Soon', 'Few Left', 'Top Rated']);
  assert.deepEqual(cardChips(product, { ...state, badge: 'Top Rated' }).map(c => c.label), ['5.3K sold']);
  assert.equal(cardChips(product, { ...state, promotion: false, minutesLeft: 30 }).some(c => c.label === 'Ends Soon'), false);
});
