import { DoubleSide, ShaderMaterial, Vector2 } from "three";

//Keeping for reference because they were some cool math experiments, but it's not actually used anywhere
export declare type MathFunctionsUniforms = {
    u_LinearFunctionSlope: { value: number },
    u_LinearFunctionCenter: { value: Vector2 },

    u_CircleRadius: { value: number },
    u_CircleSmoothness: { value: number },

    u_SegmentPoint0: { value: Vector2 },
    u_SegmentPoint1: { value: Vector2 },

    u_QuadraticCenter: { value: Vector2 },
    u_QuadraticCurvature: { value: number },
    u_QuadraticSlope: { value: number },

    u_TrigAmplitude: { value: number },
    u_TrigFrequency: { value: number },
    u_TrigCenter: { value: Vector2 },

    u_ReflectPoint: { value: Vector2 },
    u_ReflectAngle: { value: number }
}

export class MathFunctionsMaterial
{
    public static createMaterial(uniforms: MathFunctionsUniforms)
    {
        return new ShaderMaterial({
            transparent: true,
            vertexShader: mathFunctionsVert,
            fragmentShader: mathFunctionsFrag,
            uniforms: uniforms,
            side: DoubleSide
        });
    }
}

const mathFunctionsVert = `
varying vec2 v_uv;

void main()
{
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const mathFunctionsFrag = `
#define PI 3.14159265358
#define HALF_PI 1.57079632679
#define TWO_PI 6.28318530718
#define DEGREES_TO_RADIANS PI / 180.0

varying vec2 v_uv;

uniform float u_LinearFunctionSlope;
uniform vec2 u_LinearFunctionCenter;

uniform float u_CircleRadius;
uniform float u_CircleSmoothness;

uniform vec2 u_SegmentPoint0;
uniform vec2 u_SegmentPoint1;

uniform vec2 u_QuadraticCenter;
uniform float u_QuadraticCurvature;
uniform float u_QuadraticSlope;

uniform float u_TrigAmplitude;
uniform float u_TrigFrequency;
uniform vec2 u_TrigCenter;

uniform vec2 u_ReflectPoint;
uniform float u_ReflectAngle;



//f(x) = m(x - u) + b
float linearFunction(vec2 uv, float slope, vec2 center)
{
    float fx = uv.y;
    float x = uv.x;

    float f = slope * (x - center.x) + center.y;
    return fx - f;
}

//x ^ 2 + y ^ 2 = r ^ 2
float sharpCircle(vec2 uv, float radius, vec2 center)
{
    float radiusSquared = radius * radius;
    float x = uv.x - center.x;
    float y = uv.y - center.y;

    float circle = x * x + y * y;
    return step(circle, radiusSquared);
}

//x ^ 2 + y ^ 2 = r ^ 2
float smoothCircle(vec2 uv, float radius, vec2 center, float smoothness)
{
    float radiusSquared = radius * radius;
    float x = uv.x - center.x;
    float y = uv.y - center.y;

    float circle = x * x + y * y;
    return smoothstep(radiusSquared, radiusSquared - smoothness - 0.0001, circle);
}

//m = (b.y - a.y) / (b.x - a.x)
float lineTangent(vec2 p0, vec2 p1)
{
    return (p1.y - p0.y) / (p1.x - p0.x);
}

//f(x) = m(x - a.x) + a.y
float segmentFunction(vec2 uv, vec2 p0, vec2 p1)
{
    float fx = uv.y;
    float x = uv.x;
    float slope = lineTangent(p0, p1);

    float line = slope * (x - p0.x) + p0.y;
    fx -= line;

    return fx;
}

//f(x) = a(x - u) ^ 2 + b(x - u) + c
float quadraticFunction(vec2 uv, float curvature, float slope, vec2 center)
{
    float fx = uv.y;
    float x = uv.x - center.x;

    float curve = curvature * x * x + slope * x + center.y;
    fx -= curve;

    return fx;
}

//f(x) = a * sin(b * (x + c)) * u + u
float sinusoidal(float x, float amplitude, float frequency, vec2 center)
{
    return amplitude * sin(frequency * (x + center.x)) * center.y + center.y;
}

//f(x) = a * sin(b * (x + c)) * u + u
float sinFunction(vec2 uv, float amplitude, float frequency, vec2 center)
{
    float fx = uv.y;
    float x = uv.x;

    float f = sinusoidal(x, amplitude, frequency, center);
    fx -= f;

    return fx;
}

