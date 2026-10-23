import sanitize from "sanitize-html";
import { safeMediaUrl } from "./auth-core.ts";
export const cleanBlogHtml = (html: string) =>
  sanitize(html, {
    allowedTags: [
      "p",
      "br",
      "h2",
      "h3",
      "h4",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "video",
      "hr",
      "pre",
      "code",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {
      video: ["src", "controls"],
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      p: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["https", "mailto", "tel"],
    allowProtocolRelative: false,
    allowedStyles: { "*": { "text-align": [/^(left|right|center|justify)$/] } },
    transformTags: {
      a: (_tag, attrs) => ({
        tagName: "a",
        attribs: { ...attrs, rel: "noopener noreferrer" },
      }),
    },
    exclusiveFilter: (frame) =>
      ["img", "video"].includes(frame.tag) && !safeMediaUrl(frame.attribs.src),
  });
export function validateBlog(b: Record<string, unknown>) {
  const str = (key: string, max: number, required = false) => {
    const s = b[key];
    if (typeof s !== "string" || s.length > max || (required && !s.trim()))
      throw Error("Invalid " + key + ".");
    return s.trim();
  };
  const slug = str("slug", 180, true);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw Error("Use a lowercase URL slug with hyphens.");
  const status = str("status", 20);
  if (!["draft", "published", "scheduled", "trash"].includes(status))
    throw Error("Invalid publication status.");
  const publishAt = b.publishAt ? new Date(String(b.publishAt)) : null;
  if (publishAt && !Number.isFinite(publishAt.getTime()))
    throw Error("Invalid publication date.");
  if (
    status === "scheduled" &&
    (!publishAt || publishAt.getTime() <= Date.now())
  )
    throw Error("Choose a future time for scheduled posts.");
  const cover = str("coverUrl", 2048);
  if (cover && !safeMediaUrl(cover)) throw Error("Invalid cover URL.");
  return {
    title: str("title", 240, true),
    slug,
    status,
    publishAt,
    content: cleanBlogHtml(str("content", 200000)),
    excerpt: str("excerpt", 1000),
    coverUrl: cover,
    coverAlt: str("coverAlt", 200),
    category: str("category", 100, true),
    tags: str("tags", 500),
    author: str("author", 120, true),
    seoTitle: str("seoTitle", 240),
    seoDescription: str("seoDescription", 320),
  };
}
