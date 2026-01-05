import { Color, ShaderMaterial, Texture } from "three";

export class CutFillMaterial
{
    public static createMaterial(color?: Color, texture?: Texture)
    {
        return new ShaderMaterial({
            vertexShader: cutFillVert,
            fragmentShader: cutFillFrag,
            uniforms: {
                u_DiffuseColor: { value: color ?? new Color(1.0, 1.0, 1.0) },
                u_DiffuseMap: { value: texture },
                u_UseDiffuseMap: { value: texture != null && texture != undefined }
            }
        });
    }
}

const cutFillVert = `
varying vec2 v_uv;

void main()
{
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const cutFillFrag = `
varying vec2 v_uv;

uniform bool u_UseDiffuseMap;
uniform vec3 u_DiffuseColor;
uniform sampler2D u_DiffuseMap;

void main()
{
    vec3 colorOut = u_DiffuseColor;
    if(u_UseDiffuseMap)
        colorOut *= texture(u_DiffuseMap, v_uv).rgb;
    gl_FragColor = vec4(colorOut, 1.0);
}
`;