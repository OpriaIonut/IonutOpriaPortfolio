import { WideCellWithDesc } from "../Helper/WideCellWithDesc";

export class SpecialSkillsPanel
{
    constructor()
    {
        this.createElements();
    }

    private createElements()
    {
        const parentNode = document.createElement("div");
        parentNode.id = "specialSkillsPanel";
        parentNode.className = "fullwidth";
        document.body.appendChild(parentNode);

        //Programming: Procedural Generation, Shader Development, Graphics Programming, VR Development, Network Programming, Backend connection & setup, Multithreaded Programming, Android, Desktop, WebGL, VR deployment, Optimizations.
        const programmingParent = document.createElement("div");
        programmingParent.id = "specialSkillsProgramming";
        parentNode.appendChild(programmingParent);
        
        new WideCellWithDesc(programmingParent, "", "Procedural Generation", "Built a 3D engine that procedurally generates planets directly in the browser and supports for a wide array of unique planets to be generated from a single seed.");
        new WideCellWithDesc(programmingParent, "", "Shader Development", "Built very complex shaders in GLSL, HLSL & Unity ShaderLab, shaders which include: standard mesh shaders, VFX, PBR lighting, atmosphere simulation, post processing shaders, compute shaders.");
        new WideCellWithDesc(programmingParent, "", "Graphics Programming", "Have some knowledge of low level graphics programming in OpenGL, Sokol & WebGL, including how rendering pipelines should work, how to render objects to the screen, how to dynamically generate meshes at runtime, volumetric terrain generation, etc.");
        new WideCellWithDesc(programmingParent, "", "VR Development", "Built a couple of VR applications on Occulus Quest 2 using the Unity BNG framework. Developed a hand gesture & motion recognition system for a game prototype.");
        new WideCellWithDesc(programmingParent, "", "Network Programming", "Contributed to a couple of multi-user applications (VR, Android, WebGL, Desktop). APIs that I worked with: Photon 2, Colyseus, Unity Networking.");
        new WideCellWithDesc(programmingParent, "", "Backend connection & setup", "Have knowledge about how a backend should work, how you can set it up to receive/send calls to/from it & query information from a database. Played a big part in deploying the backend & the servers required for a game prototype.");
        new WideCellWithDesc(programmingParent, "", "Multithreaded Programming", "Have some knowledge of how multithreading should be implemented in an app, including how to build resources in a separate thread, how to guard them, etc. Built a worker system which is responsible for building resources in a separate thread & returns them in the main thread.");
        new WideCellWithDesc(programmingParent, "", "Android, Desktop, WebGL & VR Deployment", "Deployed multiple applications to the mentioned platforms and have knowledge about what are the hurdles that you have to pass over in each of the platforms metioned.");
        new WideCellWithDesc(programmingParent, "", "Optimizations", "Spent a lot of time learning how to properly optimize aplications (how textures should be packed, how to combine assets in asset bundles, what settings you should use for each platform, how to profile an app for efficiency, etc.)");

        //ART: modelling, sculpting, UV unwrapping, texturing, rigging, Understanding of game ready pipeline
        const artParent = document.createElement("div");
        artParent.id = "specialSkillsArt";
        parentNode.appendChild(artParent);

        new WideCellWithDesc(artParent, "", "3D Modelling", "Know how to create 3D models from a given reference sheet. My main specialization is in making Humanoid characters, but also have some experience in weapons & game props.");
        new WideCellWithDesc(artParent, "", "Sculpting", "Know the basics of how to use sculpting tools to achieve high level detail.");
        new WideCellWithDesc(artParent, "", "UV Unwrapping", "Have experience in UV Unwrapping different kinds of models & making sure the UV layouts are properly defined to achieve the maximum resolution in the most important areas.");
        new WideCellWithDesc(artParent, "", "Texturing", "Have experience in texturing 3D models in Blender & Substance Painter, using smart materials, generators, filters & hand painting.");
        new WideCellWithDesc(artParent, "", "Rigging", "Have experience in creating standardized rigs for characters & how to define constraints to help in the animation process (Inverse Kinematics).");
        new WideCellWithDesc(artParent, "", "Game Ready Pipeline", "Have a deep understanding of what optimization steps a model needs to go through to achieve maximum performance in games (how to pack textures in different color channels, LODs, optimize geometry, single material channels, drawing calls, etc.)");
    }
}