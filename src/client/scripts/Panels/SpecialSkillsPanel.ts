import { WideCellWithDesc } from "../Helper/WideCellWithDesc";

export class SpecialSkillsPanel
{
    private _skills: WideCellWithDesc[] = [];

    constructor(pageParent: HTMLDivElement)
    {
        this.createElements(pageParent);
    }

    private createElements(pageParent: HTMLDivElement)
    {
        const parentNode = document.createElement("div");
        parentNode.id = "specialSkillsPanel";
        parentNode.className = "fullwidth";
        pageParent.appendChild(parentNode);

        //Programming: Procedural Generation, Shader Development, Graphics Programming, VR Development, Network Programming, Backend connection & setup, Multithreaded Programming, Android, Desktop, WebGL, VR deployment, Optimizations.
        const programmingParent = document.createElement("div");
        programmingParent.id = "specialSkillsProgramming";
        parentNode.appendChild(programmingParent);
        
        let programmingTitle = document.createElement("div");
        programmingTitle.className = "subtitle";
        programmingTitle.innerHTML = "Programming Skills";
        programmingParent.appendChild(programmingTitle);

        this._skills.push(new WideCellWithDesc(programmingParent, "", "Procedural Generation", "Built a 3D engine that procedurally generates planets directly in the browser and supports a wide array of unique planets to be generated from a single seed.\nWorked on a procedural volumetric terrain system that is also able to generate underground caves."));
        this._skills.push(new WideCellWithDesc(programmingParent, "", "Shader Development", "Built complex shaders in GLSL, HLSL & Unity ShaderLab, shaders which include: standard mesh shaders, VFX, PBR lighting, atmosphere simulation, post processing shaders, compute shaders, etc."));
        this._skills.push(new WideCellWithDesc(programmingParent, "", "Graphics Programming", "Worked with OpenGL, SFML, SDL2, Sokol & WebGL on a couple of projects and learned a lot of principles related to graphics programming (how rendering pipelines work, object instancing, dynamic mesh generation, volumetric terrain, shaders, etc.)"));
        this._skills.push(new WideCellWithDesc(programmingParent, "", "VR Development", "Built a couple of VR applications on Occulus Quest 2 using the Unity BNG framework. Developed a hand gesture & motion recognition system for a game prototype, both for Unity & Unreal Engine."));
        this._skills.push(new WideCellWithDesc(programmingParent, "", "Network Programming", "Contributed to a couple of multi-user applications (VR, Android, WebGL, Desktop). APIs that I worked with: Photon 2, Colyseus, Unity Networking."));
        this._skills.push(new WideCellWithDesc(programmingParent, "", "Backend Connection & Setup", "Have knowledge about how a backend should work, how you can set it up to receive/send calls to/from it & query information from a database. Played a big part in deploying the backend & the servers required for a game prototype."));
        this._skills.push(new WideCellWithDesc(programmingParent, "", "Multithreaded Programming", "Worked on a couple of projects that made use of multithreading and learned about the rules & best practices that you need to follow when implementing a multithreaded app. Built a worker system in C++ which is responsible for building resources in a separate thread & returns them in the main thread."));
        this._skills.push(new WideCellWithDesc(programmingParent, "", "Android, Desktop, WebGL & VR Deployment", "Deployed multiple applications to the mentioned platforms and have knowledge about what are the hurdles that you have to get through in each of the platforms mentioned."));
        this._skills.push(new WideCellWithDesc(programmingParent, "", "Optimizations", "Spent a lot of time learning how to properly optimize aplications (how textures should be packed, how to combine assets in asset bundles, what settings you should use for each platform, how to profile an app for efficiency, memory management, pre-loading resources, etc.)"));
        this._skills.push(new WideCellWithDesc(programmingParent, "", "Web Development", "Made this site from scratch using Node.js, Typescript & Three.js for the 3D Visualizer. Build a couple of websites that each made use of Three.js to achieve interesting & unique experiences directly in the browser."));

        //ART: modelling, sculpting, UV unwrapping, texturing, rigging, Understanding of game ready pipeline
        const artParent = document.createElement("div");
        artParent.id = "specialSkillsArt";
        parentNode.appendChild(artParent);

        let artTitle = document.createElement("div");
        artTitle.className = "subtitle";
        artTitle.innerHTML = "3D Skills";
        artParent.appendChild(artTitle);

        this._skills.push(new WideCellWithDesc(artParent, "", "3D Modelling", "Know how to create 3D models from a given reference sheet. My main specialization is in making Humanoid characters, but also have some experience in weapons & game props."));
        this._skills.push(new WideCellWithDesc(artParent, "", "Sculpting", "Know the basics of how to use sculpting tools to achieve high level detail."));
        this._skills.push(new WideCellWithDesc(artParent, "", "Retopology", "Retopologized a lot of high-poly sculptures and know how to properly construct the geometry flow to help the texturing/animation process."));
        this._skills.push(new WideCellWithDesc(artParent, "", "UV Unwrapping", "Have experience in UV Unwrapping different kinds of models & making sure the UV layouts are properly defined to achieve the maximum resolution in the most important areas."));
        this._skills.push(new WideCellWithDesc(artParent, "", "Texturing", "Have experience in texturing 3D models in Blender & Substance Painter, using smart materials, generators, filters & hand painting."));
        this._skills.push(new WideCellWithDesc(artParent, "", "Rigging", "Have experience in creating standardized rigs for characters & how to define constraints to help in the animation process (Inverse Kinematics)."));
        this._skills.push(new WideCellWithDesc(artParent, "", "Game Ready Pipeline", "Have a deep understanding of what optimization steps a model needs to go through to achieve maximum performance in games (how to pack textures in different color channels, LODs, optimize geometry, single material channels, drawing calls, etc.)"));
        
        let separator = document.createElement("div");
        separator.className = "separator";
        separator.style.marginTop = "2vw";
        parentNode.appendChild(separator);
    }

    public update()
    {
        for(let index = 0; index < this._skills.length; ++index)
        {
            this._skills[index].update();
        }
    }
}