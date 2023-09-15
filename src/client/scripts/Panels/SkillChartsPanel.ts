import Chart from 'chart.js/auto';
import { ChartConfig } from '../../types';
import { chartRedColorTheme, chartBlueColorTheme, chartGreenColorTheme, chartPurpleColorTheme } from '../Themes/ChartThemes';

export class SkillChartsPanel
{
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

        this.createChart(parentNode, {
            _chartType: "bar",
            _labels: ["Unity", "Unreal Engine", "Blender", "Substance Painter", "Three.js", "Android Studio"],
            _chartID: "softwareChart",
            _units: " years",
            _dataSets: [
                { _label: "Professional", _colorTheme: chartRedColorTheme, _data: [2, 0, 0, 0, 2, 0] },
                { _label: "Hobby", _colorTheme: chartBlueColorTheme, _data: [7, 0.2, 6, 3, 0.6, 0.6] }
            ]
        });

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

        let chart = new Chart(chartCanvas, {
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
        });
    }
}