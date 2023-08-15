import { ThreeSceneConfig } from "../../types";

const zoroSceneConfig: ThreeSceneConfig =
{
    _backgroundColor: "#555555",
    _minZoom: 0.1,
    _maxZoom: 10,
    _applyBloom: false,
    _bloomIntensity: 0.1,
    _applyVignette: true,
    _vignetteIntensity: 0.3,
    _litLighting: false
}

export const ThreeModelConfig: any =
{
    Zoro: { path: "models/Anchor.glb", anim: [], sceneConfig: zoroSceneConfig },
    MechaGirl: { path: "models/MechaGirl.glb", anim: [], sceneConfig: zoroSceneConfig },
    OniGurl: { path: "models/OniGurl.glb", anim: [], sceneConfig: zoroSceneConfig },
    Enri: { path: "models/Enri.glb", anim: [], sceneConfig: zoroSceneConfig },
    MechSpider: { path: "models/MechSpider.glb", anim: [], sceneConfig: zoroSceneConfig },
    GodEater: { path: "models/GodEaterChainsaw.glb", anim: [], sceneConfig: zoroSceneConfig },
    AnchorSword: { path: "models/AnchorSword.glb", anim: [], sceneConfig: zoroSceneConfig },
    FantasyBow: { path: "models/FantasyBow.glb", anim: [], sceneConfig: zoroSceneConfig }
};