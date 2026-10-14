import React from 'react';
import { SvgXml } from 'react-native-svg';
import { SvgXmls } from '../../assets/icons/svgData';

/**
 * SvgIcon component that renders vector SVG icons using react-native-svg
 *
 * Props:
 * - name: string (e.g. 'order_complete', 'return_delivery', 'location', 'call', etc.)
 * - width: number (default: 24)
 * - height: number (default: 24)
 * - color: string (optional override for fill/stroke)
 * - style: object
 */
const SvgIcon = ({ name, width = 24, height = 24, color, style }) => {
  const normalizedName = name?.replace(/-/g, '_');
  const xml = SvgXmls[normalizedName];

  if (!xml) {
    return null;
  }

  let finalXml = xml;
  if (color) {
    // If color prop passed, replace common fill/stroke hex codes or currentColor
    finalXml = finalXml
      .replace(/fill="#[A-Fa-f0-9]{6}"/g, `fill="${color}"`)
      .replace(/stroke="#[A-Fa-f0-9]{6}"/g, `stroke="${color}"`);
  }

  return <SvgXml xml={finalXml} width={width} height={height} style={style} />;
};

export default SvgIcon;
export { SvgXmls };
