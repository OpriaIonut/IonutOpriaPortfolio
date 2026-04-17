export const exposedCodeShurikenVert = `
varying vec2 v_uv;

void main()
{
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const exposedCodeShurikenFrag = `
#define PI 3.14159265358
#define DEGREES_TO_RADIANS PI / 180.0
#define MAX_POINTS 10

varying vec2 v_uv;

//Shape uniforms
uniform float u_ShurikenRadius;
uniform int u_NumPoints;
uniform float u_MidPointDist;
uniform float u_MidPointRadius;
uniform float u_CenterRadius;

//Color uniforms
uniform float u_SharpSize;
uniform vec3 u_SharpColor;
uniform vec3 u_BodyColor;
uniform vec3 u_ShadowColor;

//Background uniforms
uniform float u_BorderSize;
uniform vec3 u_BorderColor;
uniform vec3 u_BackgroundColor;
uniform float u_BackgroundOpacity;


//Draw a circle at a specific position
float sharpCircle(vec2 uv, float radius, vec2 center)
{
    float radiusSquared = radius * radius;
    float x = uv.x - center.x;
    float y = uv.y - center.y;

    float circle = x * x + y * y;

    //Apply antialiasing to the resulting circle
    float antialias = fwidth(circle);
    return smoothstep(circle, circle + antialias, radiusSquared);
}

//Calculate a line between 2 points
float segmentFunction(vec2 uv, vec2 p0, vec2 p1)
{
    vec2 dir = p1 - p0;
    vec2 normal = vec2(-dir.y, dir.x);
    float dotProd = dot(uv - p0, normal);

    //Add antialias and add default return condition in case dir is too small (the step at the end will return 0.0 if dir < 0.001)
    float antialias = fwidth(dotProd);
    return smoothstep(0.0, antialias, dotProd) * step(0.001, length(dir));
}

//Will fill the points array with the point positions that we need to render our shuriken
void calculateShurikenPoints(int numPoints, float shurikenRadius, vec2 center, out vec2 points[MAX_POINTS])
{
    float stepSize = 360.0 * DEGREES_TO_RADIANS / float(numPoints);
    for(int index = 0; index < numPoints; ++index)
    {
        float angle = float(index) * stepSize;
        vec2 point = center + vec2(sin(angle), cos(angle)) * shurikenRadius;
        points[index] = point;
    }
}

//Main shuriken class to produce the shape. Needs pre-computed points
float shuriken(vec2 uv, vec2 center, int numPoints, vec2 points[MAX_POINTS], float midPointDist, float midPointRadius, float centerRadius, out float shadowMask)
{
    float shurikenMask = 0.0;       //Main mask for the shuriken shape
    float edgeCircleMask = 0.0;     //Mask which contains the circles on the outer edges of the scene, cuts them out from the shurikenMask at the end
    shadowMask = 0.0;               //Additional mask which can be used to add shadows onto the shuriken

    float numPointsFloat = float(numPoints);    //Convert to float to not have to repeat the process every iteration
    for(int index = 1; index <= numPoints; ++index)
    {
        //When index is equal to NumOfPoints, we want to use index 0 for p1
        //This statement is equivalent to index == numPoints ? 0 : index;
        int clampedIndex = int(step(float(index) + 0.001, numPointsFloat)) * index;

        //Find the 2 points between which we want to generate the shape
        vec2 p0 = points[index - 1];
        vec2 p1 = points[clampedIndex];
        
        //Calculate a mid point between the 2 points and pull it towards the center of the shuriken
        vec2 midPoint = (p1 + p0) * 0.5;
        vec2 cutPoint = center + (midPoint - center) * midPointDist;
        
        //Generate a circle mask for it to be able to cut out from it later on
        if(midPointRadius > 0.0)
        {
            float circle = sharpCircle(uv, midPointRadius, cutPoint);
            edgeCircleMask += circle;
        }

        //Calculate lines to the middle point which can be used to mask out the effect.
        //This actually adds 1.0 outside the shuriken shape and leaves 0.0 inside it
        float line1 = segmentFunction(uv, p0, cutPoint);
        float line2 = segmentFunction(uv, cutPoint, p1);
        shurikenMask += line1 * line2;
        
        //Calculate desired contribution to the shadow mask
        float line3 = segmentFunction(uv, p0, center);
        float line4 = segmentFunction(uv, center, cutPoint);
        shadowMask += line3 * line4;
    }
    //Invert the mask because it has 0.0 in the inside of the shuriken and 1.0 outside it
    shurikenMask = 1.0 - clamp(shurikenMask, 0.0, 1.0);

    //Cut out the circles from the mask
    float centerCircle = sharpCircle(uv, centerRadius, center);
    shurikenMask -= centerCircle;
    shurikenMask -= edgeCircleMask;

    //Clamp the result to reduce artefacts where multiple circles overlap.
    return clamp(shurikenMask, 0.0, 1.0);
}

//Utility function to create a border on the outer edges of the plane
float uvBorder(vec2 uv, float borderSize)
{
    float edgeDist = min(
        min(uv.x, uv.y),
        min(1.0 - uv.x, 1.0 - uv.y)
    );
    return step(edgeDist, borderSize);
}

void main()
{
    vec3 colorOut = u_BackgroundColor;
    float alpha = u_BackgroundOpacity;

    vec2 center = vec2(0.5, 0.5);
    float shadowMask = 0.0;

    //Calculate the overall shuriken shape
    vec2 points[MAX_POINTS];
    calculateShurikenPoints(u_NumPoints, u_ShurikenRadius, center, points);
    float shurikenShape = shuriken(v_uv, center, u_NumPoints, points, u_MidPointDist, u_MidPointRadius, u_CenterRadius, shadowMask);

    //Calculate another shuriken that forces mid points closer to the center. This creates an effect that seems like it has outer edges
    float sharpSize = 1.0 - u_SharpSize;
    float inverseSharpSize = 1.0 / (sharpSize * 0.9);
    float innerMask = shuriken(v_uv, center, u_NumPoints, points, u_MidPointDist * sharpSize, u_MidPointRadius * inverseSharpSize, u_CenterRadius * inverseSharpSize, shadowMask);

    //Color the shuriken based on calculated masks
    vec3 bodyColor = mix(u_ShadowColor, u_BodyColor, shadowMask * shurikenShape);
    colorOut = mix(colorOut, u_SharpColor, shurikenShape);
    colorOut = mix(colorOut, bodyColor, innerMask);

    //Add a border to the image if desired
    alpha += shurikenShape;
    if(u_BorderSize > 0.0)
    {
        float border = uvBorder(v_uv, u_BorderSize);
        colorOut = mix(colorOut, u_BorderColor, border);
        alpha += border;
    }

    gl_FragColor = vec4(colorOut, alpha);
}
`;