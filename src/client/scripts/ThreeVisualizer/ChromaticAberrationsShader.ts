/**
 * Film grain & scanlines shader
 *
 * - ported from HLSL to WebGL / GLSL
 * https://web.archive.org/web/20210226214859/http://www.truevision3d.com/forums/showcase/staticnoise_colorblackwhite_scanline_shaders-t18698.0.html
 *
 * Screen Space Static Postprocessor
 *
 * Produces an analogue noise overlay similar to a film grain / TV static
 *
 * Original implementation and noise algorithm
 * Pat 'Hawthorne' Shearon
 *
 * Optimized scanlines + noise version with intensity scaling
 * Georg 'Leviathan' Steinrohder
 *
 * This version is provided under a Creative Commons Attribution 3.0 License
 * http://creativecommons.org/licenses/by/3.0/
 */

const ChromaticAberrationsShader = {

	name: 'ChromaticAberrationsShader',
	uniforms: {
		'tDiffuse': { value: null },
        'u_rgbSplitLength': { value: 0.05 },
        // 'u_rgbSplitDistFromCenter': { value: 1.0 },
        'u_rgbSplitBlurSize': { value: 0.0 },
        'u_redChannelOut': { value: false },
	},
	vertexShader: `
		varying vec2 vUv;

		void main() 
        {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
    `,
	fragmentShader: `
		#include <common>

		uniform sampler2D tDiffuse;
        uniform float u_rgbSplitLength;
        // uniform float u_rgbSplitDistFromCenter;
        uniform float u_rgbSplitBlurSize;
        uniform bool u_redChannelOut;

		varying vec2 vUv;

		void main() 
        {
            vec2 splitDir = (vUv - vec2(0.5)) * 2.0;
            float splitLength = u_rgbSplitLength * length(splitDir);
            splitDir = normalize(splitDir);
            vec2 splitValue = splitLength * splitDir;
        
            float splitDirection = -1.0;
            if(u_redChannelOut)
                splitDirection *= -1.0;

            vec3 rgbSplitColor = vec3(texture2D(tDiffuse, vUv - splitDirection * splitValue * 0.1).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + splitDirection * splitValue * 0.1).b);

            rgbSplitColor += vec3(  texture2D(tDiffuse, vUv + vec2(0.0, 0.01 * u_rgbSplitBlurSize) - splitDirection * splitValue * 0.1).r, 
                                    texture2D(tDiffuse, vUv + vec2(0.0, 0.01 * u_rgbSplitBlurSize)).g, 
                                    texture2D(tDiffuse, vUv + vec2(0.0, 0.01 * u_rgbSplitBlurSize) + splitDirection * splitValue * 0.1).b);

            rgbSplitColor += vec3(  texture2D(tDiffuse, vUv - vec2(0.0, 0.01 * u_rgbSplitBlurSize) - splitDirection * splitValue * 0.1).r, 
                                    texture2D(tDiffuse, vUv - vec2(0.0, 0.01 * u_rgbSplitBlurSize)).g, 
                                    texture2D(tDiffuse, vUv - vec2(0.0, 0.01 * u_rgbSplitBlurSize) + splitDirection * splitValue * 0.1).b);

            rgbSplitColor += vec3(  texture2D(tDiffuse, vUv + vec2(0.01 * u_rgbSplitBlurSize, 0.0) - splitDirection * splitValue * 0.1).r, 
                                    texture2D(tDiffuse, vUv + vec2(0.01 * u_rgbSplitBlurSize, 0.0)).g, 
                                    texture2D(tDiffuse, vUv + vec2(0.01 * u_rgbSplitBlurSize, 0.0) + splitDirection * splitValue * 0.1).b);

            rgbSplitColor += vec3(  texture2D(tDiffuse, vUv - vec2(0.01 * u_rgbSplitBlurSize, 0.0) - splitDirection * splitValue * 0.1).r, 
                                    texture2D(tDiffuse, vUv - vec2(0.01 * u_rgbSplitBlurSize, 0.0)).g, 
                                    texture2D(tDiffuse, vUv - vec2(0.01 * u_rgbSplitBlurSize, 0.0) + splitDirection * splitValue * 0.1).b);
            rgbSplitColor = rgbSplitColor / 5.0;

            vec3 colorOut = pow(rgbSplitColor, vec3(1.0 / 2.2));
			gl_FragColor =  vec4( colorOut, 1.0 );
		}
    `,
};

export { ChromaticAberrationsShader };
