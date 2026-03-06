import { useEffect, useRef, useCallback } from "@wordpress/element";
import { InspectorControls, useBlockProps } from "@wordpress/block-editor";
import {
  PanelBody,
  RangeControl,
  ToggleControl,
  TextControl,
  Button,
  BaseControl,
} from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import { renderCanvas } from "./canvas-engine";

/** Parse "rgba(r,g,b,a)" or "#rrggbb" → { hex, alpha } */
function parseColor(str) {
  if (!str) return { hex: "#000000", alpha: 1 };
  const rgba = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgba) {
    const r = parseInt(rgba[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgba[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgba[3]).toString(16).padStart(2, "0");
    return {
      hex: `#${r}${g}${b}`,
      alpha: rgba[4] !== undefined ? parseFloat(rgba[4]) : 1,
    };
  }
  return { hex: str, alpha: 1 };
}

/** Build "rgba(r,g,b,a)" from hex + alpha */
function buildColor(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ColorControl({ label, value, onChange }) {
  const { hex, alpha } = parseColor(value);
  return (
    <BaseControl label={label}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}>
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(buildColor(e.target.value, alpha))}
          style={{
            width: 36,
            height: 28,
            border: "none",
            padding: 0,
            cursor: "pointer",
            background: "none",
          }}
        />
        <span style={{ fontSize: 11, color: "#757575" }}>{hex}</span>
      </div>
      <RangeControl
        label={__("Opacity", "nft-split-block")}
        value={Math.round(alpha * 100)}
        onChange={(v) => onChange(buildColor(hex, v / 100))}
        min={0}
        max={100}
        step={1}
      />
    </BaseControl>
  );
}

function parseRatio(str) {
  if (!str || !str.trim()) return null;
  const s = str.trim();
  // plain number e.g. "1" or "1.5" or "0.75"
  if (/^[\d.]+$/.test(s)) {
    const v = parseFloat(s);
    return isNaN(v) || v <= 0 ? null : v;
  }
  // "w:h" format e.g. "16:9"
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

export default function Edit({ attributes, setAttributes }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef({ mouseProgress: 0, targetProgress: 0, tree: null });

  const blockProps = useBlockProps({
    style: { position: "relative" },
  });

  const ratio = parseRatio(attributes.aspectRatio);
  const hasRatio = ratio !== null;

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
          <TextControl
            label={__("Aspect Ratio", "nft-split-block")}
            value={attributes.aspectRatio}
            placeholder="e.g. 16:9"
            help={__("Leave empty to use Height only.", "nft-split-block")}
            onChange={(v) => setAttributes({ aspectRatio: v })}
          />
          <RangeControl
            label={__("Height (px)", "nft-split-block")}
            value={attributes.height}
            onChange={(v) => setAttributes({ height: v })}
            min={100}
            max={1200}
            step={10}
            disabled={hasRatio}
            help={
              hasRatio
                ? __("Controlled by Aspect Ratio.", "nft-split-block")
                : undefined
            }
          />
        </PanelBody>

        <PanelBody title={__("Colors", "nft-split-block")} initialOpen>
          <ColorControl
            label={__("Background Color", "nft-split-block")}
            value={attributes.bgColor}
            onChange={(v) => setAttributes({ bgColor: v })}
          />
          <ColorControl
            label={__("Shape Color", "nft-split-block")}
            value={attributes.shapeColor}
            onChange={(v) => setAttributes({ shapeColor: v })}
          />
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
            maxWidth: hasRatio ? attributes.height * ratio + "px" : "100%",
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
