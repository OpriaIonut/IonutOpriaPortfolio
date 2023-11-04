import Chart from 'chart.js/auto';
import { ChartConfig, HighChartConfig } from '../../types';
import { chartRedColorTheme, chartBlueColorTheme, chartGreenColorTheme, chartPurpleColorTheme, chartYellowColorTheme, chartDarkBlueColorTheme, chartOrangeColorTheme, chartLightGrayColorTheme, chartDarkGrayColorTheme, chartGrayColorTheme } from '../Themes/ChartThemes';
import * as Highcharts from 'highcharts';
import { isPortraitMode } from '../../client';

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
        //C#                        prof 2020-2022, school 6 months, hobby 2016-2020
        //C++                       prof: 05.2023-present, school 2015-2017, 2018, hobby: 2019-2021 
        //Javascript & Typescript   prof 2021-05.2023, hobby 06.2023-present
        //GLSL                      prof: 2021-2022, hobby 06.2023-present
        //SQL                       school 1 year, prof 2 months (planet launch)
        //Java                      school 1 year, hobby 3 months
        //Python                    school 6 months

        //Softwares
        //Unity                     prof 2020-2022, hobby 2016-2020
        //Blender                   hobby 2016-present
        //Substance Painter         hobby 2020-present
        //Three.js                  prof 2021-2022, hobby 06.2023-present
        //Android Studio            school 1 year, hobby 3 months (JapoTimeApp)
        //Unreal Engine             hobby 2 months (in 2023)

        if(this._useHighCharts)
        {
            this.createHighChart(parentNode, {
                _chartType: "column",
                _title: "Languages",
                _categories: ["C#", "C++", "Typescript", "GLSL", "Java", "SQL", "Python"],
                _chartID: "languageChart",
                _units: " years",
                _dataSets: [
                    { name: "Professional", color: chartRedColorTheme.backgroundColor, data:    [3.0, 0.4, 2.0, 2.0, 0.0, 0.2, 0.0] },
                    { name: "School", color: chartRedColorTheme.backgroundColor, data:          [0.5, 4.0, 0.0, 0.0, 1.0, 1.0, 0.5]},
                    { name: "Hobby", color: chartBlueColorTheme.backgroundColor, data:          [5.0, 3.0, 0.6, 0.6, 0.3, 0.0, 0.0] }
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
                    { _label: "Professional", _colorTheme: chartRedColorTheme, _data: [0.6, 2, 2, 0, 0, 0, 2] },
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
                    { name: "Professional", color: chartRedColorTheme.backgroundColor,  data: [3.0, 0.0, 0.0, 2.0, 0.0, 0.0] },
                    { name: "School", color: chartRedColorTheme.backgroundColor,        data: [0.0, 0.0, 0.0, 0.0, 1.0, 0.0]},
                    { name: "Hobby", color: chartBlueColorTheme.backgroundColor,        data: [5.0, 8.0, 4.0, 0.6, 0.3, 0.2] }
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
        if(window.innerWidth / window.innerHeight > 2.5 / 1.0)
        {
            chartParent.style.width = "35vw";
        }
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
                    color: "aliceblue",
                    fontSize: isPortraitMode.value ? "4.0vw" : "2vw"
                }
            },
            xAxis: {
                categories: config._categories,
                labels: {
                    rotation: 0,
                    style: {
                        color: "aliceblue",
                        fontSize: isPortraitMode.value ? "1.75vw" : "0.75vw"
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: ''
                },
                stackLabels: {
                    enabled: true,
                    style: {
                        fontSize: isPortraitMode.value ? "2.5vw" : "1vw"
                    }
                },
                labels: {
                    style: {
                        color: "aliceblue",
                        fontSize: isPortraitMode.value ? "1.75vw" : "0.75vw"
                    },
                    formatter: function() {
                        return this.value + config._units;
                    }
                },
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
                    color: "aliceblue",
                    fontSize: isPortraitMode.value ? "3.0vw" : "1vw"
                }
            },
            tooltip: {
                headerFormat: '<b>{point.x}</b><br/>',
                pointFormat: '{series.name}: {point.y}' + config._units + '<br/>Total: {point.stackTotal}' + config._units,
                style: {
                    fontSize: isPortraitMode.value ? "2.0vw" : "1vw"
                }
            },
            plotOptions: {
                series: {
                    marker: {
                        radius: 2
                    }
                },
                column: {
                    stacking: 'normal',
                    dataLabels: {
                        enabled: true,
                        style: {
                            fontSize: isPortraitMode.value ? "2.0vw" : "0.75vw"
                        }
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
        let topColor = chartRedColorTheme;
        let middleColor = chartBlueColorTheme;
        let bottomColor = chartDarkBlueColorTheme;
        switch(document.documentElement.className)
        {
            case "greenTheme":
                topColor = chartYellowColorTheme;
                middleColor = chartGreenColorTheme;
                bottomColor = chartDarkBlueColorTheme;
                break;
            case "orangeTheme":
                topColor = chartYellowColorTheme;
                middleColor = chartBlueColorTheme;
                bottomColor = chartOrangeColorTheme;
                break;
            case "purpleTheme":
                topColor = chartGreenColorTheme;
                middleColor = chartPurpleColorTheme;
                bottomColor = chartDarkBlueColorTheme;
                break;
            case "grayscaleTheme":
                topColor = chartLightGrayColorTheme;
                middleColor = chartGrayColorTheme;
                bottomColor = chartDarkGrayColorTheme;
                break;
        }

        if(this._useHighCharts)
        {
            for(let index = 0; index < this._highCharts.length; ++index)
            {
                this._highCharts[index].series[0].update({
                    color: topColor.backgroundColor,
                    type: 'column'
                });
                this._highCharts[index].series[1].update({
                    color: middleColor.backgroundColor,
                    type: 'column'
                });
                this._highCharts[index].series[2].update({
                    color: bottomColor.backgroundColor,
                    type: 'column'
                });
            }
        }
        else
        {
            for(let index = 0; index < this._charts.length; ++index)
            {
                this._charts[index].data.datasets[0].backgroundColor = topColor.backgroundColor;
                this._charts[index].data.datasets[1].backgroundColor = middleColor.backgroundColor;
                this._charts[index].update();
            }
        }
    }
}