import { createElement, type ReactNode } from "react";
import {
  articleTemplate,
  postTemplate,
  OG_WIDTH,
  OG_HEIGHT,
  type OgNode,
} from "@/lib/og/templates";
import regularFont from "@/lib/og/fonts/Lato-Regular.ttf?url";
import boldFont from "@/lib/og/fonts/Lato-Bold.ttf?url";
import { useI18n } from "@/i18n/I18nProvider";

function renderNode(node: unknown, key = 0): ReactNode {
  if (typeof node === "string" || typeof node === "number") return node;
  if (Array.isArray(node)) return node.map((child, index) => renderNode(child, index));
  if (!node || typeof node !== "object" || !("type" in node)) return null;
  const {
    type,
    props: { children, ...props },
  } = node as OgNode;
  return createElement(type, { ...props, key }, renderNode(children));
}

// Render the actual pure OG template at its native dimensions. The SVG viewport
// scales it without maintaining a second layout or requesting unpublished data.
export function OgPreview({
  title,
  kind = "post",
  dateLabel = null,
}: {
  title: string;
  kind?: "post" | "work";
  dateLabel?: string | null;
}) {
  const { t } = useI18n();
  const headline = title.trim() || t("postForm.untitled");
  const node =
    kind === "work"
      ? articleTemplate({ title: headline, dateLabel, kicker: "./works/", branding: "" })
      : postTemplate({ title: headline, dateLabel });
  node.props.style = {
    ...(node.props.style as object),
    fontFamily: '"OG Preview Lato", "Noto Sans TC", sans-serif',
    boxSizing: "border-box",
  };
  return (
    <>
      <style>{`@font-face { font-family: "OG Preview Lato"; src: url("${regularFont}") format("truetype"); font-weight: 400; }
@font-face { font-family: "OG Preview Lato"; src: url("${boldFont}") format("truetype"); font-weight: 700; }`}</style>
      <svg
        viewBox={`0 0 ${OG_WIDTH} ${OG_HEIGHT}`}
        role="img"
        aria-label={t("postForm.ogPreview")}
        style={{ display: "block", width: "100%", height: "auto" }}
      >
        <foreignObject width={OG_WIDTH} height={OG_HEIGHT}>
          {renderNode(node)}
        </foreignObject>
      </svg>
    </>
  );
}
