declare type NavbarData =
{
    name: string,
    target: HTMLElement,
    navbarBtn?: HTMLElement
}

export class NavBar
{
    private _sections: NavbarData[];

    constructor()
    {
        this._sections = [
            { name: "About Me", target: document.getElementById("aboutMeParent")!, navbarBtn: undefined },
            { name: "Skills", target: document.getElementById("skillCharts")!, navbarBtn: undefined },
            { name: "Professional Projects", target: document.getElementById("workProjectsPanel")!, navbarBtn: undefined },
            { name: "Personal Projects", target: document.getElementById("gameProjectsPanel")!, navbarBtn: undefined },
            { name: "Live Experiments", target: document.getElementById("shaderProjectsPanel")!, navbarBtn: undefined },
            { name: "3D Models", target: document.getElementById("artProjectsPanel")!, navbarBtn: undefined },
        ];

        let navbarParent = document.createElement("div");
        navbarParent.id = "navbarParent";
        document.body.appendChild(navbarParent);
        
        let navbarBorder = document.createElement("div");
        navbarBorder.id = "navbarBorder";
        navbarParent.appendChild(navbarBorder);

        for(let index = 0; index < this._sections.length; ++index)
        {
            let div = document.createElement("div");
            div.className = "navbarSection";
            div.innerHTML = this._sections[index].name;
            this._sections[index].navbarBtn = div;

            let elementIndex = index;
            div.onclick = () => {
                for(let i = 0; i < this._sections.length; ++i)
                {
                    this._sections[i].navbarBtn!.className = "navbarSection";
                }

                this._sections[elementIndex].navbarBtn!.className = "navbarSectionSelected";
                if(this._sections[elementIndex].name == "About Me" || (this._sections[elementIndex].name == "Shader Projects") || (this._sections[elementIndex].name == "3D Models"))
                    this._sections[elementIndex].target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
                else
                    this._sections[elementIndex].target.scrollIntoView({ behavior: "smooth" });
            };
            navbarParent.appendChild(div);
        }
        this._sections[0].navbarBtn!.className = "navbarSectionSelected";
    }

    public update()
    {
        let minIndex = -1;
        let minDiff = 99999;
        for(let i = 0; i < this._sections.length; ++i)
        {
            this._sections[i].navbarBtn!.className = "navbarSection";
            let dist = this.getRelativePositionFromCenter(this._sections[i].target);
            if(Math.abs(dist.y) < minDiff)
            {
                minDiff = Math.abs(dist.y);
                minIndex = i;
            }
        }
        if(minIndex != -1)
        {
            this._sections[minIndex].navbarBtn!.className = "navbarSectionSelected";
        }
    }

    public getRelativePositionFromCenter(element: HTMLElement) 
    {
        const rect = element.getBoundingClientRect();

        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;

        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;

        return {
            x: elementCenterX - viewportCenterX,
            y: elementCenterY - viewportCenterY
        };
    }
}