import { Box3, Color, Matrix4, ShaderMaterial, Vector3 } from "three"

export declare type VolumetricCloudsParams = {
    cameraPos: Vector3,
    cameraForward: Vector3,
    containerBounds: Box3,
    invProjMatrix: Matrix4,
    invViewMat: Matrix4,

    noiseScale: { value: number },
    noiseOctaves: { value: number },
    noisePersistance: { value: number },
    detailNoiseWeight: { value: number },

    cloudOffset: { value: Vector3 },
    cloudScale: { value: number },
    densityThreshold: { value: number },
    densityMultiplier: { value: number },
    numSteps: { value: number },

    lightColor: { value: Color },
    lightPos: { value: Vector3 },

    lightStep: { value: number },
    lightAbsorb: { value: number },

    lightAbsorptionThroughCloud: { value: number },
    lightAbsorptionTowardSun: { value: number },
    darknessThreshold: { value: number }
}

export class VolumetricCloudsPostProcessing
{
    public static createPass(params: VolumetricCloudsParams): ShaderMaterial
    {
        return new ShaderMaterial({
            uniforms: {
                u_mainSceneTex: { value: null },
                u_depthTex: { value: null },
                u_cameraPos: { value: params.cameraPos },
                u_cameraForward: { value: params.cameraForward },
                u_boundsMin: { value: params.containerBounds.min },
                u_boundsMax: { value: params.containerBounds.max },

                u_lightColor: params.lightColor,
                u_lightPos: params.lightPos,

                u_lightStep: params.lightStep,
                u_lightAbsorb: params.lightAbsorb,

                u_lightAbsorptionThroughCloud: params.lightAbsorptionThroughCloud,
                u_lightAbsorptionTowardSun: params.lightAbsorptionTowardSun,
                u_darknessThreshold: params.darknessThreshold,

                u_noiseScale: params.noiseScale,
                u_noiseOctaves: params.noiseOctaves,
                u_noisePersistance: params.noisePersistance,
                u_detailNoiseWeight: params.detailNoiseWeight,

                u_cloudOffset: params.cloudOffset,
                u_cloudScale: params.cloudScale,
                u_densityThreshold: params.densityThreshold,
                u_densityMultiplier: params.densityMultiplier,
                u_numSteps: params.numSteps,

                u_invProjMat: { value: params.invProjMatrix },
                u_invViewMat: { value: params.invViewMat }
            },
            vertexShader: volumetricCloudsVert,
            fragmentShader: volumetricCloudsFrag
        });
    }
}

const volumetricCloudsVert = `
varying vec2 v_uv;

void main()
{
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const volumetricCloudsFrag = `
varying vec2 v_uv;

uniform sampler2D u_mainSceneTex;
uniform sampler2D u_depthTex;

uniform vec3 u_cameraPos;
uniform vec3 u_cameraForward;
uniform vec3 u_boundsMin;
uniform vec3 u_boundsMax;

uniform float u_noiseScale;
uniform int u_noiseOctaves;
uniform float u_noisePersistance;
uniform float u_detailNoiseWeight;

uniform vec3 u_lightColor;
uniform vec3 u_lightPos;

uniform int u_lightStep;
uniform float u_lightAbsorb;

uniform float u_lightAbsorptionThroughCloud;
uniform float u_lightAbsorptionTowardSun;
uniform float u_darknessThreshold;

uniform vec3 u_cloudOffset;
uniform float u_cloudScale;
uniform float u_densityThreshold;
uniform float u_densityMultiplier;
uniform int u_numSteps;

uniform mat4 u_invProjMat;
uniform mat4 u_invViewMat;


vec3 getViewDir(vec2 uv)
{
    vec4 clip = vec4(uv * 2.0 - 1.0, -1.0, 1.0);
    vec4 view = u_invProjMat * clip;
    view /= view.w;

    vec3 worldDir = normalize((u_invViewMat * vec4(view.xyz, 0.0)).xyz);
    return worldDir;
}

vec2 rayBoxDist(vec3 boundsMin, vec3 boundsMax, vec3 rayOrigin, vec3 invRayDir)
{
    vec3 t0 = (boundsMin - rayOrigin) * invRayDir;
    vec3 t1 = (boundsMax - rayOrigin) * invRayDir;
    vec3 tmin = min(t0, t1);
    vec3 tmax = max(t0, t1);

    float dstA = max(max(tmin.x, tmin.y), tmin.z);
    float dstB = min(tmax.x, min(tmax.y, tmax.z));

    // Case 1: ray intersects box from outside (0 <= dstA <= dstB)
    // dstA is distance to nearest intersection, dstB is distance to far intersection

    // Case 2: ray intersects box from inside (stA < 0 < dstB)
    // dstA is the distance to intersection behind the ray, dstB is the distance to forward intersection

    // Case 3: ray misses box (dstA > dst B)

    float dstToBox = max(0.0, dstA);
    float dstInsideBox = max(0.0, dstB - dstToBox);
    return vec2(dstToBox, dstInsideBox);
}

float rayBoxDistInside(vec3 boundsMin, vec3 boundsMax, vec3 rayOrigin, vec3 rayDir)
{
    vec3 safeDir = sign(rayDir) * max(abs(rayDir), vec3(1e-4));
    vec3 invDir = 1.0 / safeDir;

    vec3 t0 = (boundsMin - rayOrigin) * invDir;
    vec3 t1 = (boundsMax - rayOrigin) * invDir;
    vec3 tmax = max(t0, t1);

    // We are inside → exit distance is smallest positive t
    float distInsideBox = min(tmax.x, min(tmax.y, tmax.z));
    distInsideBox = max(0.0, distInsideBox);
    distInsideBox = min(distInsideBox, length(u_boundsMax - u_boundsMin));
    return distInsideBox;
}

