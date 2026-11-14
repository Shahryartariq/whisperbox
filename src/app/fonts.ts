import localFont from "next/font/local";

// Self-hosted, so no request leaves the site. Bricolage is preloaded (it draws
// the headline); Caveat is only used for answers, so it loads when first needed.
export const bricolage = localFont({
  src: "../fonts/bricolage-grotesque-latin-wdth-normal.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-bricolage",
  declarations: [{ prop: "font-stretch", value: "75% 100%" }],
});

export const caveat = localFont({
  src: "../fonts/caveat-latin-500-normal.woff2",
  weight: "500",
  display: "swap",
  variable: "--font-caveat",
  preload: false,
  adjustFontFallback: false,
});
