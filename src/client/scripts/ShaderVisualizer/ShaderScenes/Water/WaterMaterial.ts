import { Color, DoubleSide, ShaderMaterial, Texture, Vector2, Vector3 } from "three";

export declare type WaterMaterialUniforms = {
    u_DepthTex: { value: Texture | null },
    u_ViewportSize: { value: Vector2 }
    u_CameraNear: { value: number },
    u_CameraFar: { value: number },

    u_FarColor: { value: Color },
    u_MidColor: { value: Color },
    u_ShoreColor: { value: Color },

    u_CameraPos: { value: Vector3 },

    u_LightDir: { value: Vector3 },
    u_Roughness: { value: number },
    u_AmbientIntensity: { value: number },
    u_LightIntensity: { value: number },
    u_LightColor: { value: Color },
    u_SpecularIntensity: { value: number },
    u_SpecularColor: { value: Color },

    u_WaveCount: { value: number },
    u_WaveSteepness: { value: number },
    u_WaveAmplitude: { value: number },
    u_WaveFrequency: { value: number },
    u_WaveSpeed: { value: number },

    u_Time: { value: number },
    u_WaterNormalSpeed1: { value: number },
    u_WaterNormalSpeed2: { value: number },
    u_WaterNormalTiling1: { value: number },
    u_WaterNormalTiling2: { value: number },

    u_WaterNormal: { value: Texture | null }
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

/*

- water lighting
- foam around objects
- fractals or however they are called
- scene fog for horizontal line
- underwater color
- underwater fog
- underwater fractals on the sand for areas close to the water surface
- scene shadow for palm trees

*/

const waterVert = `
#define PI 3.14159265359

attribute vec4 tangent;

varying vec2 v_UV;
varying vec3 v_WorldPos;
varying vec3 v_NormalW;
varying float v_Height;

varying mat3 v_TNB;

uniform float u_Time;
uniform int u_WaveCount;
uniform float u_WaveSteepness;
uniform float u_WaveAmplitude;
uniform float u_WaveFrequency;
uniform float u_WaveSpeed;

vec3 gerstnerSum(vec3 position, float time, int numWaves, float amplitude, float frequency, float speed, float steepness, out float height01)
{
    vec3 displacement = vec3(0.0);

    for (int index = 0; index < numWaves; index++)
    {
        float flIndex = float(index);
        vec2 dir = normalize(vec2(cos(flIndex * 1.7), sin(flIndex * 1.3)));

        float k = 2.0 * PI / frequency;
        float phase = k * dot(dir, position.xz) - speed * time;

        float cosPhase = cos(phase);
        float sinPhase = sin(phase);

        float Q = steepness / (k * amplitude * float(numWaves));
        float QA = Q * amplitude;
        displacement += vec3(QA * dir.x * cosPhase, amplitude * sinPhase, QA * dir.y * cosPhase);

        amplitude *= 0.75;
        frequency *= 0.65;
        speed *= 0.8;
        steepness *= 0.75;
    }

    height01 = clamp(displacement.y * 0.5 + 0.5, 0.0, 1.0);
    return position + displacement;
}

void main()
{
    vec3 pos = position;

    //Gerstner waves
    pos = gerstnerSum(pos, u_Time, u_WaveCount, u_WaveAmplitude, u_WaveFrequency, u_WaveSpeed, u_WaveSteepness, v_Height);

    //TNB
    vec3 T = normalize(normalMatrix * tangent.xyz);
    vec3 N = normalize(normalMatrix * normal);
    vec3 B = cross(N, T) * tangent.w;
    v_TNB = mat3(T, B, N);

    //Output
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    v_UV = uv;
    v_WorldPos = worldPos.xyz;
    v_NormalW = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const waterFrag = `
#define PI 3.14159265359

varying vec2 v_UV;
varying vec3 v_WorldPos;
varying vec3 v_NormalW;
varying float v_Height;
varying mat3 v_TNB;

//Camera
uniform sampler2D u_DepthTex;
uniform vec2 u_ViewportSize;
uniform float u_CameraNear;
uniform float u_CameraFar;
uniform vec3 u_CameraPos;

//Colors
uniform vec3 u_FarColor;
uniform vec3 u_MidColor;
uniform vec3 u_ShoreColor;

//Lighting
uniform vec3 u_LightDir;
uniform float u_Roughness;
uniform float u_AmbientIntensity;
uniform float u_LightIntensity;
uniform vec3 u_LightColor;
uniform float u_SpecularIntensity;
uniform vec3 u_SpecularColor;

//Water behavior
uniform float u_Time;
uniform float u_WaterNormalSpeed1;
uniform float u_WaterNormalSpeed2;
uniform float u_WaterNormalTiling1;
uniform float u_WaterNormalTiling2;

uniform sampler2D u_WaterNormal;


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

// PBR shader from: https://learnopengl.com/PBR/Lighting
float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    float a      = roughness * roughness;
    float a2     = a * a;
    float NdotH  = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
	
    float num   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
	
    return num / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float num   = NdotV;
    float denom = NdotV * (1.0 - k) + k;
	
    return num / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2  = GeometrySchlickGGX(NdotV, roughness);
    float ggx1  = GeometrySchlickGGX(NdotL, roughness);
	
    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(max(1.0 - cosTheta, 0.0), 5.0);
}  

vec3 pbrLighting(vec3 unlitColor, vec3 lightDir, float metallic, float roughness, float ambientIntensity, vec3 specularColor, float specularIntensity, vec3 lightColor, float lightIntensity)
{
    vec3 V = normalize(u_CameraPos - v_WorldPos.xyz);
    vec3 N = normalize(v_NormalW);

    vec3 F0 = vec3(0.04); 
    F0 = mix(F0, unlitColor, metallic);

    // reflectance equation
    vec3 Lo = vec3(0.0);

    // calculate per-light radiance
    vec3 L = normalize(-lightDir);
    vec3 H = normalize(V + L);
    vec3 radiance = lightColor;

    // cook-torrance brdf
    float NDF = DistributionGGX(N, H, roughness);
    float G   = GeometrySmith(N, V, L, roughness);
    vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);

    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metallic;

    vec3 nominator    = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001; // + 0.0001 to prevent divide by zero
    vec3 specular = nominator / denominator;

    // add to outgoing radiance Lo
    float NdotL = max(dot(N, L), 0.0);

    vec3 color = mix(unlitColor, specularColor, 0.1);
    Lo += (kD * unlitColor / PI + specular * color * specularIntensity * 0.0125) * radiance * NdotL;

    vec3 ambient = vec3(ambientIntensity) * unlitColor;
    return ambient + Lo * lightIntensity;
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

    vec3 topWaveColor = mix(colorOut, vec3(1.0), 0.25);
    colorOut = mix(colorOut, topWaveColor, v_Height);

    vec3 pbr = pbrLighting(colorOut, u_LightDir, 0.0, u_Roughness, u_AmbientIntensity, u_SpecularColor, u_SpecularIntensity, u_LightColor, u_LightIntensity);

    gl_FragColor = vec4(pbr, alpha);
}
`;