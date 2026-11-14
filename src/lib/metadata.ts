import type { Metadata } from "next";
import { SITE_NAME } from "./site";

// The generated card at /opengraph-image. Child pages don't inherit it once
// they set their own Open Graph fields, so it is named here.
const SOCIAL_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Whisperbox: ask anything, read what people really think",
};

/**
 * Metadata for a public page. Open Graph fields don't merge with the layout's,
 * so every page states its own title, description and URL here.
 */
export function pageMetadata({
  title,
  socialTitle = title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string;
  socialTitle?: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title: socialTitle,
      description,
      url: path,
      images: [SOCIAL_IMAGE],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [SOCIAL_IMAGE] },
  };
}
