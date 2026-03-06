import { useEffect, useRef, useCallback } from "@wordpress/element";
import { InspectorControls, useBlockProps } from "@wordpress/block-editor";
import {
  PanelBody,
  RangeControl,
  ToggleControl,
  SelectControl,
  Button,
  ColorPalette,
  __experimentalHStack as HStack,
  BaseControl,
} from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import { renderCanvas } from "./canvas-engine";

const ASPECT_RATIOS = [
  { label: "1:1", value: "1:1" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "3:2", value: "3:2" },
  { label: "2:3", value: "2:3" },
  { label: "21:9", value: "21:9" },
];

function parseRatio(str) {
  const [w, h] = str.split(":").map(Number);
  return w / h;
}

export default function Edit({ attributes, setAttributes }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef({ mouseProgress: 0, targetProgress: 0, tree: null });

  const blockProps = useBlockProps({
    style: { position: "relative" },
  });

  const ratio = parseRatio(attributes.aspectRatio);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCanvas(canvas, attributes, stateRef.current);
    animRef.current = requestAnimationFrame(draw);
  }, [attributes]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  useEffect(() => {
    if (attributes.seed === 0) {
      setAttributes({ seed: Math.floor(Math.random() * 2147483647) });
    }
  }, []);

  const handleMouse = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width,
      h = rect.height;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = w / 2,
      cy = h / 2;
    const maxDist = Math.max(w, h) / 2;
    const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
    const normalized = 1 - Math.min(dist / maxDist, 1);
    stateRef.current.targetProgress = Math.pow(
      normalized,
      attributes.mousePower,
    );
  };

  const handleLeave = () => {
    stateRef.current.targetProgress = 0;
  };

  return (
    <>
      <InspectorControls>
        <PanelBody
          title={__("Aspect Ratio & Size", "nft-split-block")}
          initialOpen>
          <SelectControl
            label={__("Aspect Ratio", "nft-split-block")}
            value={attributes.aspectRatio}
            options={ASPECT_RATIOS}
            onChange={(v) => setAttributes({ aspectRatio: v })}
          />
          <RangeControl
            label={__("Height (px)", "nft-split-block")}
            value={attributes.height}
            onChange={(v) => setAttributes({ height: v })}
            min={100}
            max={1200}
            step={10}
          />
        </PanelBody>

        <PanelBody title={__("Colors", "nft-split-block")} initialOpen>
          <BaseControl label={__("Background Color", "nft-split-block")}>
            <ToggleControl
              label={__("Invisible (transparent)", "nft-split-block")}
              checked={attributes.bgInvisible}
              onChange={(v) => setAttributes({ bgInvisible: v })}
            />
            {!attributes.bgInvisible && (
              <ColorPalette
                value={attributes.bgColor}
                onChange={(v) => setAttributes({ bgColor: v || "#c4a882" })}
                clearable={false}
              />
            )}
          </BaseControl>
          <BaseControl label={__("Shape Color", "nft-split-block")}>
            <ToggleControl
              label={__("Invisible (transparent)", "nft-split-block")}
              checked={attributes.shapeInvisible}
              onChange={(v) => setAttributes({ shapeInvisible: v })}
            />
            {!attributes.shapeInvisible && (
              <ColorPalette
                value={attributes.shapeColor}
                onChange={(v) => setAttributes({ shapeColor: v || "#1e3a4c" })}
                clearable={false}
              />
            )}
          </BaseControl>
        </PanelBody>

        <PanelBody title={__("Layout", "nft-split-block")} initialOpen={false}>
          <RangeControl
            label={__("Gap Size", "nft-split-block")}
            value={attributes.gap}
            onChange={(v) => setAttributes({ gap: v })}
            min={0}
            max={20}
            step={0.5}
          />
          <RangeControl
            label={__("Max Depth", "nft-split-block")}
            value={attributes.maxDepth}
            onChange={(v) => setAttributes({ maxDepth: v })}
            min={1}
            max={8}
            step={1}
          />
          <RangeControl
            label={__("Padding", "nft-split-block")}
            value={attributes.padding}
            onChange={(v) => setAttributes({ padding: v })}
            min={0}
            max={0.15}
            step={0.005}
          />
        </PanelBody>

        <PanelBody title={__("Curves", "nft-split-block")} initialOpen={false}>
          <RangeControl
            label={__("Curve Min", "nft-split-block")}
            value={attributes.curveMin}
            onChange={(v) => setAttributes({ curveMin: v })}
            min={0}
            max={0.5}
            step={0.01}
          />
          <RangeControl
            label={__("Curve Max", "nft-split-block")}
            value={attributes.curveMax}
            onChange={(v) => setAttributes({ curveMax: v })}
            min={0.1}
            max={1}
            step={0.01}
          />
          <RangeControl
            label={__("Curve Tightness", "nft-split-block")}
            value={attributes.curveTight}
            onChange={(v) => setAttributes({ curveTight: v })}
            min={0}
            max={0.5}
            step={0.01}
          />
          <ToggleControl
            label={__("Random Curves per Box", "nft-split-block")}
            checked={attributes.randomCurves}
            onChange={(v) => setAttributes({ randomCurves: v })}
          />
          <RangeControl
            label={__("4-Corner Chance", "nft-split-block")}
            value={attributes.allCornersChance}
            onChange={(v) => setAttributes({ allCornersChance: v })}
            min={0}
            max={1}
            step={0.01}
          />
        </PanelBody>

        <PanelBody
          title={__("Splitting", "nft-split-block")}
          initialOpen={false}>
          <RangeControl
            label={__("Split Probability", "nft-split-block")}
            value={attributes.splitBias}
            onChange={(v) => setAttributes({ splitBias: v })}
            min={0.2}
            max={1}
            step={0.01}
          />
          <RangeControl
            label={__("Split Ratio Min", "nft-split-block")}
            value={attributes.splitMin}
            onChange={(v) => setAttributes({ splitMin: v })}
            min={0.1}
            max={0.45}
            step={0.01}
          />
          <RangeControl
            label={__("Split Ratio Max", "nft-split-block")}
            value={attributes.splitMax}
            onChange={(v) => setAttributes({ splitMax: v })}
            min={0.55}
            max={0.9}
            step={0.01}
          />
          <RangeControl
            label={__("Depth Stagger", "nft-split-block")}
            value={attributes.depthDelay}
            onChange={(v) => setAttributes({ depthDelay: v })}
            min={0}
            max={0.3}
            step={0.01}
          />
        </PanelBody>

        <PanelBody
          title={__("Interaction", "nft-split-block")}
          initialOpen={false}>
          <RangeControl
            label={__("Ease Speed", "nft-split-block")}
            value={attributes.easeSpeed}
            onChange={(v) => setAttributes({ easeSpeed: v })}
            min={0.01}
            max={0.2}
            step={0.005}
          />
          <RangeControl
            label={__("Mouse Curve", "nft-split-block")}
            value={attributes.mousePower}
            onChange={(v) => setAttributes({ mousePower: v })}
            min={0.3}
            max={2}
            step={0.05}
          />
        </PanelBody>

        <PanelBody title={__("Pattern", "nft-split-block")} initialOpen={false}>
          <Button
            variant="secondary"
            onClick={() =>
              setAttributes({ seed: Math.floor(Math.random() * 2147483647) })
            }
            style={{ width: "100%", justifyContent: "center" }}>
            {__("Regenerate Pattern", "nft-split-block")}
          </Button>
        </PanelBody>
      </InspectorControls>

      <div {...blockProps}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: attributes.height + "px",
            maxWidth: attributes.height * ratio + "px",
            margin: "0 auto",
          }}>
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "100%",
              cursor: "crosshair",
              display: "block",
            }}
            onMouseMove={handleMouse}
            onMouseLeave={handleLeave}
          />
        </div>
      </div>
    </>
  );
}