float tanFunction(vec2 uv, float amplitude, float frequency, vec2 center)
{
    float fx = uv.y;
    float x = uv.x;

    const float px = 0.5;
    float py = sinusoidal(px, amplitude, frequency, center);
    float slope = amplitude * tan(PI * 0.25 * cos((px + center.x) * frequency)) * (frequency * 0.5);

    float f = slope * (x - px) + py;
    fx -= f;

    return fx;
}

float linearFunctionWithAngle(vec2 uv, float angle)
{
    float fx = uv.y;
    float x = uv.x;

    float m = tan(angle);
    float f = m * x;
    fx -= f;

    float h = step(HALF_PI, angle) * 2.0 - 1.0;
    return step(0.0, h * fx);
}

//n: vec2 = (-sin(a), cos(a))
//newPoint = point - 2 * n * (-sin(a) * point.x + cos(a) * point.y)
vec2 reflectPoint(vec2 uv, vec2 point, float angle, out float line)
{
    uv -= vec2(0.5);
    angle *= DEGREES_TO_RADIANS;

    line = linearFunctionWithAngle(uv, angle);
    
    vec2 n = vec2(-sin(angle), cos(angle));
    // vec2 newPoint = point - 2.0 * n * (-sin(angle) * point.x + cos(angle) * point.y);
    vec2 newPoint = point - 2.0 * dot(point, n) * n;

    return newPoint;
}

void main()
{
    vec3 colorOut = vec3(1.0);
    float alpha = 1.0;

    //Linear function display
    float linearFuncRes = linearFunction(v_uv, u_LinearFunctionSlope, u_LinearFunctionCenter);
    linearFuncRes = step(0.0, linearFuncRes);

    float sharpCircleRes = sharpCircle(v_uv, u_CircleRadius, u_LinearFunctionCenter);
    float smoothCircleRes = smoothCircle(v_uv, u_CircleRadius, u_LinearFunctionCenter, u_CircleSmoothness);

    float linearFuncMix = mix(linearFuncRes, 1.0 - linearFuncRes, sharpCircleRes);


    //Segment display
    float segmentResult = segmentFunction(v_uv, u_SegmentPoint0, u_SegmentPoint1);
    segmentResult = step(0.0, segmentResult);

    float segmentP0 = sharpCircle(v_uv, u_CircleRadius, u_SegmentPoint0);
    float segmentP1 = sharpCircle(v_uv, u_CircleRadius, u_SegmentPoint1);

    float segmentMix = mix(segmentResult, 1.0 - segmentResult, segmentP0);
    segmentMix = mix(segmentMix, 1.0 - segmentMix, segmentP1);


    //Quadratic display
    float quadraticResult = quadraticFunction(v_uv, u_QuadraticCurvature, u_QuadraticSlope, u_QuadraticCenter);
    quadraticResult = step(0.0, quadraticResult);
    
    float quadraticCenter = sharpCircle(v_uv, u_CircleRadius, u_QuadraticCenter);
    float quadraticMix = mix(quadraticResult, 1.0 - quadraticResult, quadraticCenter);


    //Trigonometry
    float sinResult = sinFunction(v_uv, u_TrigAmplitude, u_TrigFrequency, u_TrigCenter);
    sinResult = step(0.0, sinResult);
    
    float sinCenter = sharpCircle(v_uv, u_CircleRadius, u_TrigCenter);
    float sinMix = mix(sinResult, 1.0 - sinResult, sinCenter);


    float tanResult = tanFunction(v_uv, u_TrigAmplitude, u_TrigFrequency, u_TrigCenter);
    tanResult = step(0.0, tanResult);

    float tanCenter = sharpCircle(v_uv, u_CircleRadius, u_TrigCenter);
    float tanMix = mix(tanResult, 1.0 - tanResult, tanCenter);


    //Reflection
    float reflectLine = 0.0;
    vec2 reflectedPoint = reflectPoint(v_uv, u_ReflectPoint, u_ReflectAngle, reflectLine);

    float originalPointCircle = sharpCircle(v_uv, u_CircleRadius, u_ReflectPoint + vec2(0.5));
    float reflectedPointCircle = sharpCircle(v_uv, u_CircleRadius, reflectedPoint + vec2(0.5));

    colorOut = vec3(0.0, 0.0, reflectLine) + vec3(0.0, originalPointCircle + reflectedPointCircle, 0.0);
    gl_FragColor = vec4(colorOut, alpha);
}
`;