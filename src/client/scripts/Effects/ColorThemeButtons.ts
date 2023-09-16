import { homePanel } from "../../client";

const colorThemes: any = {
    blueTheme: "#189C9B", 
    purpleTheme: "#ca18cd", 
    orangeTheme: "#cd4b18"
};

export class ColorThemeButtons
{
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
            elem.onclick = () => { document.documentElement.className = keys[index]; homePanel.updateBanner(); };
            parentElem.appendChild(elem);
        }
    }
}