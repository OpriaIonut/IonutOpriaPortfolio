import { lerp } from "three/src/math/MathUtils";
import { isPortraitMode, timeStats } from "../../client";

export class MouseAnimation
{
    private _innerSpeed: number;
    private _outerSpeed: number;

    private _innerElem: HTMLDivElement;
    private _outerElem: HTMLDivElement;

    private _innerPos = { x: 0, y: 0 };
    private _outerPos = { x: 0, y: 0 };
    private _lastMousePos = { x: 0, y: 0 };

    constructor(innerSpeed: number, outerSpeed: number)
    {
        this._innerSpeed = innerSpeed;
        this._outerSpeed = outerSpeed;

        this._innerElem = document.createElement("div");
        this._innerElem.id = "mouseMoveInner";
        document.body.appendChild(this._innerElem);

        this._outerElem = document.createElement("div");
        this._outerElem.id = "mouseMoveOuter";
        document.body.appendChild(this._outerElem);

        this.onMouseMove = this.onMouseMove.bind(this);
        window.addEventListener('mousemove', this.onMouseMove);
    }

    public update()
    {
        this._innerElem.style.display = isPortraitMode.value ? "none" : "block";
        this._outerElem.style.display = isPortraitMode.value ? "none" : "block";

        this._innerPos.x = lerp(this._innerPos.x, this._lastMousePos.x, this._innerSpeed * timeStats.deltaTime);
        this._innerPos.y = lerp(this._innerPos.y, this._lastMousePos.y, this._innerSpeed * timeStats.deltaTime);

        this._outerPos.x = lerp(this._outerPos.x, this._lastMousePos.x, this._outerSpeed * timeStats.deltaTime);
        this._outerPos.y = lerp(this._outerPos.y, this._lastMousePos.y, this._outerSpeed * timeStats.deltaTime);

        this._innerElem.style.top = `${this._innerPos.y}px`;
        this._innerElem.style.left = `${this._innerPos.x}px`;
        this._outerElem.style.top = `${this._outerPos.y}px`;
        this._outerElem.style.left = `${this._outerPos.x}px`;
    }

    private onMouseMove(e: any)
    {
        this._lastMousePos.x = e.clientX;
        this._lastMousePos.y = e.clientY;
    }

    public setActive(value: boolean)
    {
        this._innerElem.style.display = value ? "block" : "none";
        this._outerElem.style.display = value ? "block" : "none";
    }
}