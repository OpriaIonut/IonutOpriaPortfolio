export class ButtonsWithSelection
{
    private _currentSelected: number = 0;
    private _names: string[] = [];
    private _spawnedButtons: HTMLDivElement[] = [];
    private _callback: (selectedName: string) => void;

    private _parent: HTMLDivElement;

    constructor(parentNode: HTMLElement, sectionName: string, onButtonChanged: (selectedName: string) => void)
    {
        this._callback = onButtonChanged;

        this._parent = document.createElement("div");
        this._parent.className = "buttonsWithSelectionParent";
        this._parent.style.display = "none";
        parentNode.appendChild(this._parent);

        let sectionTitle = document.createElement("div");
        sectionTitle.className = "buttonsWithSelectionTitle";
        sectionTitle.innerHTML = sectionName;
        this._parent.appendChild(sectionTitle);
    }

    public init(names: string[], firstSelectedIndex: number = 0)
    {
        this.clear();
        this._names = names;
        this._currentSelected = firstSelectedIndex;
        
        this._parent.style.display = "block";
        for(let index = 0; index < names.length; index++)
        {
            let btnElem = document.createElement("div");
            btnElem.className = index == firstSelectedIndex ? "buttonsWithSelectionSelected" : "buttonsWithSelection";
            btnElem.innerHTML = names[index];
            this._parent.appendChild(btnElem);
            this._spawnedButtons.push(btnElem);

            let newIndex = index;
            btnElem.onclick = () => {
                this.changeSelectedButton(newIndex);
            }
            btnElem.addEventListener('mouseenter', () => {
                btnElem.style.cursor = 'pointer';
            });
            btnElem.addEventListener('mouseleave', () => {
                btnElem.style.cursor = 'default';
            });
        }
    }

    public clear()
    {
        this._names = [];
        this._currentSelected = 0;
        this._parent.style.display = "none";
        for(let index = 0; index < this._spawnedButtons.length; ++index)
        {
            this._parent.removeChild(this._spawnedButtons[index]);
        }
        this._spawnedButtons = [];
    }

    public changeSelectedButton(newIndex: number)
    {
        this._spawnedButtons[this._currentSelected].className = "buttonsWithSelection";
        this._currentSelected = newIndex;
        this._spawnedButtons[this._currentSelected].className = "buttonsWithSelectionSelected";
        this._callback(this._names[newIndex]);
    }
}