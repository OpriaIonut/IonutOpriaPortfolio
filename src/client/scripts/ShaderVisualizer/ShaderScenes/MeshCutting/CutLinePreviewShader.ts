import { MeshStandardMaterial, MeshStandardMaterialParameters, Vector3 } from "three";

export declare type CutLinePreviewShaderUniforms =
{
    u_LineColor: { value: Vector3 },
    u_LineThickness: { value: number },
    u_CutPlaneNormals: { value: Vector3[] },
    u_CutPlanePoints: { value: Vector3[] },
    u_NumOfCutPlanes: { value: number }
}

export class CutLinePreviewShader extends MeshStandardMaterial
{
    constructor(extraUniforms: CutLinePreviewShaderUniforms, props?: MeshStandardMaterialParameters)
    {
        super(props);

        this.onBeforeCompile = (shader) => {
            shader.uniforms.u_LineColor = extraUniforms.u_LineColor;
            shader.uniforms.u_LineThickness = extraUniforms.u_LineThickness;
            shader.uniforms.u_CutPlaneNormals = extraUniforms.u_CutPlaneNormals;
            shader.uniforms.u_CutPlanePoints = extraUniforms.u_CutPlanePoints;
            shader.uniforms.u_NumOfCutPlanes = extraUniforms.u_NumOfCutPlanes;
            console.log(shader.uniforms);

            shader.vertexShader = `
varying vec3 v_posW;
` + shader.vertexShader.replace("void main() {", "void main() {\n\tv_posW = (modelMatrix * vec4(position, 1.0)).xyz;");

            shader.fragmentShader = `
#define MAX_CUT_PLANES 50
varying vec3 v_posW;

uniform vec3 u_LineColor;
uniform float u_LineThickness;
uniform vec3 u_CutPlaneNormals[MAX_CUT_PLANES];
uniform vec3 u_CutPlanePoints[MAX_CUT_PLANES];
uniform int u_NumOfCutPlanes;
` + shader.fragmentShader.replace("vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;", `vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;

    float cutLinesMask = 0.0;
    for(int index = 0; index < u_NumOfCutPlanes; ++index)
    {
        float dist = dot(v_posW - u_CutPlanePoints[index], u_CutPlaneNormals[index]);
        cutLinesMask += smoothstep(u_LineThickness, 0.0, abs(dist)) * 5.0;
    }
    outgoingLight = mix(outgoingLight, u_LineColor, cutLinesMask);
`);
        };
    }
}
