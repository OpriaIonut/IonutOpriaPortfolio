import { Color, Vector3 } from "three";
import { PostProcessingConfig, ThreeSceneConfig } from "../../types";

const litSceneConfig: ThreeSceneConfig =
{
    _backgroundColor: new Color(0x777777),
    _minZoom: 1.0,
    _maxZoom: 20,
    _litLighting: true,
    _ambientIntensity: 0.5,
    _directionalIntensity: 5.0,
    _lightColor: new Color(0xffffff)
}
const godEaterScene: ThreeSceneConfig =
{
    _backgroundColor: new Color(0x777777),
    _minZoom: 1.0,
    _maxZoom: 10,
    _litLighting: true,
    _ambientIntensity: 2.5,
    _directionalIntensity: 5.0,
    _lightColor: new Color(0xffffff)
}
const emissiveSceneConfig: ThreeSceneConfig =
{
    _backgroundColor: new Color(0x777777),
    _minZoom: 1.0,
    _maxZoom: 10,
    _litLighting: false,
    _ambientIntensity: 0,
    _directionalIntensity: 0,
    _lightColor: new Color(0xffffff)
}

const enriSceneConfig: ThreeSceneConfig =
{
    _backgroundColor: new Color(0x777777),
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

const jorogumoPost: PostProcessingConfig =
{
    _bloomRadius: 0.5,
    _bloomStrength: 0.15,
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
        totalBytes: 3367424,
        artist: ""
    },
    MechaGirl: { 
        path: "models/MechaGirl.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3( -0.77, 2.11, 4.15), 
        sceneConfig: emissiveSceneConfig,
        postProcessing: oniGurlPost,
        totalBytes: 8175088,
        artist: "Please credit <a href='https://www.artstation.com/artwork/qAzZky'>Alfredo Candelaresi</a> for the original concept"
    },
    OniGurl: { 
        path: "models/OniGurl.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(-1.096256754139416, 2.24, 3.96), 
        sceneConfig: emissiveSceneConfig,
        postProcessing: oniGurlPost,
        totalBytes: 4903116,
        artist: "Please credit <a href='https://www.youtube.com/c/shionmgr'>Shion Mgr</a> for the original concept"
    },
    Enri: { 
        path: "models/Enri.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(-0.84, 2.40, 4.09), 
        sceneConfig: enriSceneConfig,
        postProcessing: enriPost,
        totalBytes: 5024536,
        artist: "Please credit <a href='https://twitter.com/nama41228652'>Nama</a> for the original concept"
    },
    Jorogumo: { 
        path: "models/Jorogumo.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(1, 2, 7), 
        sceneConfig: litSceneConfig,
        postProcessing: jorogumoPost,
        animations: {
            firstAnimation: "Default",
            Default: {
                speed: 1.0,
                looping: false
            },
            Idle: {
                speed: 0.1,
                looping: true
            },
            KillPlayer: {
                speed: 0.075,
                looping: true
            },
            JumpWindow: {
                speed: 0.075,
                looping: true
            },
            Running: {
                speed: 0.075,
                looping: true
            },
            Scream: {
                speed: 0.075,
                looping: true
            }
        },
        totalBytes: 12483440,
        artist: ""
    },
    MechSpider: { 
        path: "models/MechSpider.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(-0.28, 2.40, 8.45), 
        sceneConfig: litSceneConfig,
        postProcessing: mechSpiderPost,
        totalBytes: 3868788,
        artist: "Please credit <a href='https://www.artstation.com/artwork/D5y5mR'>Christoph Stryczek</a> for the original concept"
    },
    GodEater: { 
        path: "models/GodEaterChainsaw.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(-2.08, -0.70, 1.83), 
        sceneConfig: godEaterScene,
        postProcessing: godEaterPost,
        totalBytes: 7452644,
        artist: ""
    },
    AnchorSword: { 
        path: "models/AnchorSword.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(0, 0, 7), 
        sceneConfig: litSceneConfig,
        postProcessing: anchorPost,
        totalBytes: 3713600,
        artist: "Please credit <a href='https://www.artstation.com/artwork/48WzV8'>Baldi Konijin</a> for the original concept"
    },
    FantasyBow: { 
        path: "models/FantasyBow.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(0, 0, 10), 
        sceneConfig: litSceneConfig,
        postProcessing: fantasyBowPost,
        totalBytes: 603952,
        artist: ""
    }
};
