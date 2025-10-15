import { SVGProps } from "react"
import type { Environment } from "../../../src/config"
import { getEnvironmentColor } from "../utils/environmentColors"

/**
 * ClineLogoVariable component renders the Cline logo with automatic theme adaptation
 * and environment-based color indicators.
 *
 * This component uses VS Code theme variables for the fill color, with environment-specific colors:
 * - Local: yellow/orange (development/experimental)
 * - Staging: blue (stable testing)
 * - Production: gray/white (default icon color)
 *
 * @param {SVGProps<SVGSVGElement> & { environment?: Environment }} props - Standard SVG props plus optional environment
 * @returns {JSX.Element} SVG Cline logo that adapts to VS Code themes and environment
 */
const ClineLogoVariable = (props: SVGProps<SVGSVGElement> & { environment?: Environment }) => {
	const { environment, ...svgProps } = props

	// Determine fill color based on environment
	const fillColor = environment ? getEnvironmentColor(environment) : "var(--vscode-icon-foreground)"

	return (
		<svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<rect fill="url(#a)" height="20" rx="4" width="24" y="1" />
			<rect fill="url(#b)" height="1.5" rx=".75" width="12" x="6" y="21.5" />
			<g clip-path="url(#c)" fill={fillColor}>
				<path d="M12 7.5c-1.456 0-2.755.407-3.61 1.222a1.722 1.722 0 0 1-.09-.126 5.95 5.95 0 0 1-.39-.69 2.506 2.506 0 0 1-.053-.127c.094.023.207.04.33.032a.656.656 0 0 0 .556-.384.838.838 0 0 0 .071-.363 2.609 2.609 0 0 0-.096-.595c-.104-.405-.312-1.87-.439-2.178l-.925 1.426c.104.253.238.612.33.932a.76.76 0 0 0-.422.027c-.344.125-.457.43-.492.618-.071.39.063.782.193 1.07.136.302.272.418.272.418l.375.433.226.202c-.179.298-.317.628-.401.995a6.542 6.542 0 0 1-.612-.341 2.77 2.77 0 0 1-.1-.07.833.833 0 0 0 .245-.084.395.395 0 0 0 .198-.44.705.705 0 0 0-.13-.27 2.597 2.597 0 0 0-.361-.372c-.273-.24-1.143-1.167-1.383-1.335l.062 1.265c.197.138.467.339.69.526a.516.516 0 0 0-.28.154c-.178.196-.106.44-.037.578.143.287.43.51.663.664.244.161.397.196.397.196l.474.173.085.02c-.005.086-.013.169-.013.257 0 2.557 2.09 5.208 4.667 5.208s4.666-2.651 4.666-5.208C16.666 8.776 14.577 7.5 12 7.5Zm-3.244 6.854-.001-.003c-.701-.872-1.13-1.994-1.13-3.097 0-2.31 1.881-3.463 4.202-3.463 1.58 0 2.956.535 3.673 1.606-.755-.897-2.03-1.345-3.476-1.345-2.32 0-4.202 1.154-4.202 3.464 0 .995.35 2.006.933 2.835 0 0 0 .002.002.002ZM12 14.79c-1.966 0-3.864-1.662-3.864-3.332s1.899-1.3 3.864-1.3c1.966 0 3.864-.37 3.864 1.3S13.965 14.79 12 14.79Z" />
				<path d="M15.162 11.56c.164.417-.18.914-.769 1.11-.588.196-1.198.017-1.361-.4-.164-.417.165-.59.754-.786.588-.196 1.212-.342 1.376.076Zm-6.324 0c-.164.417.18.914.769 1.11.588.196 1.198.017 1.361-.4.164-.417-.165-.59-.754-.786-.588-.196-1.212-.342-1.376.076Z" />
			</g>
			<defs>
				<linearGradient gradientUnits="userSpaceOnUse" id="a" x1="0" x2="24" y1="11" y2="11">
					<stop stop-color="#E96384" />
					<stop offset="1" stop-color="#6333FF" />
				</linearGradient>
				<linearGradient gradientUnits="userSpaceOnUse" id="b" x1="6" x2="18" y1="22.25" y2="22.25">
					<stop stop-color="#E96384" />
					<stop offset="1" stop-color="#6333FF" />
				</linearGradient>
				<clipPath id="c">
					<path d="M5 4h14v14H5z" fill={fillColor} />
				</clipPath>
			</defs>
		</svg>
	)
}
export default ClineLogoVariable
