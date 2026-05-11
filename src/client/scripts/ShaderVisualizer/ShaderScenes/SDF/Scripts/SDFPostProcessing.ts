import { Color, Matrix4, ShaderMaterial, Texture, Vector2, Vector3 } from "three"

export declare type SDFData = {
    pos: Vector3,
    size: number,
    color: Color
}

export declare type SDFPostProcessingUniforms = {
    u_ScreenResolution: { value: Vector2 },
    u_CameraPos: { value: Vector3 },
    u_CameraMatrixWorld: { value: Matrix4 },
    u_ProjectionMatrixInverse: { value: Matrix4 },

    u_LightDir: { value: Vector3 },
    u_AmbientIntensity: { value: number },
    u_SceneColor: { value: Color },

    u_SphereData: { value: SDFData },
    u_BoxData: { value: SDFData },
    u_CapsuleData: { value: SDFData },

    u_ShapeSmoothness: { value: number },

    u_DiffuseTex: { value: Texture | null }
}

export class SDFPostProcessing
{
    public static createPass(params: SDFPostProcessingUniforms): ShaderMaterial
    {
        return new ShaderMaterial({
            uniforms: params,
            vertexShader: sdfPostProcessingVert,
            fragmentShader: sdfPostProcessingFrag
        });
    }
}

const sdfPostProcessingVert = `
varying vec2 v_UV;

void main()
{
    v_UV = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const sdfPostProcessingFrag = `
#define MAX_STEPS 128
#define SURFACE_EPSILON 0.001
#define MAX_DISTANCE 100.0

varying vec2 v_UV;

uniform vec2 u_ScreenResolution;
uniform vec3 u_CameraPos;
uniform mat4 u_CameraMatrixWorld;
uniform mat4 u_ProjectionMatrixInverse;

uniform vec3 u_LightDir;
uniform float u_AmbientIntensity;
uniform vec3 u_SceneColor;

struct SDFData
{
    vec3 pos;
    float size;
    vec3 color;
};

uniform SDFData u_SphereData;
uniform SDFData u_BoxData;
uniform SDFData u_CapsuleData;

uniform float u_ShapeSmoothness;

uniform sampler2D u_DiffuseTex;


float sphereSDF(vec3 samplePoint, vec3 pos, float radius)
{
    return length(samplePoint - pos) - radius;
}

float boxSDF(vec3 samplePoint, vec3 pos, vec3 size)
{
    vec3 offset = abs(samplePoint - pos) - size;
    float unsignedDist = length(max(offset, 0.0));
    float distInsideBox = min(max(offset.x, max(offset.y, offset.z)), 0.0);
    return unsignedDist + distInsideBox;
}

float capsuleSDF(vec3 samplePoint, vec3 capsuleCenter, vec3 topOffset, vec3 bottomOffset, float radius)
{
    vec3 top = capsuleCenter + topOffset;
    vec3 bottom = capsuleCenter + bottomOffset;

    vec3 ab = top - bottom;
    float t = dot(samplePoint - bottom, ab) / dot(ab, ab);
    t = clamp(t, 0.0, 1.0);

    vec3 closestPoint = bottom + t * ab;
    return length(samplePoint - closestPoint) - radius;
}

void smoothMin(float a, float b, vec3 aColor, vec3 bColor, float smoothness, out float dist, out vec3 color)
{
    float h = clamp(0.5 + 0.5 * (b - a) / smoothness, 0.0, 1.0);
    dist = mix(b, a, h) - smoothness * h * (1.0 - h);
    color = mix(bColor, aColor, h);
}

void sceneSDF(vec3 samplePoint, float smoothness, out float dist, out vec3 color)
{
    float sphere = sphereSDF(samplePoint, u_SphereData.pos, u_SphereData.size);
    float box = boxSDF(samplePoint, u_BoxData.pos, vec3(u_BoxData.size, u_BoxData.size, u_BoxData.size));
    float capsule = capsuleSDF(samplePoint, u_CapsuleData.pos, vec3(-1.0, 1.0, 0.0), vec3(1.0, -1.0, 0.0), u_CapsuleData.size);

    smoothMin(box, capsule, u_BoxData.color, u_CapsuleData.color, smoothness, dist, color);
    smoothMin(dist, sphere, color, u_SphereData.color, smoothness, dist, color);
}

vec3 calculateSceneSDFNormal(vec3 samplePoint, float smoothness)
{
    float e = 0.001;
    float dx0, dx1, dy0, dy1, dz0, dz1;
    vec3 tempColor;

    sceneSDF(samplePoint + vec3(e, 0.0, 0.0), smoothness, dx0, tempColor);
    sceneSDF(samplePoint - vec3(e, 0.0, 0.0), smoothness, dx1, tempColor);

    sceneSDF(samplePoint + vec3(0.0, e, 0.0), smoothness, dy0, tempColor);
    sceneSDF(samplePoint - vec3(0.0, e, 0.0), smoothness, dy1, tempColor);

    sceneSDF(samplePoint + vec3(0.0, 0.0, e), smoothness, dz0, tempColor);
    sceneSDF(samplePoint - vec3(0.0, 0.0, e), smoothness, dz1, tempColor);

    float dx = dx0 - dx1;
    float dy = dy0 - dy1;
    float dz = dz0 - dz1;

    return normalize(vec3(dx, dy, dz));
}

float raymarch(vec3 rayOrigin, vec3 rayDir, float smoothness, out vec3 color)
{
    float distTravelled = 0.0;
    float sceneDist = 0.0;

    for(int index = 0; index < MAX_STEPS; ++index)
    {
        vec3 samplePoint = rayOrigin + rayDir * distTravelled;
        sceneSDF(samplePoint, smoothness, sceneDist, color);

        if(sceneDist < SURFACE_EPSILON)
            return distTravelled;

        distTravelled += sceneDist;
        if(distTravelled > MAX_DISTANCE)
            break;
    }
    return -1.0;
}
    

void main()
{
    vec3 sceneColor = texture(u_DiffuseTex, v_UV).rgb;

    //Gamma correction
    vec3 colorOut = pow(sceneColor, vec3(0.4545)); //0.4545 = 1.0 / 2.2
    vec3 backgroundColor = pow(u_SceneColor, vec3(0.4545)); //0.4545 = 1.0 / 2.2

    float diff = length(colorOut - backgroundColor);
    float mask = step(0.01, diff);
    colorOut *= mask;


    //Raymarch
    vec2 raymarchUV = v_UV * 2.0 - 1.0;
    vec4 target = u_ProjectionMatrixInverse * vec4(raymarchUV, 1.0, 1.0);
    vec3 rayDir = normalize(target.xyz / target.w);
    rayDir = normalize((u_CameraMatrixWorld * vec4(rayDir, 0.0)).xyz);

    vec3 color = vec3(0.0);
    float sceneDist = raymarch(u_CameraPos, rayDir, u_ShapeSmoothness, color);

    vec3 sdfColor = vec3(0.0);

    if(sceneDist > 0.0)
    {
        vec3 hitPos = u_CameraPos + rayDir * sceneDist;
        vec3 normal = calculateSceneSDFNormal(hitPos, u_ShapeSmoothness);
        float diffuse = max(dot(normal, -u_LightDir), 0.0);

        sdfColor = color * vec3(diffuse * 0.5 + u_AmbientIntensity);
    }
    float sdfMask = 1.0 - step(0.01, length(sdfColor));

    colorOut += backgroundColor * sdfMask + sdfColor;

    gl_FragColor = vec4(colorOut, 1.0);
}
`;