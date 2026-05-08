import { Color, DoubleSide, Matrix4, ShaderMaterial, Texture, Vector2, Vector3 } from "three";

export declare type WaterMaterialUniforms = {
    u_DepthTex: { value: Texture | null },

    u_ViewportSize: { value: Vector2 },
    u_CameraNear: { value: number },
    u_CameraFar: { value: number },
    u_CameraPos: { value: Vector3 },
    u_InverseViewMatrix: { value: Matrix4 },

    u_FarColor: { value: Color },
    u_MidColor: { value: Color },
    u_ShoreColor: { value: Color },

    u_LightDir: { value: Vector3 },
    u_AmbientIntensity: { value: number },
    u_LightIntensity: { value: number },
    u_LightColor: { value: Color },
    u_FresnelColor: { value: Color },
    u_FresnelColorIntensity: { value: number },
    u_EnvironmentIntensity: { value: number },

    u_WaveCount: { value: number },
    u_WaveSteepness: { value: number },
    u_WaveAmplitude: { value: number },
    u_WaveFrequency: { value: number },
    u_WaveSpeed: { value: number },

    u_FoamDistance: { value: number },
    u_FoamOpacity: { value: number },
    u_FoamColor: { value: Color },

    u_WaveRotationFactor: { value: number },
    u_WaveSteepnessMultiplier: { value: number },

    u_Time: { value: number },

    u_WaterNormal: { value: Texture | null },
    u_SkyTexture: { value: Texture | null }
}

export class WaterMaterial
{
    public static createMaterial(uniforms: WaterMaterialUniforms)
    {
        return new ShaderMaterial({
            vertexShader: waterVert,
            fragmentShader: waterFrag,
            uniforms: uniforms,
            side: DoubleSide,
            transparent: true
        });
    }
}

const waterVert = `
precision highp float;

#define PI 3.14159265359

attribute vec4 tangent;

varying vec2 v_UV;
varying vec3 v_WorldPos;
varying vec3 v_NormalW;
varying float v_Height;

uniform float u_Time;
uniform int u_WaveCount;
uniform float u_WaveSteepness;
uniform float u_WaveAmplitude;
uniform float u_WaveFrequency;
uniform float u_WaveSpeed;

uniform float u_WaveRotationFactor;
uniform float u_WaveSteepnessMultiplier;

vec3 gerstnerSum(vec3 position, float time, int numWaves, float amplitude, float frequency, float speed, float steepness, out float height01, out vec3 normal)
{
    vec3 displacement = vec3(0.0);
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 bitangent = vec3(0.0, 0.0, 1.0);

    for (int index = 0; index < numWaves; index++)
    {
        float flIndex = float(index);
        vec2 dir = normalize(vec2(cos(flIndex * u_WaveRotationFactor), sin(flIndex * 1.3)));

        float k = 2.0 * PI / frequency;
        float phase = k * dot(dir, position.xz) - speed * time;

        float cosPhase = cos(phase);
        float sinPhase = sin(phase);

        float Q = steepness / (k * amplitude * float(numWaves));
        float QA = Q * amplitude;

        displacement += vec3(QA * dir.x * cosPhase, amplitude * sinPhase, QA * dir.y * cosPhase);
        tangent += vec3(-QA * k * dir.x * dir.x * sinPhase, amplitude * k * dir.x * cosPhase, -QA * k * dir.x * dir.y * sinPhase);
        bitangent += vec3(-QA * k * dir.x * dir.y * sinPhase, amplitude * k * dir.y * cosPhase, -QA * k * dir.y * dir.y * sinPhase);

        amplitude *= 0.75;
        frequency *= 0.65;
        speed *= 0.8;
        steepness *= u_WaveSteepnessMultiplier;
    }

    height01 = clamp(displacement.y * 0.5 + 0.5, 0.0, 1.0);
    normal = normalize(cross(bitangent, tangent));
    return position + displacement;
}

void main()
{
    vec3 pos = position;

    //Gerstner waves
    vec3 norm;
    pos = gerstnerSum(pos, u_Time, u_WaveCount, u_WaveAmplitude, u_WaveFrequency, u_WaveSpeed, u_WaveSteepness, v_Height, norm);

    mat3 customNormalMat = mat3(transpose(inverse(modelMatrix)));
    v_NormalW = normalize(customNormalMat * norm);

    //Output
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    v_UV = uv;
    v_WorldPos = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const waterFrag = `
precision highp float;

#define PI 3.14159265359

varying vec2 v_UV;
varying vec3 v_WorldPos;
varying vec3 v_NormalW;
varying float v_Height;

//Camera
uniform sampler2D u_DepthTex;
uniform vec2 u_ViewportSize;
uniform float u_CameraNear;
uniform float u_CameraFar;
uniform vec3 u_CameraPos;
uniform mat4 u_InverseViewMatrix;

//Colors
uniform vec3 u_FarColor;
uniform vec3 u_MidColor;
uniform vec3 u_ShoreColor;

