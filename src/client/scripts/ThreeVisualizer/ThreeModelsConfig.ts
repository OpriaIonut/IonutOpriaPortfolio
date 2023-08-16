import { Vector3 } from "three";
import { PostProcessingConfig, ThreeSceneConfig } from "../../types";

const litSceneConfig: ThreeSceneConfig =
{
    _backgroundColor: "#555555",
    _minZoom: 0.1,
    _maxZoom: 10,
    _applyBloom: false,
    _bloomIntensity: 0.1,
    _applyVignette: true,
    _vignetteIntensity: 0.3,
    _litLighting: false,
    _ambientIntensity: 1.0,
    _directionalIntensity: 5.0,
    _lightColor: "#ffffff"
}
const emissiveSceneConfig: ThreeSceneConfig =
{
    _backgroundColor: "#555555",
    _minZoom: 0.1,
    _maxZoom: 10,
    _applyBloom: false,
    _bloomIntensity: 0.1,
    _applyVignette: true,
    _vignetteIntensity: 0.3,
    _litLighting: false,
    _ambientIntensity: 0,
    _directionalIntensity: 0,
    _lightColor: "#ffffff"
}

const zoroPostProccessing: PostProcessingConfig =
{
    _bloomThreshold: 0.0,
    _bloomStrength: 0.0,
    _bloomRadius: 0.0,
    _vignetteOffset: 0.0,
    _vignetteDarkness: 0.0,
    _chromaAberrationRedOut: false,
    _chromaAberrationLength: 0.0,
    _chromaAberrationBlur: 0.0
}

export const ThreeModelConfig: any =
{
    Zoro: { 
        path: "models/AnchorSword.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(0, 0, 7), 
        sceneConfig: litSceneConfig,
        postProcessing: zoroPostProccessing,
        totalBytes: 3713600
    },
    MechaGirl: { 
        path: "models/MechaGirl.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3( -0.77, 2.11, 4.15), 
        sceneConfig: emissiveSceneConfig,
        postProcessing: zoroPostProccessing,
        totalBytes: 5272396
    },
    OniGurl: { 
        path: "models/OniGurl.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(-1.096256754139416, 2.24, 3.96), 
        sceneConfig: emissiveSceneConfig,
        postProcessing: zoroPostProccessing,
        totalBytes: 3332564
    },
    Enri: { 
        path: "models/Enri.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(-0.84, 2.40, 4.09), 
        sceneConfig: litSceneConfig,
        postProcessing: zoroPostProccessing,
        totalBytes: 5024536
    },
    MechSpider: { 
        path: "models/MechSpider.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(-0.28, 2.40, 8.45), 
        sceneConfig: litSceneConfig,
        postProcessing: zoroPostProccessing,
        totalBytes: 3885892
    },
    GodEater: { 
        path: "models/GodEaterChainsaw.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(-2.08, -0.70, 1.83), 
        sceneConfig: litSceneConfig,
        postProcessing: zoroPostProccessing,
        totalBytes: 7452644
    },
    AnchorSword: { 
        path: "models/AnchorSword.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(0, 0, 7), 
        sceneConfig: litSceneConfig,
        postProcessing: zoroPostProccessing,
        totalBytes: 3713600
    },
    FantasyBow: { 
        path: "models/FantasyBow.glb", 
        anim: [], 
        scale: 1.0, 
        cameraPos: new Vector3(0, 0, 10), 
        sceneConfig: litSceneConfig,
        postProcessing: zoroPostProccessing,
        totalBytes: 603952
    }
};