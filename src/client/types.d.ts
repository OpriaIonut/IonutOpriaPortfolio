import { AnimationClip, Color, Object3D } from "three"

export declare type ChartColorTheme = 
{
    fill: boolean,
    backgroundColor: string,
    borderColor: string
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
export declare type HighChartConfig =
{
    _chartType: string,
    _title: string,
    _chartID: string,
    _units: string,
    _categories: string[],
    _dataSets: any[]
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
    _videoFormatIndices: number[],
    _description: string,
    _btn1Link: string,
    _btn2Link: string,
    _imgExtension?: string,
    _downloadPath: string,
    _downloadName: string,
    _btn1Name: string,
    _btn2Name: string
}

export declare type ThreeSceneConfig =
{
    _backgroundColor: Color,
    _minZoom: number,
    _maxZoom: number,
    _litLighting: boolean,
    _ambientIntensity: number,
    _directionalIntensity: number,
    _lightColor: Color
}

export declare type PostProcessingConfig =
{
    _bloomStrength: number,
    _bloomRadius: number,
    _bloomThreshold: number,
    _vignetteOffset: number,
    _vignetteDarkness: number,
    _chromaAberrationLength: number,
    _chromaAberrationRedOut: boolean,
    _lutName: string,
    _lutIntensity: number
}

export declare type Asset3D =
{
    model: Object3D,
    animations: AnimationClip[]
}