import test from "node:test";
import assert from "node:assert/strict";
import { cleanBlogHtml, validateBlog } from "../lib/blog-content.ts";
import { integer, exportCsv } from "../lib/admin-input.ts";
const article = {
  title: "Story",
  slug: "new-story",
  status: "draft",
  content: "<p>Story</p>",
  excerpt: "Intro",
  coverUrl: "",
  coverAlt: "",
  category: "Journal",
  tags: "home",
  author: "Brand E",
  seoTitle: "",
  seoDescription: "",
};
test("blog content strips scripts, event handlers, unsafe links and unsafe media", () => {
  const html = cleanBlogHtml(
    '<script>alert(1)</script><p onclick="evil()" style="position:fixed;text-align:center">Hello <strong>world</strong></p><a href="javascript:alert(1)">bad</a><img src="//evil.test/a"><img src="/api/media/image" onerror="evil()"><iframe src="https://evil.test"></iframe><video src="javascript:x" controls></video>',
  );
  assert.ok(
    !/script|onclick|onerror|position:|iframe|javascript:|evil.test/.test(html),
  );
  assert.match(html, /<strong>world<\/strong>/);
  assert.match(html, /text-align:center/);
  assert.match(html, /\/api\/media\/image/);
});
test("blog saves validate scheduled dates, slugs, media and preserve supported rich content", () => {
  assert.equal(validateBlog(article).slug, "new-story");
  assert.throws(() => validateBlog({ ...article, slug: "../bad" }));
  assert.throws(() => validateBlog({ ...article, status: "scheduled" }));
  assert.throws(() =>
    validateBlog({ ...article, status: "scheduled", publishAt: "2020-01-01" }),
  );
  assert.throws(() => validateBlog({ ...article, coverUrl: "javascript:x" }));
  assert.equal(
    validateBlog({
      ...article,
      status: "scheduled",
      publishAt: new Date(Date.now() + 86400000).toISOString(),
    }).status,
    "scheduled",
  );
  const html = cleanBlogHtml(
    '<h2>Title</h2><ul><li>Item</li></ul><table><tr><td>Cell</td></tr></table><video src="/api/media/123" controls></video>',
  );
  assert.match(html, /<table>/);
  assert.match(html, /<video/);
});
test("stock inputs reject fractional, unsafe and negative quantities; CSV neutralizes formulas", () => {
  assert.equal(integer(-2, "adjustment", -10, 10), -2);
  for (const v of [1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])
    assert.throws(() => integer(v, "quantity", 0, 100));
  const csv = exportCsv([{ name: '=HYPERLINK("evil")', stock: 3 }]);
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(csv.includes('""evil""'));
});
