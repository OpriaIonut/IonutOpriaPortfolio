export const exposedCodeSDFPostProcessingVert = `
varying vec2 v_UV;

void main()
{
    v_UV = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const exposedCodeSDFPostProcessingFrag = `
#define MAX_STEPS 100
#define SURFACE_EPSILON 0.01
#define MAX_DISTANCE 100.0

varying vec2 v_UV;



//////// Struct definition
//Generic data used to draw various basic shapes (cube, sphere, capsule)
struct SDFData
{
    vec3 pos;
    float size;
    vec3 color;
};

//Data used in the terrain rendering example to draw caves using noise
struct NoiseData
{
    int octaves;        //Used to add more granular detail to the noise, but also reduces performance if it is too big
    float scale;        //Used to scale the noise and make it more detailed
    float amplitude;    //Controls overall brightness of the noise
    float frequency;    //Used to add more fine detail in later octaves (octave 0 will be low detail, and frequency will controll how much detail is added to each cosequent octave)
};

//Main data structure for drawing terrain
struct TerrainData
{
    vec2 hillFrequency;     //Controls how many hills we will have on each of the axes. Hills are created with sine waves
    float hillHeight;       //Controls how tall the generated hills are
    NoiseData caveData;     //Main noise which controls cave generation
    float caveThreshold;    //How much to "cut out" from the terrain to generate caves
    float caveRenderDepth;  //How deep the caves should go
    vec3 terrainColor;      //Color of the top surface of the terrain
    vec3 caveColor;         //Color of underground surface (in the caves)
};
////////



//////// Uniform definition
uniform bool u_DisplayBasicShapes;      //True when displaying the Basic Shapes Demo
uniform bool u_DisplayTerrain;          //True when displaying the terrain demo

uniform vec2 u_ScreenResolution;
uniform vec3 u_CameraPos;
uniform mat4 u_CameraMatrixWorld;
uniform mat4 u_ProjectionMatrixInverse;

uniform vec3 u_LightDir;
uniform float u_AmbientIntensity;
uniform vec3 u_SceneColor;              //Used to achieve a trick in which we display "normal 3D elements" on top of the SDF rendering. To achieve this, we chroma key the background color out of the picture

uniform SDFData u_SphereData;
uniform SDFData u_BoxData;
uniform SDFData u_CapsuleData;
uniform TerrainData u_TerrainData;

uniform int u_Operation;                //Operation used in the basic shapes demo; 0 - union, 1 - intersection, 2 - subtraction
uniform float u_ShapeSmoothness;        //How smooth the shapes should be (only used in basic shapes demo)

uniform sampler2D u_DiffuseTex;         //We are first rendering the scene to this texture and then applying this post-processing pass to the scene. The texture will contain normal 3D scene elements
////////



//////// Utility functions (used to combine SDFs together)
float calculateOperationSmoothness(float a, float b, float smoothness)
{
    return clamp(0.5 + 0.5 * (b - a) / smoothness, 0.0, 1.0);
}

void smoothUnion(float a, float b, vec3 aColor, vec3 bColor, float smoothness, out float dist, out vec3 color)
{
    float h = calculateOperationSmoothness(a, b, smoothness);

    dist = mix(b, a, h) - smoothness * h * (1.0 - h);
    color = mix(bColor, aColor, h);
}

void intersection(float a, float b, vec3 aColor, vec3 bColor, out float dist, out vec3 color)
{
    float h = step(b, a);

    dist = max(a, b);
    color = mix(bColor, aColor, h);
}

void subtraction(float a, float b, vec3 aColor, vec3 bColor, out float dist, out vec3 color)
{
    float h = step(-b, a);

    dist = max(a, -b);
    color = mix(bColor, aColor, h);
}
////////



//////// Basic shapes SDF
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
////////




