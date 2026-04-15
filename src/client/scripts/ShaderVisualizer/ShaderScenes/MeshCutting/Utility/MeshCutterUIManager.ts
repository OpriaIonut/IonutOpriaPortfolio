import { Color } from "three";
import { DebugUI } from "../../../../ThreeVisualizer/DebugGUI";

//Utility script to handle ui-management for the mesh cutting experiment
export class MeshCutterUIManager
{
    private debugUI: DebugUI;

    //Callbacks for all events that can be created by player input
    private cutCallbacks: (() => void)[] = [];
    private resetCallbacks: (() => void)[] = [];
    private randomizeCutsCallbacks: (() => void)[] = [];

    private expandRadiusCallbacks: (() => void)[] = [];
    private meshChangedCallbacks: (() => void)[] = [];
    private cutModeChangedCallbacks: (() => void)[] = [];
    private planesChangedCallbacks: (() => void)[] = [];
    private fillTypeChangedCallbacks: (() => void)[] = [];
    private fillTextureChangedCallbacks: (() => void)[] = [];
    private fillColorChangedCallbacks: (() => void)[] = [];

    //Arrays which holds the possible values that we can have in our dropdowns
    private availableMeshNames = ["Torus Knot", "Heart", "Mecha Girl", "God Eater Sword", "City"];
    private availableCutModeNames = ["Horizontal", "Vertical", "Depth", "Grid", "Random"];
    private availableFillTypeNames = ["No Fill", "Color Fill", "Texture Fill"];
    private availableTextureNames = ["Orange", "Watermelon", "Rock", "Wood", "Lava", "Blood", "Blood Veins"];

    //Object that holds all settings that can be found in the ui
    private debugUISettings = {
        numOfPlanes: 5,
        expandRadius: 0.0,
        currentMesh: "Heart",
        cutMode: "Vertical",
        fillType: "Texture Fill",
        fillTexture: "Orange",
        fillColor: new Color(0x2e70a6),
        cutDuration: "0ms",
    
        cut: () => { this.invokeCallbacks(this.cutCallbacks); },
        reset: () => { this.invokeCallbacks(this.resetCallbacks); },
        randomizeCuts: () => { this.invokeCallbacks(this.randomizeCutsCallbacks); }
    };

    constructor()
    {
        //Create the ui
        this.debugUI = new DebugUI();

        //Add the ui to the screen and position it on the top-right
        let guiHtml = this.debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

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
        let guiHtml = this.debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.removeChild(guiHtml);
        
        //Remove all listeners
        this.cutCallbacks = [];
        this.resetCallbacks = [];
        this.randomizeCutsCallbacks = [];
        this.expandRadiusCallbacks = [];
        this.meshChangedCallbacks = [];
        this.cutModeChangedCallbacks = [];
        this.planesChangedCallbacks = [];
        this.fillTypeChangedCallbacks = [];
        this.fillTextureChangedCallbacks = [];
        this.fillColorChangedCallbacks = [];
    }

    //---------------------------Getters & Setters
    public getExpandRadius() { return this.debugUISettings.expandRadius; }
    public getCutMode() { return this.debugUISettings.cutMode; }
    public getNumOfCutPlanes() { return this.debugUISettings.numOfPlanes; }
    public getFillType() { return this.debugUISettings.fillType; }
    public getFillColor() { return this.debugUISettings.fillColor; }
    public getCurrentTextureName() { return this.debugUISettings.fillTexture; }
    public getCurrentMeshName() { return this.debugUISettings.currentMesh; }

    public setExpandRadius(value: number) { this.debugUISettings.expandRadius = value; }
    public setCutDuration(value: number) { this.debugUISettings.cutDuration = `${value.toFixed(2)}ms`; }

    //---------------------------UI Menu
    //Cut menu is the menu that you see by default (before the mesh is cut)
    public displayCutMenu() 
    {
        this.debugUI.reset();

        this.debugUI.addDropdown("", this.debugUISettings, "currentMesh", this.availableMeshNames, "Mesh", this.onMeshChanged);
        this.debugUI.addDropdown("", this.debugUISettings, "cutMode", this.availableCutModeNames, "Cut Mode", this.onCutModeChanged);

        //Based on the cut mode and the meshes selected, limit how many planes we can have
        let maxCutPlanes = this.debugUISettings.cutMode == "Grid" ? 5 : 10;
        if (this.debugUISettings.currentMesh == "City")
            maxCutPlanes = this.debugUISettings.cutMode == "Grid" ? 3 : 6;

        if (this.debugUISettings.numOfPlanes > maxCutPlanes)
            this.debugUISettings.numOfPlanes = maxCutPlanes;

        this.debugUI.addSlider("", this.debugUISettings, "numOfPlanes", 1, maxCutPlanes, "Number of Cuts", this.onNumOfCutsChanged);
        if (this.debugUISettings.cutMode == "Random")
            this.debugUI.addButton("", this.debugUISettings, "randomizeCuts", "Randomize Cuts");

        this.debugUI.addButton("", this.debugUISettings, "cut", "Cut");
    }

