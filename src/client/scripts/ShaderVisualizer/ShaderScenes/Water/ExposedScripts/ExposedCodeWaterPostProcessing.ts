export const exposedCodeWaterPostProcessingVert = `
varying vec2 v_UV;

void main()
{
    v_UV = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const exposedCodeWaterPostProcessingFrag = `
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

//Sample the depth texture in shuch a way that 0 is the near plane and 1.0 is the far plane
float sampleDepth01(sampler2D depthSampler, vec2 coord, float near, float far)
{
	float fragCoordZ = texture2D(depthSampler, coord).x;
	float viewZ = (near * far) / ((far - near) * fragCoordZ - far);
	return (viewZ + near) / (near - far);
}

void main()
{
    vec3 sceneColor = texture(u_DiffuseTex, v_UV).rgb;
    float depthTex = 1.0 - sampleDepth01(u_DepthTex, v_UV, u_CameraNear, u_CameraFar);
    depthTex += mix(-0.003, 0.003, random(v_UV)); //Apply dithering to reduce color banding

    //Gamma correction
    sceneColor = pow(sceneColor, vec3(0.4545)); //0.4545 = 1.0 / 2.2

    if(u_IsUnderwater)
    {
        vec3 underwaterColor = mix(u_FarColor, u_MidColor, smoothstep(0.5, 0.85, depthTex));
        underwaterColor = mix(underwaterColor, u_NearColor, smoothstep(0.85, 1.0, depthTex));

        sceneColor = mix(sceneColor, underwaterColor, 1.0 - smoothstep(0.935, 1.0, depthTex) * 0.5);
    }

    gl_FragColor = vec4(sceneColor, 1.0);
}
`;