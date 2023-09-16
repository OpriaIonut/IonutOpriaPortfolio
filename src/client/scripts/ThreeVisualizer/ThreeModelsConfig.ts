import { Color, Vector3 } from "three";
import { PostProcessingConfig, ThreeSceneConfig } from "../../types";

const litSceneConfig: ThreeSceneConfig =
{
    _backgroundColor: new Color(0xffffff),
    _minZoom: 1.0,
    _maxZoom: 10,
    _litLighting: true,
    _ambientIntensity: 0.5,
    _directionalIntensity: 5.0,
    _lightColor: new Color(0xffffff)
}
const godEaterScene: ThreeSceneConfig =
{
    _backgroundColor: new Color(0xffffff),
    _minZoom: 1.0,
    _maxZoom: 10,
    _litLighting: true,
    _ambientIntensity: 2.5,
    _directionalIntensity: 5.0,
    _lightColor: new Color(0xffffff)
}
const emissiveSceneConfig: ThreeSceneConfig =
{
    _backgroundColor: new Color(0xffffff),
    _minZoom: 1.0,
    _maxZoom: 10,
    _litLighting: false,
    _ambientIntensity: 0,
    _directionalIntensity: 0,
    _lightColor: new Color(0xffffff)
}

const enriSceneConfig: ThreeSceneConfig =
{
    _backgroundColor: new Color(0xffffff),
    _minZoom: 1.0,
    _maxZoom: 10,
    _litLighting: true,
    _ambientIntensity: 1.5,
    _directionalIntensity: 5.0,
    _lightColor: new Color(0xffffff)
}

const zoroPostProccessing: PostProcessingConfig =
{
    _bloomRadius: 0.8,
    _bloomStrength: 0.25,
    _bloomThreshold: 0.5,
    _chromaAberrationLength: 0.05,
    _vignetteOffset: 1.0,
    _vignetteDarkness: 1.0,
    _chromaAberrationRedOut: true,
    _lutName: "Bourbon 64.CUBE",
    _lutIntensity: 0.0
}

const oniGurlPost: PostProcessingConfig =
{
    _bloomRadius: 0.8,
    _bloomStrength: 0.25,
    _bloomThreshold: 0.9,
    _chromaAberrationLength: 0.0,
    _vignetteOffset: 1.0,
    _vignetteDarkness: 1.0,
    _chromaAberrationRedOut: true,
    _lutName: "Chemical 168.CUBE",
    _lutIntensity: 0.5
}

const enriPost: PostProcessingConfig =
{
    _bloomRadius: 0.5,
    _bloomStrength: 0.25,
    _bloomThreshold: 1.0,
    _chromaAberrationLength: 0.0,
    _vignetteOffset: 1.0,
    _vignetteDarkness: 1.0,
    _chromaAberrationRedOut: true,
    _lutName: "Remy 24.CUBE",
    _lutIntensity: 0.35
}

const mechSpiderPost: PostProcessingConfig =
{
    _bloomRadius: 0.8,
    _bloomStrength: 0.5,
    _bloomThreshold: 0.75,
    _chromaAberrationLength: 0.05,
    _vignetteOffset: 1.0,
    _vignetteDarkness: 1.0,
    _chromaAberrationRedOut: false,
    _lutName: "Bourbon 64.CUBE",
    _lutIntensity: 0.0
}

const godEaterPost: PostProcessingConfig =
{
    _bloomRadius: 0.5,
    _bloomStrength: 0.35,
    _bloomThreshold: 0.75,
    _chromaAberrationLength: 0.0,
    _vignetteOffset: 1.0,
    _vignetteDarkness: 1.0,
    _chromaAberrationRedOut: true,
    _lutName: "Chemical 168.CUBE",
    _lutIntensity: 1.0
}

const anchorPost: PostProcessingConfig =
{
    _bloomRadius: 0.8,
    _bloomStrength: 0.25,
    _bloomThreshold: 0.5,
    _chromaAberrationLength: 0.05,
    _vignetteOffset: 1.0,
    _vignetteDarkness: 1.0,
    _chromaAberrationRedOut: true,
    _lutName: "Chemical 168.CUBE",
    _lutIntensity: 0.85
}

const fantasyBowPost: PostProcessingConfig =
{
    _bloomRadius: 0.5,
    _bloomStrength: 0.35,
    _bloomThreshold: 0.75,
    _chromaAberrationLength: 0.0,
    _vignetteOffset: 1.0,
    _vignetteDarkness: 1.0,
    _chromaAberrationRedOut: true,
    _lutName: "Bourbon 64.CUBE",
    _lutIntensity: 0.65
}

export const ThreeModelConfig: any =
{
    Ori: { 
        path: "models/Ori.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(0, 0, 7), 
        sceneConfig: litSceneConfig,
        postProcessing: zoroPostProccessing,
        animations: {
            firstAnimation: "Default",
            Death: {
                speed: 1.0,
                looping: false
            },
            Default: {
                speed: 1.0,
                looping: false
            },
            Idle: {
                speed: 0.1,
                looping: true
            },
            SecondJump: {
                speed: 0.1,
                looping: true
            },
            Walk: {
                speed: 0.1,
                looping: true
            }
        },
        totalBytes: 3367424
    },
    MechaGirl: { 
        path: "models/MechaGirl.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3( -0.77, 2.11, 4.15), 
        sceneConfig: emissiveSceneConfig,
        postProcessing: oniGurlPost,
        totalBytes: 8175088
    },
    OniGurl: { 
        path: "models/OniGurl.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(-1.096256754139416, 2.24, 3.96), 
        sceneConfig: emissiveSceneConfig,
        postProcessing: oniGurlPost,
        totalBytes: 4903116
    },
    Enri: { 
        path: "models/Enri.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(-0.84, 2.40, 4.09), 
        sceneConfig: enriSceneConfig,
        postProcessing: enriPost,
        totalBytes: 5024536
    },
    MechSpider: { 
        path: "models/MechSpider.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(-0.28, 2.40, 8.45), 
        sceneConfig: litSceneConfig,
        postProcessing: mechSpiderPost,
        totalBytes: 3868788
    },
    GodEater: { 
        path: "models/GodEaterChainsaw.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(-2.08, -0.70, 1.83), 
        sceneConfig: godEaterScene,
        postProcessing: godEaterPost,
        totalBytes: 7452644
    },
    AnchorSword: { 
        path: "models/AnchorSword.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(0, 0, 7), 
        sceneConfig: litSceneConfig,
        postProcessing: anchorPost,
        totalBytes: 3713600
    },
    FantasyBow: { 
        path: "models/FantasyBow.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(0, 0, 10), 
        sceneConfig: litSceneConfig,
        postProcessing: fantasyBowPost,
        totalBytes: 603952
    }
};