    //Reset menu is the menu that you see after you cut a mesh
    public displayResetMenu() 
    {
        this.debugUI.reset();

        //Update positions to current slider value
        this.invokeCallbacks(this.expandRadiusCallbacks);
        this.debugUI.addSlider("", this.debugUISettings, "expandRadius", 0.0, 3.0, "Expand Radius", () => {
            this.invokeCallbacks(this.expandRadiusCallbacks);
        });

        this.debugUI.addDropdown("", this.debugUISettings, "fillType", this.availableFillTypeNames, "Fill Type", this.onFillTypeChanged);
        if (this.debugUISettings.fillType == "Texture Fill")
            this.debugUI.addDropdown("", this.debugUISettings, "fillTexture", this.availableTextureNames, "Fill Texture", this.onFillTextureChanged);
        if (this.debugUISettings.fillType == "Color Fill")
            this.debugUI.addColorPicker("", this.debugUISettings, "fillColor", "Fill Color", this.onFillColorChanged);

        this.debugUI.addButton("", this.debugUISettings, "reset", "Reset");

        this.debugUI.addText("", this.debugUISettings, "cutDuration", "Cut Duration", false);
    }

    //---------------------------Events
    public subscribe_OnCutClicked(func: () => void) { this.cutCallbacks.push(func); }
    public unsubscribe_OnCutClicked(func: () => void)
    {
        let index = this.cutCallbacks.findIndex(func);
        if(index >= 0)
            this.cutCallbacks.splice(index, 1);
    }

    public subscribe_OnResetClicked(func: () => void) { this.resetCallbacks.push(func); }
    public unsubscribe_OnResetClicked(func: () => void)
    {
        let index = this.resetCallbacks.findIndex(func);
        if(index >= 0)
            this.resetCallbacks.splice(index, 1);
    }
    
    public subscribe_OnRandomizeCutsClicked(func: () => void) { this.randomizeCutsCallbacks.push(func); }
    public unsubscribe_OnRandomizeCutsClicked(func: () => void)
    {
        let index = this.randomizeCutsCallbacks.findIndex(func);
        if(index >= 0)
            this.randomizeCutsCallbacks.splice(index, 1);
    }

    public subscribe_OnExpandRadiusChanged(func: () => void) { this.expandRadiusCallbacks.push(func); }
    public unsubscribe_OnExpandRadiusChanged(func: () => void)
    {
        let index = this.expandRadiusCallbacks.findIndex(func);
        if(index >= 0)
            this.expandRadiusCallbacks.splice(index, 1);
    }
    
    public subscribe_OnMeshChanged(func: () => void) { this.meshChangedCallbacks.push(func); }
    public unsubscribe_OnMeshChanged(func: () => void)
    {
        let index = this.meshChangedCallbacks.findIndex(func);
        if(index >= 0)
            this.meshChangedCallbacks.splice(index, 1);
    }
    
    public subscribe_OnCutModeChanged(func: () => void) { this.cutModeChangedCallbacks.push(func); }
    public unsubscribe_OnCutModeChanged(func: () => void)
    {
        let index = this.cutModeChangedCallbacks.findIndex(func);
        if(index >= 0)
            this.cutModeChangedCallbacks.splice(index, 1);
    }
    
    public subscribe_OnNumOfPlanesChanged(func: () => void) { this.planesChangedCallbacks.push(func); }
    public unsubscribe_OnNumOfPlanesChanged(func: () => void)
    {
        let index = this.planesChangedCallbacks.findIndex(func);
        if(index >= 0)
            this.planesChangedCallbacks.splice(index, 1);
    }
    
    public subscribe_OnFillTypeChanged(func: () => void) { this.fillTypeChangedCallbacks.push(func); }
    public unsubscribe_OnFillTypeChanged(func: () => void)
    {
        let index = this.fillTypeChangedCallbacks.findIndex(func);
        if(index >= 0)
            this.fillTypeChangedCallbacks.splice(index, 1);
    }
    
    public subscribe_OnFillTextureChanged(func: () => void) { this.fillTextureChangedCallbacks.push(func); }
    public unsubscribe_OnFillTextureChanged(func: () => void)
    {
        let index = this.fillTextureChangedCallbacks.findIndex(func);
        if(index >= 0)
            this.fillTextureChangedCallbacks.splice(index, 1);
    }
    
    public subscribe_OnFillColorChanged(func: () => void) { this.fillColorChangedCallbacks.push(func); }
    public unsubscribe_OnFillColorChanged(func: () => void)
    {
        let index = this.fillColorChangedCallbacks.findIndex(func);
        if(index >= 0)
            this.fillColorChangedCallbacks.splice(index, 1);
    }

    //---------------------------UI Callbacks
    private onMeshChanged()
    {
        this.invokeCallbacks(this.meshChangedCallbacks);
    }

    private onNumOfCutsChanged()
    {
        this.invokeCallbacks(this.planesChangedCallbacks);
    }

    private onCutModeChanged()
    {
        this.displayCutMenu();
        this.invokeCallbacks(this.cutModeChangedCallbacks);
    }
    
    private onFillTypeChanged()
    {
        this.displayResetMenu();
        this.invokeCallbacks(this.fillTypeChangedCallbacks);
    }
    
    private onFillColorChanged(value: any)
    {
        this.debugUISettings.fillColor.setStyle(value);
        this.invokeCallbacks(this.fillColorChangedCallbacks);
    }

    private onFillTextureChanged()
    {
        this.invokeCallbacks(this.fillTextureChangedCallbacks);
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