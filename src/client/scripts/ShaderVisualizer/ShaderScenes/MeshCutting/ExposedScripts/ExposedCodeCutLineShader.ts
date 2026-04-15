export const exposedCodeCutLineShader = `
import { MeshStandardMaterial, MeshStandardMaterialParameters, Shader, Vector3 } from "three";

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
    private shader!: Shader;

    constructor(extraUniforms: CutLinePreviewShaderUniforms, props?: MeshStandardMaterialParameters)
    {
        super(props);

        this.onBeforeCompile = (program) => {
            this.shader = program;
            program.uniforms.u_LineColor = extraUniforms.u_LineColor;
            program.uniforms.u_LineThickness = extraUniforms.u_LineThickness;
            program.uniforms.u_CutPlaneNormals = extraUniforms.u_CutPlaneNormals;
            program.uniforms.u_CutPlanePoints = extraUniforms.u_CutPlanePoints;
            program.uniforms.u_NumOfCutPlanes = extraUniforms.u_NumOfCutPlanes;

            program.vertexShader = \`
varying vec3 v_posW;
\` + program.vertexShader.replace("void main() {", "void main() {\n\tv_posW = (modelMatrix * vec4(position, 1.0)).xyz;");

            program.fragmentShader = \`
#define MAX_CUT_PLANES 50
varying vec3 v_posW;

uniform vec3 u_LineColor;
uniform float u_LineThickness;
uniform vec3 u_CutPlaneNormals[MAX_CUT_PLANES];
uniform vec3 u_CutPlanePoints[MAX_CUT_PLANES];
uniform int u_NumOfCutPlanes;
\` + program.fragmentShader.replace("vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;", \`vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;

    float cutLinesMask = 0.0;
    for(int index = 0; index < u_NumOfCutPlanes; ++index)
    {
        float dist = dot(v_posW - u_CutPlanePoints[index], u_CutPlaneNormals[index]);
        cutLinesMask += smoothstep(u_LineThickness, 0.0, abs(dist)) * 5.0;
    }
    outgoingLight = mix(outgoingLight, u_LineColor, cutLinesMask);
\`);
        };
    }

    public updateUniforms(unif: CutLinePreviewShaderUniforms)
    {
        this.shader.uniforms.u_LineColor = unif.u_LineColor;
        this.shader.uniforms.u_LineThickness = unif.u_LineThickness;
        this.shader.uniforms.u_CutPlaneNormals = unif.u_CutPlaneNormals;
        this.shader.uniforms.u_CutPlanePoints = unif.u_CutPlanePoints;
        this.shader.uniforms.u_NumOfCutPlanes = unif.u_NumOfCutPlanes;
    }
}
`;