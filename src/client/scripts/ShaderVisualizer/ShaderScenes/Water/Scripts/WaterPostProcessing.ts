import { Box3, Color, DoubleSide, Matrix4, ShaderMaterial, Texture, Vector3 } from "three"

export declare type WaterPostProcessingParams = {
    u_CameraNear: { value: number },
    u_CameraFar: { value: number },
    u_CameraPos: { value: Vector3 },

    u_IsUnderwater: { value: boolean },
    
    u_FarColor: { value: Color },
    u_MidColor: { value: Color },
    u_NearColor: { value: Color },

    u_DiffuseTex: { value: Texture | null },
    u_DepthTex: { value: Texture | null },
}

export class WaterPostProcessing
{
    public static createPass(params: WaterPostProcessingParams): ShaderMaterial
    {
        return new ShaderMaterial({
            uniforms: params,
            vertexShader: waterPostProcessingVert,
            fragmentShader: waterPostProcessingFrag,
            side: DoubleSide
        });
    }
}

const waterPostProcessingVert = `
varying vec2 v_UV;

void main()
{
    v_UV = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const waterPostProcessingFrag = `
varying vec2 v_UV;

uniform float u_CameraNear;
uniform float u_CameraFar;
uniform vec3 u_CameraPos;

uniform bool u_IsUnderwater;

uniform vec3 u_FarColor;
uniform vec3 u_MidColor;
uniform vec3 u_NearColor;

uniform sampler2D u_DiffuseTex;
uniform sampler2D u_DepthTex;

float random(vec2 n)
{ 
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
    vec3 sceneColor = texture(u_DiffuseTex, v_UV).rgb;
    float depthTex = 1.0 - readDepth(u_DepthTex, v_UV, u_CameraNear, u_CameraFar);
    depthTex += mix(-0.5 / 255.0, 0.5 / 255.0, random(v_UV));

    sceneColor = pow(sceneColor, vec3(1.0 / 2.2));
    // sceneColor = vec3(depthTex);

    if(u_IsUnderwater)
    {
        vec3 underwaterColor = mix(u_FarColor, u_MidColor, smoothstep(0.5, 0.85, depthTex));
        underwaterColor = mix(underwaterColor, u_NearColor, smoothstep(0.85, 1.0, depthTex));

        sceneColor = mix(sceneColor, underwaterColor, 1.0 - smoothstep(0.935, 1.0, depthTex) * 0.5);
    }
        
    sceneColor += mix(-vec3(0.5 / 255.0), vec3(0.5 / 255.0), random(v_UV));

    gl_FragColor = vec4(sceneColor, 1.0);
}
`;