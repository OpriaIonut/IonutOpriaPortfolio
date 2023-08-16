export class HorizontalSliderWithTitle
{
    private _textDiv: HTMLDivElement;
    private _currentValue: number = 0;
    private _minValue: number = 0;
    private _maxValue: number = 0;

    private _mouseX: number = 0;

    private _changeSlider: boolean = false;
    private _callback: (value: number) => void;

    constructor(parentNode: HTMLElement, name: string, minValue: number, maxValue: number, defaultValue: number, onSliderUpdate: (value: number) => void)
    {
        this._minValue = minValue;
        this._maxValue = maxValue;
        this._currentValue = defaultValue;
        this._callback = onSliderUpdate;

        let parent = document.createElement("div");
        parent.className = "horizontalSliderParent";
        parentNode.appendChild(parent);

        let title = document.createElement("div");
        title.className = "horizontalSliderTitle";
        title.innerHTML = name;
        parent.appendChild(title);

        let slider = document.createElement("div");
        slider.className = "horizontalSliderBtn";
        parent.appendChild(slider);

        this._textDiv = document.createElement("div");
        this._textDiv.className = "horizontalSliderText";
        this._textDiv.innerHTML = "" + this._currentValue;
        slider.appendChild(this._textDiv);

        slider.addEventListener('mouseenter', () => {
            slider.style.cursor = 'pointer';
        });
        slider.addEventListener('mouseleave', () => {
            slider.style.cursor = 'default';
        });
        slider.addEventListener('mousedown', (event: any) => {
            this._changeSlider = true;
            this._mouseX = event.clientX;
        });
        window.addEventListener('mouseup', () => {
            this._changeSlider = false;
        });
        window.addEventListener('mousemove', (event) => {
            this.calculateSliderValue(event.clientX);
        });
    }

    public resetValue()
    {
        this._currentValue = 0;
        this._textDiv.innerHTML = "0";
        this._callback(this._currentValue);
    }

    private calculateSliderValue(newMouseX: number)
    {
        if(!this._changeSlider)
            return;

        let diff = newMouseX - this._mouseX;

        this._currentValue += diff;
        if(this._currentValue < this._minValue)
            this._currentValue = this._maxValue - (this._minValue - this._currentValue);
        if(this._currentValue > this._maxValue)
            this._currentValue = this._minValue + (this._currentValue - this._maxValue);

        this._textDiv.innerHTML = "" + Math.floor(this._currentValue);
        this._callback(this._currentValue);

        this._mouseX = newMouseX;
    }
}