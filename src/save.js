import { useBlockProps } from "@wordpress/block-editor";

export default function Save({ attributes }) {
  const ratio = (() => {
    const [w, h] = attributes.aspectRatio.split(":").map(Number);
    return w / h;
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
          maxWidth: attributes.height * ratio + "px",
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
