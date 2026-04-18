import { Color, DoubleSide, ShaderMaterial, Texture, Vector2 } from "three";

export declare type WaterMaterialUniforms = {
    u_DepthTex: { value: Texture | null },
    u_ViewportSize: { value: Vector2 }
    u_CameraNear: { value: number },
    u_CameraFar: { value: number },

    u_FarColor: { value: Color },
    u_MidColor: { value: Color },
    u_ShoreColor: { value: Color }
}

export class WaterMaterial
{
    public static createMaterial(uniforms: WaterMaterialUniforms)
    {
        return new ShaderMaterial({
            vertexShader: waterVert,
            fragmentShader: waterFrag,
            uniforms: uniforms,
            side: DoubleSide
        });
    }
}

const waterVert = `
varying vec2 v_uv;

void main()
{
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const waterFrag = `
varying vec2 v_uv;

uniform sampler2D u_DepthTex;
uniform vec2 u_ViewportSize;
uniform float u_CameraNear;
uniform float u_CameraFar;

uniform vec3 u_FarColor;
uniform vec3 u_MidColor;
uniform vec3 u_ShoreColor;

float random(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float readDepth(sampler2D depthSampler, vec2 coord, float near, float far)
{
	float fragCoordZ = texture2D(depthSampler, coord).x;
	float viewZ = (near * far) / ((far - near) * fragCoordZ - far);
	return (viewZ + near) / (near - far);
}

void main()
{
    vec3 colorOut = vec3(1.0);
    float alpha = 1.0;
    vec2 screenUV = gl_FragCoord.xy / u_ViewportSize;

    float depthTex = 1.0 - readDepth(u_DepthTex, screenUV, u_CameraNear, u_CameraFar);
    depthTex += mix(-0.0025, 0.0025, random(screenUV)); //Add dithering to reduce color banding

    colorOut = mix(u_FarColor, u_MidColor, smoothstep(0.5, 0.9, depthTex));
    colorOut = mix(colorOut, u_ShoreColor, smoothstep(0.9, 1.0, depthTex));
    // colorOut = vec3(depthTex);

    gl_FragColor = vec4(colorOut, alpha);
}
`;