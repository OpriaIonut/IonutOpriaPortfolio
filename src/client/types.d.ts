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