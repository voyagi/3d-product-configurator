/**
 * Studio lighting setup for the Aura lamp configurator.
 * Warm key light + cool fill + HDRI environment for glass/transmission reflections.
 * The Environment is invisible (background=false) but critical for MeshTransmissionMaterial.
 */

import { Environment } from "@react-three/drei";

export function Lighting() {
	return (
		<>
			{/* HDRI environment - provides reflections for MeshTransmissionMaterial */}
			{/* background=false keeps the cream canvas background visible */}
			<Environment preset="studio" background={false} />

			{/* Key light - warm ~4500K, upper-right front, main illumination */}
			<directionalLight
				position={[2, 3, 2]}
				intensity={2.0}
				color="#fff5e0"
				castShadow={false}
			/>

			{/* Fill light - cool daylight blue, left-rear, softens shadows */}
			<directionalLight
				position={[-2, 1, -1]}
				intensity={0.4}
				color="#e0f0ff"
			/>

			{/* Ambient - base illumination to prevent pure-black shadows */}
			<ambientLight intensity={0.3} />
		</>
	);
}
