import { ShaderMaterial } from "three"

export declare type SDFPostProcessingUniforms = {

}

export class SDFPostProcessing
{
    public static createPass(params: SDFPostProcessingUniforms): ShaderMaterial
    {
        return new ShaderMaterial({
            uniforms: {
                u_DiffuseTex: { value: null },
            },
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
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const sdfPostProcessingFrag = `
varying vec2 v_UV;

uniform sampler2D u_DiffuseTex;

void main()
{
    vec3 sceneColor = texture(u_DiffuseTex, v_UV).rgb;

    //Gamma correction
    vec3 colorOut = pow(sceneColor, vec3(0.4545)); //0.4545 = 1.0 / 2.2

    gl_FragColor = vec4(colorOut, 1.0);
}
`;