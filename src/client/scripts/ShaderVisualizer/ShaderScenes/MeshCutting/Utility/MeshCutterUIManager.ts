import { Color } from "three";
import { DebugUI } from "../../../../ThreeVisualizer/DebugGUI";

//Utility script to handle ui-management for the mesh cutting experiment
export class MeshCutterUIManager
{
    private _debugUI: DebugUI;
    private _artistCredits: HTMLDivElement;

    //Callbacks for all events that can be created by player input
    private _cutCallbacks: (() => void)[] = [];
    private _resetCallbacks: (() => void)[] = [];
    private _randomizeCutsCallbacks: (() => void)[] = [];

    private _expandRadiusCallbacks: (() => void)[] = [];
    private _meshChangedCallbacks: (() => void)[] = [];
    private _cutModeChangedCallbacks: (() => void)[] = [];
    private _planesChangedCallbacks: (() => void)[] = [];
    private _fillTypeChangedCallbacks: (() => void)[] = [];
    private _fillTextureChangedCallbacks: (() => void)[] = [];
    private _fillColorChangedCallbacks: (() => void)[] = [];

    //Arrays which holds the possible values that we can have in our dropdowns
    private _availableMeshNames = ["Torus Knot", "Heart", "Mecha Girl", "God Eater Sword", "City"];
    private _availableCutModeNames = ["Horizontal", "Vertical", "Depth", "Grid", "Random"];
    private _availableFillTypeNames = ["No Fill", "Color Fill", "Texture Fill"];
    private _availableTextureNames = ["Orange", "Watermelon", "Rock", "Wood", "Lava", "Blood", "Blood Veins"];

    //Object that holds all settings that can be found in the ui
    private _debugUISettings = {
        numOfPlanes: 5,
        expandRadius: 0.0,
        currentMesh: "Heart",
        cutMode: "Vertical",
        fillType: "Texture Fill",
        fillTexture: "Orange",
        fillColor: new Color(0x2e70a6),
        cutDuration: "0ms",
    
        cut: () => { this.invokeCallbacks(this._cutCallbacks); },
        reset: () => { this.invokeCallbacks(this._resetCallbacks); },
        randomizeCuts: () => { this.invokeCallbacks(this._randomizeCutsCallbacks); }
    };

    constructor()
    {
        //Create the ui
        this._debugUI = new DebugUI();

        //Add the ui to the screen and position it on the top-right
        let guiHtml = this._debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        //Create a div that can be used to credit artists for their work (for meshes taken from the internet)
        this._artistCredits = document.createElement("div");
        this._artistCredits.id = "artistCredits";
        this._artistCredits.style.display = "none";
        this._artistCredits.innerHTML = "Please credit <a href='https://sketchfab.com/3d-models/city-1f50f0d6ec5a493d8e91d7db1106b324'>SpatialNeglect</a> for the 3D model";
        guiParent.appendChild(this._artistCredits);

        //Bind functions to work properly in callbacks
        this.onMeshChanged = this.onMeshChanged.bind(this);
        this.onNumOfCutsChanged = this.onNumOfCutsChanged.bind(this);
        this.onCutModeChanged = this.onCutModeChanged.bind(this);
        this.onFillTypeChanged = this.onFillTypeChanged.bind(this);
        this.onFillColorChanged = this.onFillColorChanged.bind(this);
        this.onFillTextureChanged = this.onFillTextureChanged.bind(this);
    }

    //Called when we hide the experiment, resets the ui to it's default state
    public reset()
    {
        let guiHtml = this._debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.removeChild(guiHtml);
        guiParent.removeChild(this._artistCredits);
        
        //Remove all listeners
        this._cutCallbacks = [];
        this._resetCallbacks = [];
        this._randomizeCutsCallbacks = [];
        this._expandRadiusCallbacks = [];
        this._meshChangedCallbacks = [];
        this._cutModeChangedCallbacks = [];
        this._planesChangedCallbacks = [];
        this._fillTypeChangedCallbacks = [];
        this._fillTextureChangedCallbacks = [];
        this._fillColorChangedCallbacks = [];
    }