//Worley noise from @hong1991: https://www.shadertoy.com/view/3d3fWN
vec3 hash33(vec3 p3)
{
	vec3 p = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
    p += dot(p, p.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3((p.x + p.y) * p.z, (p.x + p.z) * p.y, (p.y + p.z) * p.x));
}
float worley(vec3 p, float scale)
{
    vec3 id = floor(p * scale);
    vec3 fd = fract(p * scale);

    float n = 0.0;
    float minimalDist = 1.0;

    for(float x = -1.0; x <=1.0; x++)
    {
        for(float y = -1.0; y <=1.0; y++)
        {
            for(float z = -1.0; z <=1.0; z++)
            {
                vec3 coord = vec3(x, y, z);
                vec3 rId = hash33(mod(id + coord, scale)) * 0.5 + 0.5;

                vec3 r = coord + rId - fd; 
                float d = dot(r, r);

                if(d < minimalDist)
                    minimalDist = d;
            }
        }
    }
    return 1.0 - minimalDist;
}

float worleyOctaves(in vec3 point, float scale, int octaves, float persistance)
{
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float maxAmplitude = 0.0;

    for(int i = 0; i < octaves; i++)
    {
        value += worley(point * frequency, scale * frequency) * amplitude;
        maxAmplitude += amplitude;
        amplitude *= persistance;
        frequency *= 2.0;
    }

    return value / maxAmplitude;
}

float sampleDensity(vec3 pos)
{
    const float baseScale = 1.0 / 1000.0;
    const float offsetSpeed = 1.0 / 100.0;

    vec3 center = (u_boundsMin + u_boundsMax) * 0.5;
    vec3 uvw = (pos - center) * baseScale * u_cloudScale;
    vec3 shapeSamplePos = uvw + u_cloudOffset * offsetSpeed;

    // Calculate falloff at along x/z edges of the cloud container
    const float containerEdgeFadeDst = 2.0; //To do: calculate based on bounds size percentage
    float dstFromEdgeX = min(containerEdgeFadeDst, min(pos.x - u_boundsMin.x, u_boundsMax.x - pos.x));
    float dstFromEdgeY = min(containerEdgeFadeDst, min(pos.y - u_boundsMin.y, u_boundsMax.y - pos.y));
    float dstFromEdgeZ = min(containerEdgeFadeDst, min(pos.z - u_boundsMin.z, u_boundsMax.z - pos.z));
    float edgeWeight = min(dstFromEdgeY, min(dstFromEdgeZ, dstFromEdgeX)) / containerEdgeFadeDst;

    // Calculate base shape density
    float shapeNoise = worleyOctaves(shapeSamplePos, u_noiseScale, u_noiseOctaves, u_noisePersistance);
    float shapeFBM = shapeNoise * edgeWeight;
    float baseShapeDensity = shapeFBM - u_densityThreshold;

    // Save sampling from detail tex if shape density <= 0
    if (baseShapeDensity > 0.0)
    {
        // Sample detail noise
        vec3 detailSamplePos = uvw * (u_cloudScale);
        float detailNoise = worleyOctaves(detailSamplePos, u_noiseScale, u_noiseOctaves + 1, u_noisePersistance);
        float detailFBM = detailNoise;


        // Subtract detail noise from base shape (weighted by inverse density so that edges get eroded more than centre)
        float oneMinusShape = 1.0 - shapeFBM;
        float detailErodeWeight = oneMinusShape;
        float cloudDensity = baseShapeDensity - (1.0 - detailFBM) * detailErodeWeight * u_detailNoiseWeight;

        return cloudDensity * u_densityMultiplier;
    }

    return baseShapeDensity;
}

float lightmarch(vec3 position)
{
    vec3 dirToLight = normalize(u_lightPos - position);
    float distInsideBox = rayBoxDistInside(u_boundsMin, u_boundsMax, position, dirToLight);

    float stepSize = distInsideBox / float(u_lightStep);
    float totalDensity = 0.0;
    vec3 samplePos = position;

    for(int step = 0; step < u_lightStep; ++step)
    {
        samplePos += dirToLight * stepSize;
        totalDensity += max(0.0, sampleDensity(samplePos) * stepSize);
    }
    
    float transmittance = exp(-totalDensity * u_lightAbsorptionTowardSun);
    return mix(u_darknessThreshold, 1.0, transmittance);
}

void main()
{
    vec3 colorOut = texture(u_mainSceneTex, v_uv).rgb;

    vec3 viewDir = getViewDir(v_uv);
    vec2 rayResult = rayBoxDist(u_boundsMin, u_boundsMax, u_cameraPos, 1.0 / viewDir);

    float distToBox = rayResult.x;
    float distInsideBox = rayResult.y;

    float distTravelled = 0.0;
    float stepSize = distInsideBox / float(u_numSteps);
    float distLimit = distInsideBox;

    float transmittance = 1.0;
    float lightEnergy = 0.0;
    vec3 entryPoint = u_cameraPos + viewDir * distToBox;

    while(distTravelled < distLimit)
    {
        vec3 rayPos = entryPoint + viewDir * distTravelled;
        float density = sampleDensity(rayPos) * stepSize;

        if(density > 0.0)
        {
            float lightTransmittance = lightmarch(rayPos);
            lightEnergy += density * transmittance * lightTransmittance;
            transmittance *= exp(-density * u_lightAbsorptionThroughCloud);

            if(transmittance < 0.01)
                break;
        }
        distTravelled += stepSize;
    }

    colorOut = colorOut * transmittance + lightEnergy * u_lightColor;

    gl_FragColor = vec4(colorOut, 1.0);
}
`;