//Lighting
uniform vec3 u_LightDir;
uniform float u_AmbientIntensity;
uniform float u_LightIntensity;
uniform vec3 u_LightColor;
uniform vec3 u_FresnelColor;
uniform float u_FresnelColorIntensity;
uniform float u_EnvironmentIntensity;

//Foam
uniform float u_FoamDistance;
uniform float u_FoamOpacity;
uniform vec3 u_FoamColor;

//Water behavior
uniform float u_Time;

uniform sampler2D u_WaterNormal;
uniform sampler2D u_SkyTexture;


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

float linearizeDepth(float depth, float near, float far)
{
    float z = depth * 2.0 - 1.0; // back to NDC
    return (2.0 * near * far) / (far + near - z * (far - near));
}

vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(max(1.0 - cosTheta, 0.0), 5.0);
}  

vec3 pbrLighting(vec3 unlitColor, vec3 lightDir, float ambientIntensity, vec3 lightColor, float lightIntensity)
{
    vec3 V = normalize(u_CameraPos - v_WorldPos.xyz);
    vec3 L = normalize(-lightDir);
    vec3 H = normalize(V + L);

    float HdotV = max(dot(H, V), 0.0);

    vec3 F0 = vec3(0.04);
    vec3 F = fresnelSchlick(HdotV, F0);
    vec3 kD = vec3(1.0) - F;

    vec3 diffuse = kD * unlitColor / PI;
    vec3 ambient = vec3(ambientIntensity) * unlitColor;

    return ambient + diffuse * lightIntensity;
}

vec2 dirToUV(vec3 dir)
{
    dir = normalize(dir);

    float u = atan(-dir.z, dir.x) / (2.0 * PI) + 0.5;
    float v = acos(clamp(dir.y, -1.0, 1.0)) / PI;

    return vec2(u, v);
}


void main()
{
    vec3 colorOut = vec3(1.0);
    float alpha = 1.0;
    vec2 screenUV = gl_FragCoord.xy / u_ViewportSize;

    //Distort objects only if they are underwater
    vec2 distortion = v_NormalW.xz * 0.02;
    float distortedDepth = texture(u_DepthTex, screenUV + distortion).r;
    if(gl_FragCoord.z > distortedDepth)
        distortion = vec2(0.0);

    float depthTex = 1.0 - readDepth(u_DepthTex, screenUV + distortion, u_CameraNear, u_CameraFar);
    depthTex += mix(-0.0025, 0.0025, random(screenUV)); //Add dithering to reduce color banding

    colorOut = mix(u_FarColor, u_MidColor, smoothstep(0.5, 0.9, depthTex));
    colorOut = mix(colorOut, u_ShoreColor, smoothstep(0.9, 1.0, depthTex));

    vec3 topWaveColor = mix(colorOut, vec3(1.0), 0.15);
    colorOut = mix(colorOut, topWaveColor, v_Height); //Color based on Wave height

    //Fresnel
    vec3 V = normalize(u_CameraPos - v_WorldPos.xyz);
    float fresnel = pow(1.0 - max(dot(V, v_NormalW), 0.0), 5.0);
    fresnel = clamp(fresnel, 0.0, 1.0);
    colorOut = mix(colorOut, u_FresnelColor, fresnel * u_FresnelColorIntensity);
    
    //PBR
    vec3 pbr = pbrLighting(colorOut, u_LightDir, u_AmbientIntensity, u_LightColor, u_LightIntensity);

    //Reflection & Refraction
    vec3 reflectedDir = reflect(-V, v_NormalW);
    vec2 reflectedUV = dirToUV(reflectedDir);
    vec3 reflectedColor = texture2D(u_SkyTexture, reflectedUV).rgb;

    vec3 refractedDir = refract(-V, v_NormalW, 0.75);
    vec2 refractUV = dirToUV(refractedDir);
    vec3 refractedColor = texture2D(u_SkyTexture, refractUV).rgb;

    vec3 envColor = mix(refractedColor, reflectedColor, fresnel);

    pbr = mix(pbr, envColor, u_EnvironmentIntensity);

    float alphaMask = smoothstep(0.8, 1.0, depthTex);
    alpha = mix(1.0, 0.65, alphaMask);


    //Foam
    vec3 viewPos = (u_InverseViewMatrix * vec4(v_WorldPos, 1.0)).xyz;
    float waterDepth = -viewPos.z;
    float sceneDepth = linearizeDepth(texture(u_DepthTex, screenUV).r, u_CameraNear, u_CameraFar);

    float foamMask = 1.0 - (sceneDepth * (1.0 - u_FoamDistance) - waterDepth);
    foamMask *= u_FoamOpacity;
    foamMask = clamp(foamMask, 0.0, 1.0);

    pbr = mix(pbr, u_FoamColor, foamMask);
    alpha = mix(alpha, 1.0, foamMask);

    pbr += mix(-vec3(0.5 / 255.0), vec3(0.5 / 255.0), random(screenUV));

    pbr = pow(pbr, vec3(2.2)); //Gamma correction

    gl_FragColor = vec4(pbr, alpha);
}
`;