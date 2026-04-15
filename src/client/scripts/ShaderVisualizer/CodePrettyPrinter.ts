export class CodePrettyPrinter
{
    private style1Color: string = "rgb(114, 161, 230)";
    private style1Keywords = [
        "class", "private", "public", "let", "void",
        "sampler2D", "samplerCube", "sampler3D", "sampler1D",
        "varying", "const", "uniform", "true", "false", "struct", "readonly", "this",
        "declare", "type", "constructor"
    ];

    // Preprocessor-style keywords (no word boundaries)
    private style1SpecialKeywords = ["#define", "#if", "#else"];

    private style2Color: string = "#7cdcfe";
    private style2Keywords = [
        "gl_Position", "gl_FragColor", "gl_FragCoord",
        "projectionMatrix", "modelMatrix", "viewMatrix",
        "modelViewMatrix", "modelViewProjectionMatrix",
        "length", "array", "number", "int", "float", "double",
        "vec2", "vec3", "vec4", "boolean", "bool", "char", "byte",
        "ivec2", "ivec3", "ivec4", "bvec2", "bvec3", "bvec4",
        "mat2x2", "mat3x2", "mat4x2", "mat2x3", "mat3x3", "mat4x3", "mat4x4"
    ];
    
    private style3Color: string = "#dc8adbff";
    private style3Keywords = [
        "break", "continue", "return", "do", "for", "while",
        "if", "else", "inout", "discard",
        "lowp", "mediump", "highp", "precision",
        "import", "export", "from", "new", "as"
    ];

    private commentPlaceholders: string[] = [];
    private stringPlaceholders: string[] = [];

    private commentColor: string = "#6a9955"; // green comments

    private importSymbolColor: string = "#4ec9a2"; // purple-ish
    private importedSymbols: Set<string> = new Set();

    private functionCallColor: string = "#d5cfaa";
    private stringColor: string = "#ce9178";

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

        replaceKeywords(this.style1Keywords, this.style1Color);
        replaceKeywords(this.style2Keywords, this.style2Color);
        replaceKeywords(this.style3Keywords, this.style3Color);

        // 7️⃣ Special keywords
        for (const keyword of this.style1SpecialKeywords)
        {
            result = result.replace(
                new RegExp(keyword, "g"),
                `<span style="color: ${this.style1Color};">${keyword}</span>`
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
        for (const symbol of this.importedSymbols)
        {
            const regex = new RegExp(`\\b${symbol}\\b`, "g");
            result = result.replace(
                regex,
                `<span style="color: ${this.importSymbolColor};">${symbol}</span>`
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
                this.importedSymbols.add(symbol);
            }
        }
    }

    private colorFunctionCalls(code: string): string
    {
        const excluded = new Set([
            ...this.style1Keywords,
            ...this.style3Keywords,
            "function", "constructor"
        ]);

        const regex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;

        return code.replace(regex, (match, fnName) =>
        {
            if (excluded.has(fnName))
                return match;

            return `<span style="color: ${this.functionCallColor};">${fnName}</span>(`;
        });
    }

    private colorStrings(code: string): string
    {
        const stringRegex =
            /("([^"\\]|\\.)*")|('([^'\\]|\\.)*')|(`[^`]*`)/gs;

        return code.replace(stringRegex, match =>
        {
            return `<span style="color: ${this.stringColor};">${match}</span>`;
        });
    }

    private extractComments(code: string): string
    {
        this.commentPlaceholders = [];

        return code.replace(/\/\/.*$/gm, (match) =>
        {
            const index = this.commentPlaceholders.length;
            this.commentPlaceholders.push(match);
            return `@@COMMENT_${index}@@`;
        });
    }

    private restoreComments(code: string): string
    {
        return code.replace(/@@COMMENT_(\d+)@@/g, (_, index) =>
        {
            const comment = this.commentPlaceholders[Number(index)];
            return `<span style="color: ${this.commentColor};">${comment}</span>`;
        });
    }

    private extractStrings(code: string): string
    {
        this.stringPlaceholders = [];

        const stringRegex =
            /("([^"\\]|\\.)*")|('([^'\\]|\\.)*')|(`[^`]*`)/gs;

        return code.replace(stringRegex, (match) =>
        {
            const index = this.stringPlaceholders.length;
            this.stringPlaceholders.push(match);
            return `@@STRING_${index}@@`;
        });
    }

    private restoreStrings(code: string): string
    {
        return code.replace(/@@STRING_(\d+)@@/g, (_, index) =>
        {
            const value = this.stringPlaceholders[Number(index)];
            return `<span style="color: ${this.stringColor};">${value}</span>`;
        });
    }
}