//////// Noise calculation
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p)
{
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

float fbm(vec3 point, NoiseData data)
{
    float value = 0.0;

    float amplitude = 0.5;
    float frequency = 1.0;

    for(int i = 0; i < data.octaves; i++)
    {
        value += noise(point * data.scale * frequency) * amplitude;

        frequency *= data.frequency;
        amplitude *= data.amplitude;
    }

    return value;
}
////////



//////// Terrain SDF
float terrainHeight(vec2 xz, vec2 hillFrequency, float hillHeight)
{
    float h = 0.0;

    h += sin(xz.x * hillFrequency.x) * hillHeight;
    h += sin(xz.y * hillFrequency.y) * hillHeight;

    return h;
}

float terrainSDF(vec3 point, TerrainData data)
{
    float height = terrainHeight(point.xz, data.hillFrequency, data.hillHeight);
    return point.y - height + 10.0; //+10 is used to move the terrain downwards (so that the camera doesn't spawn inside it)
}
////////



//////// SDF rendering
void sceneSDF(vec3 samplePoint, float smoothness, out float dist, out vec3 color)
{
    //True when in basic shapes demo
    if(u_DisplayBasicShapes)
    {
        //Calculate each of the individual shapes and apply an operation on them
        float sphere = sphereSDF(samplePoint, u_SphereData.pos, u_SphereData.size);
        float box = boxSDF(samplePoint, u_BoxData.pos, vec3(u_BoxData.size, u_BoxData.size, u_BoxData.size));
        float capsule = capsuleSDF(samplePoint, u_CapsuleData.pos, vec3(-1.0, 1.0, 0.0), vec3(1.0, -1.0, 0.0), u_CapsuleData.size);
        
        if(u_Operation == 0) //Union
        {
            smoothUnion(box, capsule, u_BoxData.color, u_CapsuleData.color, smoothness, dist, color);
            smoothUnion(dist, sphere, color, u_SphereData.color, smoothness, dist, color);
        }
        else if(u_Operation == 1) //Intersection
        {
            intersection(box, capsule, u_BoxData.color, u_CapsuleData.color, dist, color);
            intersection(dist, sphere, color, u_SphereData.color, dist, color);
        }
        else if(u_Operation == 2) //Subtraction
        {
            subtraction(box, capsule, u_BoxData.color, u_CapsuleData.color, dist, color);
            subtraction(dist, sphere, color, u_SphereData.color, dist, color);
        }
    }

    //True when in terrain demo
    if(u_DisplayTerrain)
    {
        float terrain = terrainSDF(samplePoint, u_TerrainData);
        float caves = fbm(samplePoint, u_TerrainData.caveData);

        float caveMask = caves - u_TerrainData.caveThreshold;
        caveMask *= u_TerrainData.caveRenderDepth;

        subtraction(terrain, caveMask, u_TerrainData.terrainColor, u_TerrainData.caveColor, dist, color);
    }
}

//Sample the scene multiple times with offsets in each of the 3 axes and calculate the normal based on them (this is basically calculating the derivative of the sceneSDF)
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

//This is the core of our rendering logic. It casts rays into the sceneand detects if we hit an SDF surface or not
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
////////



void main()
{
    vec3 sceneColor = texture(u_DiffuseTex, v_UV).rgb;

    //Gamma correction
    vec3 colorOut = pow(sceneColor, vec3(0.4545)); //0.4545 = 1.0 / 2.2
    vec3 backgroundColor = pow(u_SceneColor, vec3(0.4545)); //0.4545 = 1.0 / 2.2

    //This is a trick used to render the normal 3D scene on top of the SDF scene.
    //We are basically setting every pixel that has the background color to black (this makes a texture in which 3D elements are rendered normally on a black background)
    //After calculating the sdf color output, we add this on top of the sdf color, and then convert black pixels back to the scene color
    float colorDiff = length(colorOut - backgroundColor);
    float backgroundMask = step(0.01, colorDiff);
    colorOut *= backgroundMask;


    //Raymarch to draw the scene
    vec2 raymarchUV = v_UV * 2.0 - 1.0;
    vec4 target = u_ProjectionMatrixInverse * vec4(raymarchUV, 1.0, 1.0);
    vec3 rayDir = normalize(target.xyz / target.w);
    rayDir = normalize((u_CameraMatrixWorld * vec4(rayDir, 0.0)).xyz);

    vec3 sdfColor = vec3(0.0);
    vec3 raymarchColor = vec3(0.0);
    float sceneDist = raymarch(u_CameraPos, rayDir, u_ShapeSmoothness, raymarchColor);

    //If we hit a surface, calculate normal and apply color to the pixel
    if(sceneDist > 0.0)
    {
        vec3 hitPos = u_CameraPos + rayDir * sceneDist;
        vec3 normal = calculateSceneSDFNormal(hitPos, u_ShapeSmoothness);
        float diffuse = max(dot(normal, -u_LightDir), 0.0);

        sdfColor = raymarchColor * vec3(diffuse + u_AmbientIntensity);
    }
    float sdfMask = 1.0 - step(0.01, length(sdfColor));

    //Add the normal 3D scene to the resulting sdf scene and apply again the background color that was cut out
    colorOut += backgroundColor * sdfMask + sdfColor;

    gl_FragColor = vec4(colorOut, 1.0);
}
`;
