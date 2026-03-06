import { useBlockProps } from "@wordpress/block-editor";

function parseRatio(str) {
  if (!str || !str.trim()) return null;
  const s = str.trim();
  if (/^[\d.]+$/.test(s)) {
    const v = parseFloat(s);
    return isNaN(v) || v <= 0 ? null : v;
  }
  const parts = s.split(":").map(Number);
  if (
    parts.length !== 2 ||
    isNaN(parts[0]) ||
    isNaN(parts[1]) ||
    parts[1] === 0
  )
    return null;
  return parts[0] / parts[1];
}

export default function Save({ attributes }) {
  const ratio = parseRatio(attributes.aspectRatio);
  const hasRatio = ratio !== null;
  const blockProps = useBlockProps.save();

  const wrapStyle = hasRatio
    ? {
        position: "relative",
        width: attributes.width || "500px",
        maxWidth: "100%",
        height: 0,
        paddingTop: `calc((${attributes.width || "500px"}) / ${ratio})`,
        margin: "0 auto",
      }
    : {
        position: "relative",
        width: attributes.width || "500px",
        maxWidth: "100%",
        height: attributes.height || "500px",
        margin: "0 auto",
      };

  return (
    <div {...blockProps}>
      <div className="nft-split-canvas-wrap" style={wrapStyle}>
        <canvas
          className="nft-split-canvas"
          data-config={JSON.stringify(attributes)}
          style={{
            position: hasRatio ? "absolute" : "relative",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            cursor: "crosshair",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
