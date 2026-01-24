export class CodePrettyPrinter
{
    private _style1Color: string = "rgb(114, 161, 230)";
    private _style1Keywords = [
        "class", "private", "public", "let", "void",
        "sampler2D", "samplerCube", "sampler3D", "sampler1D",
        "varying", "const", "uniform", "true", "false", "struct", "readonly", "this",
        "declare", "type", "constructor"
    ];

    // Preprocessor-style keywords (no word boundaries)
    private _style1SpecialKeywords = ["#define", "#if", "#else"];

    private _style2Color: string = "#7cdcfe";
    private _style2Keywords = [
        "gl_Position", "gl_FragColor", "gl_FragCoord",
        "projectionMatrix", "modelMatrix", "viewMatrix",
        "modelViewMatrix", "modelViewProjectionMatrix",
        "length", "array", "number", "int", "float", "double",
        "vec2", "vec3", "vec4", "boolean", "bool", "char", "byte",
        "ivec2", "ivec3", "ivec4", "bvec2", "bvec3", "bvec4",
        "mat2x2", "mat3x2", "mat4x2", "mat2x3", "mat3x3", "mat4x3", "mat4x4"
    ];
    
    private _style3Color: string = "#dc8adbff";
    private _style3Keywords = [
        "break", "continue", "return", "do", "for", "while",
        "if", "else", "inout", "discard",
        "lowp", "mediump", "highp", "precision",
        "import", "export", "from", "new", "as"
    ];

    private _commentPlaceholders: string[] = [];
    private _stringPlaceholders: string[] = [];

    private _commentColor: string = "#6a9955"; // green comments

    private _importSymbolColor: string = "#4ec9a2"; // purple-ish
    private _importedSymbols: Set<string> = new Set();

    private _functionCallColor: string = "#d5cfaa";
    private _stringColor: string = "#ce9178";

    public formatCode(code: string): string
    {
        let result = code;

        // 1️⃣ Protect comments
        result = this.extractComments(result);

        // 2️⃣ Protect strings
        result = this.extractStrings(result);

        // 3️⃣ Collect imports (use original code)
        this.collectImportedSymbols(code);

        // 4️⃣ Imported symbols
        result = this.colorImportedSymbols(result);

        // 5️⃣ Function calls
        result = this.colorFunctionCalls(result);

        // 6️⃣ Keywords
        const replaceKeywords = (keywords: string[], color: string) =>
        {
            for (const keyword of keywords)
            {
                const regex = new RegExp(`\\b${keyword}\\b`, "g");
                result = result.replace(
                    regex,
                    `<span style="color: ${color};">${keyword}</span>`
                );
            }
        };

        replaceKeywords(this._style1Keywords, this._style1Color);
        replaceKeywords(this._style2Keywords, this._style2Color);
        replaceKeywords(this._style3Keywords, this._style3Color);

        // 7️⃣ Special keywords
        for (const keyword of this._style1SpecialKeywords)
        {
            result = result.replace(
                new RegExp(keyword, "g"),
                `<span style="color: ${this._style1Color};">${keyword}</span>`
            );
        }

        // 8️⃣ Restore strings (LOCKED color)
        result = this.restoreStrings(result);

        // 9️⃣ Restore comments LAST (LOCKED color)
        result = this.restoreComments(result);

        return result;
    }

    private colorImportedSymbols(result: string): string
    {
        for (const symbol of this._importedSymbols)
        {
            const regex = new RegExp(`\\b${symbol}\\b`, "g");
            result = result.replace(
                regex,
                `<span style="color: ${this._importSymbolColor};">${symbol}</span>`
            );
        }
        return result;
    }

    private collectImportedSymbols(code: string): void
    {
        const importRegex = /import\s*{\s*([^}]+)\s*}/g;
        let match: RegExpExecArray | null;

        while ((match = importRegex.exec(code)) !== null)
        {
            const symbols = match[1]
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);

            for (const symbol of symbols)
            {
                this._importedSymbols.add(symbol);
            }
        }
    }

    private colorFunctionCalls(code: string): string
    {
        const excluded = new Set([
            ...this._style1Keywords,
            ...this._style3Keywords,
            "function", "constructor"
        ]);

        const regex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;

        return code.replace(regex, (match, fnName) =>
        {
            if (excluded.has(fnName))
                return match;

            return `<span style="color: ${this._functionCallColor};">${fnName}</span>(`;
        });
    }

    private colorStrings(code: string): string
    {
        const stringRegex =
            /("([^"\\]|\\.)*")|('([^'\\]|\\.)*')|(`[^`]*`)/gs;

        return code.replace(stringRegex, match =>
        {
            return `<span style="color: ${this._stringColor};">${match}</span>`;
        });
    }

    private extractComments(code: string): string
    {
        this._commentPlaceholders = [];

        return code.replace(/\/\/.*$/gm, (match) =>
        {
            const index = this._commentPlaceholders.length;
            this._commentPlaceholders.push(match);
            return `@@COMMENT_${index}@@`;
        });
    }

    private restoreComments(code: string): string
    {
        return code.replace(/@@COMMENT_(\d+)@@/g, (_, index) =>
        {
            const comment = this._commentPlaceholders[Number(index)];
            return `<span style="color: ${this._commentColor};">${comment}</span>`;
        });
    }

    private extractStrings(code: string): string
    {
        this._stringPlaceholders = [];

        const stringRegex =
            /("([^"\\]|\\.)*")|('([^'\\]|\\.)*')|(`[^`]*`)/gs;

        return code.replace(stringRegex, (match) =>
        {
            const index = this._stringPlaceholders.length;
            this._stringPlaceholders.push(match);
            return `@@STRING_${index}@@`;
        });
    }

    private restoreStrings(code: string): string
    {
        return code.replace(/@@STRING_(\d+)@@/g, (_, index) =>
        {
            const value = this._stringPlaceholders[Number(index)];
            return `<span style="color: ${this._stringColor};">${value}</span>`;
        });
    }
}