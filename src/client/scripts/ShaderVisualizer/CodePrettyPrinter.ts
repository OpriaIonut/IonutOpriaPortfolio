export class CodePrettyPrinter
{
    private _style1Color: string = "#4e87dcff";
    private _style1Keywords = ["void", "int", "float", "double", "vec2", "vec3", "vec4", "bool", "char", "byte", "sampler2D", "samplerCube", "sampler3D", "sampler1D", "#define", "#if", "#else", "varying", "const", "uniform", "true", "false", "struct", "reaadonly", "ivec2", "ivec3", "ivec4", "bvec2", "bvec3", "bvec4", "mat2x2", "mat3x2", "mat4x2", "mat2x3", "mat3x3", "mat4x3", "mat4x2", "mat4x3", "mat4x4"];

    private _style2Color: string = "#7cdcfe";
    private _style2Keywords = ["gl_Position", "gl_FragColor", "gl_FragCoord", "projectionMatrix", "modelMatrix", "viewMatrix", "modelViewMatrix", "modelViewProjectionMatrix"];
    
    private _style3Color: string = "#dc8adbff";
    private _style3Keywords = ["break", "continue", "return", "do", "for", "while", "if", "else", "inout", "discard", "lowp", "mediump", "highp", "precision"];

    public formatCode(code: string)
    {
        let result = code;
        for(let index = 0; index < this._style1Keywords.length; ++index)
        {
            let str: string = `<span style=\"color: ${this._style1Color};\">${this._style1Keywords[index]}</span>`;
            result = result.replace(this._style1Keywords[index], str);
        }
        for(let index = 0; index < this._style2Keywords.length; ++index)
        {
            let str: string = `<span style=\"color: ${this._style2Color};\">${this._style2Keywords[index]}</span>`;
            result = result.replace(this._style2Keywords[index], str);
        }
        for(let index = 0; index < this._style3Keywords.length; ++index)
        {
            let str: string = `<span style=\"color: ${this._style3Color};\">${this._style3Keywords[index]}</span>`;
            result = result.replace(this._style3Keywords[index], str);
        }
        return result;
    }
}