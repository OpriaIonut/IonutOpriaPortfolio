import { AnimationClip, Object3D } from "three"

export declare type ChartColorTheme = 
{
    fill: boolean,
    backgroundColor: string,
    borderColor: string,
    pointBackgroundColor: string,
    pointBorderColor: string,
    pointHoverBackgroundColor: string,
    pointHoverBorderColor: string
}

export declare type ChartConfig =
{
    _chartType: string,
    _labels: string[],
    _chartID: string,
    _maxScale?: number,
    _units: string,
    _dataSets: {
        _label: string,
        _data: number[],
        _colorTheme: ChartColorTheme
    }[]
}

export declare type CellGalleryConfig =
{
    _id: string,
    _imagesPath: string,
    _imageCount: number,
    _imageDurationMs: number,
    _title: string,
    _tags: string[],
    _tagColors: string[],
    _description: string,
    _moreDetailsPage: string
}

export declare type ThreeSceneConfig =
{
    _backgroundColor: string,
    _minZoom: number,
    _maxZoom: number,
    _applyBloom: boolean,
    _bloomIntensity: number,
    _applyVignette: boolean,
    _vignetteIntensity: number,
    _litLighting: boolean,
    _ambientIntensity: number,
    _directionalIntensity: number,
    _lightColor: string
}

export declare type PostProcessingConfig =
{
    _bloomStrength: number,
    _bloomRadius: number,
    _bloomThreshold: number,
    _vignetteOffset: number,
    _vignetteDarkness: number,
    _chromaAberrationLength: number,
    _chromaAberrationBlur: number,
    _chromaAberrationRedOut: boolean
}

export declare type Asset3D =
{
    model: Object3D,
    animations: AnimationClip[]
}