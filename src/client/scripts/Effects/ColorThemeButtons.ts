import { aboutMePanel, artProjectsPanel, endingPanel, gameProjectsPanel, homePanel, skillChartsPanel, workProjectsPanel } from "../../client";

const colorThemes: any = {
    blueTheme: "#189C9B", 
    purpleTheme: "#ca18cd", 
    orangeTheme: "#cd4b18",
    greenTheme: "#27cd18",
    grayscaleTheme: "#777777"
};

export class ColorThemeButtons
{
    private _activeBtn!: HTMLDivElement;
    private _buttons: HTMLDivElement[] = [];

    constructor()
    {
        let parentElem = document.createElement("div");
        parentElem.id = "colorThemeBtnParent";
        document.body.appendChild(parentElem);

        let keys = Object.keys(colorThemes);
        for(let index = 0; index < keys.length; ++index)
        {
            let elem = document.createElement("div");
            elem.className = "colorThemeBtn";
            elem.style.backgroundColor = colorThemes[keys[index]];

            elem.onclick = () => { 
                if(keys[index] == document.documentElement.className)
                    return;

                document.documentElement.className = keys[index]; 
                homePanel.updateBanner(); 
                aboutMePanel.updateColorTheme();
                skillChartsPanel.updateChartColors();
                workProjectsPanel.updateColorTheme();
                gameProjectsPanel.updateColorTheme();
                artProjectsPanel.updateColorTheme();
                endingPanel.updateColorTheme();
                
                this.setActiveBorder();
            };
            parentElem.appendChild(elem);
            this._buttons.push(elem);
        }
        this.setActiveBorder();
    }

    private setActiveBorder()
    {
        let keys = Object.keys(colorThemes);
        for(let index = 0; index < keys.length; ++index)
        {
            this._buttons[index].style.border = "";
            if(keys[index] == document.documentElement.className)
            {
                this._buttons[index].style.border = "3px solid #fff";
            }
        }
    }
}