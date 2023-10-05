import Chart from 'chart.js/auto';
import { ChartConfig, HighChartConfig } from '../../types';
import { chartRedColorTheme, chartBlueColorTheme, chartGreenColorTheme, chartPurpleColorTheme, chartYellowColorTheme, chartDarkBlueColorTheme, chartOrangeColorTheme, chartLightGrayColorTheme, chartDarkGrayColorTheme } from '../Themes/ChartThemes';
import * as Highcharts from 'highcharts';

export class SkillChartsPanel
{
    private _useHighCharts: boolean = true;

    private _charts: Chart[] = [];
    private _highCharts: Highcharts.Chart[] = [];

    constructor(parentElem: HTMLDivElement)
    {
        this.createElements(parentElem);
    }

    private createElements(parentElem: HTMLDivElement)
    {
        const parentNode = document.createElement("div");
        parentNode.id = "skillCharts";
        parentNode.className = "fullwidth";
        parentElem.appendChild(parentNode);

        let title = document.createElement("div");
        title.className = "sectionTitle";
        title.innerHTML = "Skills";
        parentNode.appendChild(title);


        //Languages Date: 14.08.2023
        //C++                       prof 4 month, hobby 5 years
        //C#                        prof 2 years, hobby 7 years
        //Javascript & Typescript   prof 2 years, hobby 6 months
        //Python                    hobby 3 months
        //Java                      hobby 4 months
        //SQL                       hobby 6 months
        //GLSL                      prof 2 years, hobby 6 months

        //Softwares
        //Unity                     prof 2 years, hobby 7 years
        //Unreal Engine             hobby 2 months
        //Blender                   hobby 6 years
        //Substance Painter         hobby 3 years
        //Three.js                  prof 2 years, hobby 6 months
        //Android Studio            hobby 6 months

        if(this._useHighCharts)
        {
            this.createHighChart(parentNode, {
                _chartType: "column",
                _title: "Languages",
                _categories: ["C#", "C++", "Typescript", "GLSL", "SQL", "Java", "Python"],
                _chartID: "languageChart",
                _units: " years",
                _dataSets: [
                    { name: "Professional", color: chartRedColorTheme.backgroundColor, data: [2, 0.4, 2, 2, 0, 0, 0] },
                    { name: "Hobby", color: chartBlueColorTheme.backgroundColor, data: [7, 5, 0.6, 0.6, 0.6, 0.4, 0.3] }
                ]
            });
        }
        else
        {
            this.createChart(parentNode, {
                _chartType: "bar",
                _labels: ["C++", "C#", "Typescript", "Python", "Java", "SQL", "GLSL"],
                _chartID: "languageChart",
                _units: " years",
                _dataSets: [
                    { _label: "Professional", _colorTheme: chartRedColorTheme, _data: [0.4, 2, 2, 0, 0, 0, 2] },
                    { _label: "Hobby", _colorTheme: chartBlueColorTheme, _data: [5, 7, 0.6, 0.3, 0.4, 0.6, 0.6] }
                ]
            });
        }

        if(this._useHighCharts)
        {
            this.createHighChart(parentNode, {
                _chartType: "column",
                _title: "Software",
                _categories: ["Unity", "Blender", "Substance Painter", "Three.js", "Android Studio", "Unreal Engine"],
                _chartID: "softwareChart",
                _units: " years",
                _dataSets: [
                    { name: "Professional", color: chartRedColorTheme.backgroundColor, data: [2, 0, 0, 2, 0, 0] },
                    { name: "Hobby", color: chartBlueColorTheme.backgroundColor, data: [7, 6, 3, 0.6, 0.6, 0.2] }
                ]
            });
        }
        else
        {
            this.createChart(parentNode, {
                _chartType: "bar",
                _labels: ["Unity", "Blender", "Substance Painter", "Three.js", "Android Studio", "Unreal Engine"],
                _chartID: "softwareChart",
                _units: " years",
                _dataSets: [
                    { _label: "Professional", _colorTheme: chartRedColorTheme, _data: [2, 0, 0, 0, 2, 0] },
                    { _label: "Hobby", _colorTheme: chartBlueColorTheme, _data: [7, 0.2, 6, 3, 0.6, 0.6] }
                ]
            });
        }

        // this.createChart(parentNode, {
        //     _chartType: "line",
        //     _labels: ["C++", "C#", "Typescript", "GLSL", "Three.js", "Unity", "Unreal Engine", "Blender", "Substance Painter"],
        //     _chartID: "selfAssesmentChart",
        //     _units: "",
        //     _dataSets: [
        //         { _label: "Proficiency", _colorTheme: chartPurpleColorTheme, _data: [4, 6, 7, 4, 8, 7, 1, 7, 5] }
        //     ],
        //     _maxScale: 10
        // });

        // let separator = document.createElement("div");
        // separator.className = "separator";
        // parentNode.appendChild(separator);
        this.updateChartColors();
    }

