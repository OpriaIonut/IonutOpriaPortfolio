import { Color, ShaderMaterial, Texture } from "three";

export class WorleyNoiseMaterial
{
    public static createMaterial(scale: { value: number }, octaves: { value: number }, persistance: { value: number })
    {
        return new ShaderMaterial({
            vertexShader: worleyNoiseVert,
            fragmentShader: worleyNoiseFrag,
            uniforms: {
                u_scale: scale,
                u_octaves: octaves,
                u_persistance: persistance
            }
        });
    }
}

const worleyNoiseVert = `
varying vec3 v_posW;

void main()
{
    v_posW = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const worleyNoiseFrag = `
varying vec3 v_posW;

uniform float u_scale;
uniform int u_octaves;
uniform float u_persistance;

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

float octaves(in vec3 point, float scale, int octaves, float persistance)
{
    vec3 scaledPoint = point;
    float value = 0.0;
    float frequency = 0.0;

    for (int i = 0; i < octaves; i++)
    {
        value += worley(scaledPoint, scale);
        scaledPoint *= persistance;
    }
    return value / float(octaves);
}

void main()
{
    float noise = octaves(v_posW, u_scale, u_octaves, u_persistance);
    gl_FragColor = vec4(vec3(noise), 1.0);
}
`;