    //---------------------------Getters & Setters
    public getExpandRadius() { return this._debugUISettings.expandRadius; }
    public getCutMode() { return this._debugUISettings.cutMode; }
    public getNumOfCutPlanes() { return this._debugUISettings.numOfPlanes; }
    public getFillType() { return this._debugUISettings.fillType; }
    public getFillColor() { return this._debugUISettings.fillColor; }
    public getCurrentTextureName() { return this._debugUISettings.fillTexture; }
    public getCurrentMeshName() { return this._debugUISettings.currentMesh; }

    public setExpandRadius(value: number) { this._debugUISettings.expandRadius = value; }
    public setCutDuration(value: number) { this._debugUISettings.cutDuration = `${value.toFixed(2)}ms`; }
    public setArtistCreditsDisplay(enabled: boolean) { enabled ? "block" : "none" }
    public setArtistCreditsName(name: string) { this._artistCredits.innerHTML = name; }

    //---------------------------UI Menu
    //Cut menu is the menu that you see by default (before the mesh is cut)
    public displayCutMenu() 
    {
        this._debugUI.reset();

        this._debugUI.addDropdown("", this._debugUISettings, "currentMesh", this._availableMeshNames, "Mesh", this.onMeshChanged);
        this._debugUI.addDropdown("", this._debugUISettings, "cutMode", this._availableCutModeNames, "Cut Mode", this.onCutModeChanged);

        //Based on the cut mode and the meshes selected, limit how many planes we can have
        let maxCutPlanes = this._debugUISettings.cutMode == "Grid" ? 5 : 10;
        if (this._debugUISettings.currentMesh == "City")
            maxCutPlanes = this._debugUISettings.cutMode == "Grid" ? 3 : 6;

        if (this._debugUISettings.numOfPlanes > maxCutPlanes)
            this._debugUISettings.numOfPlanes = maxCutPlanes;

        this._debugUI.addSlider("", this._debugUISettings, "numOfPlanes", 1, maxCutPlanes, "Number of Cuts", this.onNumOfCutsChanged);
        if (this._debugUISettings.cutMode == "Random")
            this._debugUI.addButton("", this._debugUISettings, "randomizeCuts", "Randomize Cuts");

        this._debugUI.addButton("", this._debugUISettings, "cut", "Cut");
    }

    //Reset menu is the menu that you see after you cut a mesh
    public displayResetMenu() 
    {
        this._debugUI.reset();

        //Update positions to current slider value
        this.invokeCallbacks(this._expandRadiusCallbacks);
        this._debugUI.addSlider("", this._debugUISettings, "expandRadius", 0.0, 3.0, "Expand Radius", () => {
            this.invokeCallbacks(this._expandRadiusCallbacks);
        });

        this._debugUI.addDropdown("", this._debugUISettings, "fillType", this._availableFillTypeNames, "Fill Type", this.onFillTypeChanged);
        if (this._debugUISettings.fillType == "Texture Fill")
            this._debugUI.addDropdown("", this._debugUISettings, "fillTexture", this._availableTextureNames, "Fill Texture", this.onFillTextureChanged);
        if (this._debugUISettings.fillType == "Color Fill")
            this._debugUI.addColorPicker("", this._debugUISettings, "fillColor", "Fill Color", this.onFillColorChanged);

        this._debugUI.addButton("", this._debugUISettings, "reset", "Reset");

        this._debugUI.addText("", this._debugUISettings, "cutDuration", "Cut Duration", false);
    }

    //---------------------------Events
    public subscribe_OnCutClicked(func: () => void) { this._cutCallbacks.push(func); }
    public unsubscribe_OnCutClicked(func: () => void)
    {
        let index = this._cutCallbacks.findIndex(func);
        if(index >= 0)
            this._cutCallbacks.splice(index, 1);
    }

    public subscribe_OnResetClicked(func: () => void) { this._resetCallbacks.push(func); }
    public unsubscribe_OnResetClicked(func: () => void)
    {
        let index = this._resetCallbacks.findIndex(func);
        if(index >= 0)
            this._resetCallbacks.splice(index, 1);
    }
    
