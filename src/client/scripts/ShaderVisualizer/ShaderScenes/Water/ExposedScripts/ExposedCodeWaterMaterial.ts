export const exposedCodeWaterMaterialVert = `
#define PI 3.14159265359

varying vec3 v_WorldPos;
varying vec3 v_NormalW;
varying float v_Height;

uniform float u_Time;
uniform int u_WaveCount;
uniform float u_WaveSteepness;
uniform float u_WaveAmplitude;
uniform float u_WaveFrequency;
uniform float u_WaveSpeed;

vec3 gerstnerSum(vec3 position, float time, int numWaves, float amplitude, float frequency, float speed, float steepness, out float height01, out vec3 normal)
{
    vec3 displacement = vec3(0.0);
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 bitangent = vec3(0.0, 0.0, 1.0);

    //Add together multiple wave samples each with different parameters
    float flNumWaves = float(numWaves);
    for (int index = 0; index < numWaves; index++)
    {
        float flIndex = float(index);
        vec2 dir = normalize(vec2(cos(flIndex * 1.3), sin(flIndex * 1.3))); //Calculate wave direction based on our current sample

        float k = 2.0 * PI / frequency;
        float phase = k * dot(dir, position.xz) - speed * time;

        float cosPhase = cos(phase);
        float sinPhase = sin(phase);

        float QA = steepness / (k * flNumWaves);

        displacement += vec3(QA * dir.x * cosPhase, amplitude * sinPhase, QA * dir.y * cosPhase);
        tangent += vec3(-QA * k * dir.x * dir.x * sinPhase, amplitude * k * dir.x * cosPhase, -QA * k * dir.x * dir.y * sinPhase);
        bitangent += vec3(-QA * k * dir.x * dir.y * sinPhase, amplitude * k * dir.y * cosPhase, -QA * k * dir.y * dir.y * sinPhase);

        //Tweak settings for the next wave which will be generated
        amplitude *= 0.75;
        frequency *= 0.65;
        speed *= 0.8;
        steepness *= 1.15;
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
    v_WorldPos = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const exposedCodeWaterMaterialFrag = `
#define PI 3.14159265359

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

uniform sampler2D u_SkyTexture;


float random(vec2 n)
{ 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

//Sample the depth texture in shuch a way that 0 is the near plane and 1.0 is the far plane
float sampleDepth01(sampler2D depthSampler, vec2 coord, float near, float far)
{
	float fragCoordZ = texture2D(depthSampler, coord).r;
	float viewZ = (near * far) / ((far - near) * fragCoordZ - far);
	return (viewZ + near) / (near - far);
}

//Sample the depth texture so that you get actual near & far plane values
float sampleDepthInWorldSpace(sampler2D depthTex, vec2 screenUV, float near, float far)
{
    float depth = texture(depthTex, screenUV).r;
    float z = depth * 2.0 - 1.0; // back to NDC
    return (2.0 * near * far) / (far + near - z * (far - near));
}

vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(max(1.0 - cosTheta, 0.0), 5.0);
}  

vec3 calculateLight(vec3 unlitColor, vec3 lightDir, float ambientIntensity, vec3 lightColor, float lightIntensity)
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

    return ambient + diffuse * lightColor * lightIntensity;
}

//Convert a direction to a uv, mainly used for reflection & refraction
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


    //Read depth texture and distort objects only if they are underwater
    vec2 distortion = v_NormalW.xz * 0.02;
    float distortedDepth = texture(u_DepthTex, screenUV + distortion).r;
    if(gl_FragCoord.z > distortedDepth)
        distortion = vec2(0.0);

    float depthTex = 1.0 - sampleDepth01(u_DepthTex, screenUV + distortion, u_CameraNear, u_CameraFar);
    depthTex += mix(-0.0025, 0.0025, random(screenUV)); //Add dithering to reduce color banding
    

    //Sample main colors of the water
    colorOut = mix(u_FarColor, u_MidColor, smoothstep(0.5, 0.9, depthTex));
    colorOut = mix(colorOut, u_ShoreColor, smoothstep(0.9, 1.0, depthTex));

    vec3 topWaveColor = mix(colorOut, vec3(1.0), 0.1);
    colorOut = mix(colorOut, topWaveColor, v_Height); //Color based on Wave height


    //Main lighting calculation
    colorOut = calculateLight(colorOut, u_LightDir, u_AmbientIntensity, u_LightColor, u_LightIntensity);


    //Add custom frestel to the top of the waves
    vec3 V = normalize(u_CameraPos - v_WorldPos.xyz);
    float fresnel = pow(1.0 - max(dot(V, v_NormalW), 0.0), 5.0);
    fresnel = clamp(fresnel, 0.0, 1.0);
    colorOut = mix(colorOut, u_FresnelColor, fresnel * u_FresnelColorIntensity);
    

    //Reflection & Refraction
    vec3 reflectedDir = reflect(-V, v_NormalW);
    vec2 reflectedUV = dirToUV(reflectedDir);
    vec3 reflectedColor = texture2D(u_SkyTexture, reflectedUV).rgb;

    vec3 refractedDir = refract(-V, v_NormalW, 0.75);
    vec2 refractUV = dirToUV(refractedDir);
    vec3 refractedColor = texture2D(u_SkyTexture, refractUV).rgb;

    vec3 envColor = mix(refractedColor, reflectedColor, fresnel);
    colorOut = mix(colorOut, envColor, u_EnvironmentIntensity);


    //Make water shader transparent when close to objects in the scene
    float alphaMask = smoothstep(0.8, 1.0, depthTex);
    alpha = mix(1.0, 0.65, alphaMask);


    //Add foam around objects in the scene
    vec3 viewPos = (u_InverseViewMatrix * vec4(v_WorldPos, 1.0)).xyz;
    float waterDepth = -viewPos.z;
    float worldSpaceDepth = sampleDepthInWorldSpace(u_DepthTex, screenUV, u_CameraNear, u_CameraFar);

    float foamMask = 1.0 - (worldSpaceDepth * (1.0 - u_FoamDistance) - waterDepth);
    foamMask *= u_FoamOpacity;
    foamMask = clamp(foamMask, 0.0, 1.0);

    colorOut = mix(colorOut, u_FoamColor, foamMask);
    alpha = mix(alpha, 1.0, foamMask);


    //Apply gamma correction
    colorOut = pow(colorOut, vec3(2.2));

    gl_FragColor = vec4(colorOut, alpha);
}
`;