import { GUI } from "dat.gui";
import { ShaderMaterial } from "three";

declare module "dat.gui" {
    interface GUI {
        addThreeColor(obj: any, varName: string, eventName: string): GUIController;
        addThreeUniformColor(material: ShaderMaterial, uniformName: string, label: string, eventName: string): GUIController
    }
}

GUI.prototype.addThreeColor = function(obj, varName, eventName) {
    // threejs & dat.gui have color incompatible formats so we use a dummy data as target :
    var dummy: any = {};
    dummy[varName] = obj[varName].getStyle(); 

    let colorPicker = this.addColor(dummy,varName).onChange((colorValue: any) => {
        obj[varName].setStyle(colorValue);
    });
    return colorPicker;
};
GUI.prototype.addThreeUniformColor = function(material, uniformName, label, eventName){
    return this.addThreeColor(material.uniforms[uniformName], "value",eventName).name(label || uniformName);
};

export class DebugUI
{
    private _gui: GUI | undefined;

    private _folders: Map<string, GUI> = new Map();

    constructor()
    {
        this._gui = new GUI({width: 350});
    }

    public async despawn(): Promise<void> 
    {
        
    }

    public applyGameConfig(gameConfig: any)
    {
        if(!gameConfig.debug.debugUI || process.env.DEV_MODE == "prod")
            this.hideUI();
    }

    public hideUI()
    {
        this._gui!.domElement.style.display = "none";
    }

    public addFolder(folderName: string, parentName: string)
    {
        if(!this._folders.has(folderName))
        {
            let parent = this._folders.get(parentName);
            let newFolder: GUI;
            if(parent === undefined)
                newFolder = this._gui!.addFolder(folderName);
            else
                newFolder = parent.addFolder(folderName);
            this._folders.set(folderName, newFolder);
        }
    }

    /**
     * 
     * @param folderName 
     * @param target 
     * @param propName Name of a string property from the target object
     * @param displayName 
     */
    public addText(folderName: string, target: Object, propName: string, displayName: string, onChange?: (value: any) => void)
    {
        let folder = this._folders.get(folderName);
        let targetGUI = folder !== undefined ? folder : this._gui;

        let message = `${folderName}_${propName}_${displayName}`;
        targetGUI?.add(target, propName as any).name(displayName).onChange((value) => { if(onChange !== undefined) onChange(value) }).listen();
        return message;
    }

    /**
     * 
     * @param folderName 
     * @param target 
     * @param propName Name of a number property from the target object
     * @param min 
     * @param max 
     * @param displayName 
     */
    public addSlider(folderName: string, target: Object, propName: string, min: number, max: number, displayName: string, onChange?: (value: any) => void)
    {
        let folder = this._folders.get(folderName);
        let targetGUI = folder !== undefined ? folder : this._gui;
        
        let message = `${folderName}_${propName}_${displayName}`;
        targetGUI?.add(target, propName as any, min, max).name(displayName).onChange((value) => { if(onChange !== undefined) onChange(value) }).listen();
        return message;
    }

    /**
     * 
     * @param folderName 
     * @param target 
     * @param propName Name of a boolean property from the target object
     * @param displayName 
     */
    public addCheckbox(folderName: string, target: Object, propName: string, displayName: string, onChange?: (value: any) => void)
    {
        let folder = this._folders.get(folderName);
        let targetGUI = folder !== undefined ? folder : this._gui;

        let message = `${folderName}_${propName}_${displayName}`;
        targetGUI?.add(target, propName as any).name(displayName).onChange((value) => { if(onChange !== undefined) onChange(value) }).listen();
        return message;
    }

    /**
     * Add a color picker
     * @param folderName 
     * @param target 
     * @param propName Name of a color property from the target object. Color property can be defined like: '#FF0000' or [ 0, 128, 255, 0.3 ] or { h: 350, s: 0.9, v: 0.3 }
     * @param displayName 
     */
    public addColorPicker(folderName: string, target: Object, propName: string, displayName: string, onChange?: (value: any) => void)
    {
        let folder = this._folders.get(folderName);
        let targetGUI = folder !== undefined ? folder : this._gui;

        let message = `${folderName}_${propName}_${displayName}`;
        targetGUI?.addThreeColor(target, propName, message).name(displayName).onChange((value) => { if(onChange !== undefined) onChange(value) }).listen();
        return message;
    }

    /**
     * 
     * @param folderName 
     * @param target 
     * @param propName Name of a function property from the target object
     * @param displayName 
     */
    public addButton(folderName: string, target: Object, propName: string, displayName: string)
    {
        let folder = this._folders.get(folderName);
        let targetGUI = folder !== undefined ? folder : this._gui;

        let message = `${folderName}_${propName}_${displayName}`;
        targetGUI?.add(target, propName as any).name(displayName);
        return message;
    }

    /**
     * 
     * @param folderName 
     * @param target 
     * @param propName Name of the property that will be changed when the dropdown changes, from the target object
     * @param dropdownValues Values for the dropdown
     * @param displayName 
     */
    public addDropdown(folderName: string, target: Object, propName: string, dropdownValues: string[], displayName: string, onChange?: (value: any) => void)
    {
        let folder = this._folders.get(folderName);
        let targetGUI = folder !== undefined ? folder : this._gui;
        
        let message = `${folderName}_${propName}_${displayName}`;
        targetGUI?.add(target, propName as any, dropdownValues).name(displayName).onChange((value) => { if(onChange !== undefined) onChange(value) }).listen();
        return message;
    }

    public removeProperty(folderName: string, propName: string)
    {
        let folder = this._folders.get(folderName);
        let targetGUI = folder !== undefined ? folder : this._gui;

        if(targetGUI !== undefined)
        {
            for(let index = 0; index < targetGUI.__controllers.length; index++)
            {
                if(targetGUI.__controllers[index].property == propName)
                {
                    targetGUI.remove(targetGUI.__controllers[index]);
                }
            }
        }
    }

    public removeFolder(folderName: string)
    {
        let folder = this._folders.get(folderName);
        if(folder !== undefined)
        {
            folder.parent.removeFolder(folder);
            this._folders.delete(folderName);
        }
    }
}