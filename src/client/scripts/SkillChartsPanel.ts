import Chart from 'chart.js/auto';

export class SkillChartsPanel
{
    constructor()
    {
        this.createElements();
    }

    private createElements()
    {
        const parentNode = document.createElement("div");
        parentNode.id = "skillCharts";
        parentNode.className = "fullwidth";
        document.body.appendChild(parentNode);

        //Languages
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

        this.createChart(parentNode, "languageChartCanvas", [
            'C++',
            'C#',
            'Typescript',
            'Python',
            'Java',
            'SQL',
            'GLSL'
        ], [0.4, 2, 2, 0, 0, 0, 2], [5, 7, 0.6, 0.3, 0.4, 0.6, 0.6]);
        
        this.createChart(parentNode, "softwareChartCanvas", [
            'Unity',
            'Unreal Engine',
            'Blender',
            'Substance Painter',
            'Three.js',
            'Android Studio'
        ], [2, 0, 0, 0, 2, 0], [7, 0.2, 6, 3, 0.6, 0.6]);

        
        this.createChart(parentNode, "selfAssesmentChart", [
            "C++",
            "C#",
            "Typescript",
            "GLSL",
            'Unity',
            'Unreal Engine',
            'Blender',
            'Substance Painter',
            'Three.js'
        ], [], [5, 7, 7, 4, 8, 1, 8, 5, 9], "line", 10);
    }

    private createChart(parentNode: HTMLElement, id: string, labels: string[], profDataSet: number[], hobbyDataSet: number[], chartType: string = "bar", maxScale?: number)
    {
        let languageData = {
            labels: labels,
            datasets: [
                {
                label: 'Professional',
                data: profDataSet,
                fill: true,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgb(255, 99, 132)',
                pointBackgroundColor: 'rgb(255, 99, 132)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(255, 99, 132)'
            }, {
                label: 'Hobby',
                data: hobbyDataSet,
                fill: true,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                pointBackgroundColor: 'rgb(54, 162, 235)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(54, 162, 235)'
            }]
        };
        if(profDataSet.length == 0)
            languageData.datasets = [languageData.datasets[1]];

        let canvasParent = document.createElement("div");
        canvasParent.id = id;
        parentNode.appendChild(canvasParent);

        let languageChartCanvas = document.createElement("canvas");
        //languageChartCanvas.id = id;
        canvasParent.appendChild(languageChartCanvas);

        let languageChart = new Chart(languageChartCanvas, {
            type: chartType as any,
            data: languageData,
            options: {
                legend:{
                    position: 'left',
                    align: 'center', // Align the legend items vertically
                    labels: {
                        boxWidth: 10, // Width of each legend item's colored box
                        padding: 10   // Spacing between legend items
                    }
                },
                scales:{
                    y: {
                        max: maxScale,
                        beginAtZero: true
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3
                    }
                }
            }
        });
        languageChart.resize(500, 500);
    }
}