    public subscribe_OnRandomizeCutsClicked(func: () => void) { this._randomizeCutsCallbacks.push(func); }
    public unsubscribe_OnRandomizeCutsClicked(func: () => void)
    {
        let index = this._randomizeCutsCallbacks.findIndex(func);
        if(index >= 0)
            this._randomizeCutsCallbacks.splice(index, 1);
    }

    public subscribe_OnExpandRadiusChanged(func: () => void) { this._expandRadiusCallbacks.push(func); }
    public unsubscribe_OnExpandRadiusChanged(func: () => void)
    {
        let index = this._expandRadiusCallbacks.findIndex(func);
        if(index >= 0)
            this._expandRadiusCallbacks.splice(index, 1);
    }
    
    public subscribe_OnMeshChanged(func: () => void) { this._meshChangedCallbacks.push(func); }
    public unsubscribe_OnMeshChanged(func: () => void)
    {
        let index = this._meshChangedCallbacks.findIndex(func);
        if(index >= 0)
            this._meshChangedCallbacks.splice(index, 1);
    }
    
    public subscribe_OnCutModeChanged(func: () => void) { this._cutModeChangedCallbacks.push(func); }
    public unsubscribe_OnCutModeChanged(func: () => void)
    {
        let index = this._cutModeChangedCallbacks.findIndex(func);
        if(index >= 0)
            this._cutModeChangedCallbacks.splice(index, 1);
    }
    
    public subscribe_OnNumOfPlanesChanged(func: () => void) { this._planesChangedCallbacks.push(func); }
    public unsubscribe_OnNumOfPlanesChanged(func: () => void)
    {
        let index = this._planesChangedCallbacks.findIndex(func);
        if(index >= 0)
            this._planesChangedCallbacks.splice(index, 1);
    }
    
    public subscribe_OnFillTypeChanged(func: () => void) { this._fillTypeChangedCallbacks.push(func); }
    public unsubscribe_OnFillTypeChanged(func: () => void)
    {
        let index = this._fillTypeChangedCallbacks.findIndex(func);
        if(index >= 0)
            this._fillTypeChangedCallbacks.splice(index, 1);
    }
    
    public subscribe_OnFillTextureChanged(func: () => void) { this._fillTextureChangedCallbacks.push(func); }
    public unsubscribe_OnFillTextureChanged(func: () => void)
    {
        let index = this._fillTextureChangedCallbacks.findIndex(func);
        if(index >= 0)
            this._fillTextureChangedCallbacks.splice(index, 1);
    }
    
    public subscribe_OnFillColorChanged(func: () => void) { this._fillColorChangedCallbacks.push(func); }
    public unsubscribe_OnFillColorChanged(func: () => void)
    {
        let index = this._fillColorChangedCallbacks.findIndex(func);
        if(index >= 0)
            this._fillColorChangedCallbacks.splice(index, 1);
    }

    //---------------------------UI Callbacks
    private onMeshChanged()
    {
        this.invokeCallbacks(this._meshChangedCallbacks);
    }

    private onNumOfCutsChanged()
    {
        this.invokeCallbacks(this._planesChangedCallbacks);
    }

    private onCutModeChanged()
    {
        this.displayCutMenu();
        this.invokeCallbacks(this._cutModeChangedCallbacks);
    }
    
    private onFillTypeChanged()
    {
        this.displayResetMenu();
        this.invokeCallbacks(this._fillTypeChangedCallbacks);
    }
    
    private onFillColorChanged(value: any)
    {
        this._debugUISettings.fillColor.setStyle(value);
        this.invokeCallbacks(this._fillColorChangedCallbacks);
    }

    private onFillTextureChanged()
    {
        this.invokeCallbacks(this._fillTextureChangedCallbacks);
    }

    //---------------------------Utility
    private invokeCallbacks(func: (() => void)[])
    {
        for(let index = 0; index < func.length; ++index)
        {
            func[index]();
        }
    }
}