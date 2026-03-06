import { useBlockProps } from "@wordpress/block-editor";

export default function Save({ attributes }) {
  const ratio = (() => {
    if (!attributes.aspectRatio || !attributes.aspectRatio.trim()) return null;
    const s = attributes.aspectRatio.trim();
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
  })();

  const blockProps = useBlockProps.save();

  return (
    <div {...blockProps}>
      <div
        className="nft-split-canvas-wrap"
        style={{
          position: "relative",
          width: "100%",
          height: attributes.height + "px",
          maxWidth: ratio ? attributes.height * ratio + "px" : "100%",
          margin: "0 auto",
        }}>
        <canvas
          className="nft-split-canvas"
          data-config={JSON.stringify(attributes)}
          style={{
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