    private createHighChart(parentNode: HTMLElement, config: HighChartConfig)
    {
        let chartParent = document.createElement("div");
        chartParent.id = config._chartID;
        parentNode.appendChild(chartParent);

        let createdChart = Highcharts.chart(chartParent, {
            chart: {
                type: config._chartType,
                backgroundColor: "rgba(0, 0, 0, 0)"
            },
            title: {
                text: config._title,
                align: 'left',
                style: {
                    color: "aliceblue"
                }
            },
            xAxis: {
                categories: config._categories,
                labels: {
                    style: {
                        color: "aliceblue"
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: ''
                },
                stackLabels: {
                    enabled: true
                },
                labels: {
                    style: {
                        color: "aliceblue"
                    },
                    formatter: function() {
                        return this.value + config._units;
                    }
                }
            },
            legend: {
                align: 'left',
                x: 0,
                verticalAlign: 'top',
                y: 0,
                floating: false,
                backgroundColor: 'rgba(0, 0, 0, 0.0)',
                shadow: false,
                itemStyle: {
                    color: "aliceblue"
                }
            },
            tooltip: {
                headerFormat: '<b>{point.x}</b><br/>',
                pointFormat: '{series.name}: {point.y}' + config._units + '<br/>Total: {point.stackTotal}' + config._units
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            series: config._dataSets
        });
        this._highCharts.push(createdChart);
    }

    private createChart(parentNode: HTMLElement, config: ChartConfig)
    {
        let data: any = {
            labels: config._labels,
            datasets: []
        };
        for(let index = 0; index < config._dataSets.length; index++)
        {
            data.datasets.push({
                label: config._dataSets[index]._label,
                data: config._dataSets[index]._data,
                ...config._dataSets[index]._colorTheme
            });
        }

        let canvasParent = document.createElement("div");
        canvasParent.className = "skillChartItem";
        canvasParent.id = config._chartID;
        parentNode.appendChild(canvasParent);

        let chartCanvas = document.createElement("canvas");
        canvasParent.appendChild(chartCanvas);

        this._charts.push(new Chart(chartCanvas, {
            type: config._chartType as any,
            data: data,
            options: {
                animation: {
                    duration: 2000
                },
                scales:{
                    y: {
                        max: config._maxScale,
                        beginAtZero: true,
                        ticks: {
                            color: "#ffffff",
                            callback: function(value: any, index: any, values: any) {
                                return value + config._units;
                            }
                        },
                        grid: {
                            color: "rgba(100, 100, 100, 0.5)"
                        }
                    },
                    x: {
                        ticks: {
                            color: "#ffffff"
                        },
                        grid: {
                            color: "rgba(100, 100, 100, 0.5)"
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3
                    }
                },
                color: "#ffffff"
            }
        }));
    }

    public updateChartColors()
    {
        let primaryColor = chartRedColorTheme;
        let secondaryColor = chartBlueColorTheme;
        switch(document.documentElement.className)
        {
            case "greenTheme":
                primaryColor = chartYellowColorTheme;
                secondaryColor = chartGreenColorTheme;
                break;
            case "orangeTheme":
                primaryColor = chartBlueColorTheme;
                secondaryColor = chartOrangeColorTheme;
                break;
            case "purpleTheme":
                primaryColor = chartDarkBlueColorTheme;
                secondaryColor = chartPurpleColorTheme;
                break;
            case "grayscaleTheme":
                primaryColor = chartLightGrayColorTheme;
                secondaryColor = chartDarkGrayColorTheme;
                break;
        }

        if(this._useHighCharts)
        {
            for(let index = 0; index < this._highCharts.length; ++index)
            {
                this._highCharts[index].series[0].update({
                    color: primaryColor.backgroundColor,
                    type: 'column'
                });
                this._highCharts[index].series[1].update({
                    color: secondaryColor.backgroundColor,
                    type: 'column'
                });
            }
        }
        else
        {
            for(let index = 0; index < this._charts.length; ++index)
            {
                this._charts[index].data.datasets[0].backgroundColor = primaryColor.backgroundColor;
                this._charts[index].data.datasets[1].backgroundColor = secondaryColor.backgroundColor;
                this._charts[index].update();
            }
        }
    }
}