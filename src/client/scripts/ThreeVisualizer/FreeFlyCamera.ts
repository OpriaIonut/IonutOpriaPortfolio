import { Camera, Euler, Vector3 } from "three";

export class FreeFlyCamera
{
    public camera: Camera;
    public domElement: HTMLCanvasElement;
    public moveSpeed: number;
    public lookSpeed: number;
    public keys: { [key: string]: boolean };
    public isRotating: boolean;
    public euler: Euler;

    // ✅ store handler references
    private onKeyDown!: (e: KeyboardEvent) => void;
    private onKeyUp!: (e: KeyboardEvent) => void;
    private onMouseDown!: (e: MouseEvent) => void;
    private onMouseUp!: (e: MouseEvent) => void;
    private onMouseMove!: (e: MouseEvent) => void;
    private onContextMenu!: (e: MouseEvent) => void;
    private onWheel!: (e: WheelEvent) => void;

    constructor(camera: Camera, domElement: HTMLCanvasElement)
    {
        this.camera = camera;
        this.domElement = domElement;

        this.moveSpeed = 10;
        this.lookSpeed = 0.002;

        this.keys = {};
        this.isRotating = false;

        this.euler = new Euler(0, 0, 0, 'YXZ');

        this.init();
    }

    private init() {
        // Keyboard
        this.onKeyDown = (e: KeyboardEvent) => {
            this.keys[e.code] = true;
        };

        this.onKeyUp = (e: KeyboardEvent) => {
            this.keys[e.code] = false;
        };

        this.onWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        // Mouse
        this.onContextMenu = (e: MouseEvent) => e.preventDefault();

        this.onMouseDown = (e: MouseEvent) => {
            if (e.button === 2) this.isRotating = true;
        };

        this.onMouseUp = (e: MouseEvent) => {
            if (e.button === 2) this.isRotating = false;
        };

        this.onMouseMove = (e: MouseEvent) => {
            if (!this.isRotating) return;

            this.euler.setFromQuaternion(this.camera.quaternion);

            this.euler.y -= e.movementX * this.lookSpeed;
            this.euler.x -= e.movementY * this.lookSpeed;

            const PI_2 = Math.PI / 2;
            this.euler.x = Math.max(-PI_2, Math.min(PI_2, this.euler.x));

            this.camera.quaternion.setFromEuler(this.euler);
        };

        // Attach
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);

        this.domElement.addEventListener('contextmenu', this.onContextMenu);
        this.domElement.addEventListener('mousedown', this.onMouseDown);

        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousemove', this.onMouseMove);

        this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    }

    public update(delta: number) {
        const velocity = this.moveSpeed * delta;

        const forward = new Vector3();
        this.camera.getWorldDirection(forward);

        const right = new Vector3();
        right.crossVectors(forward, this.camera.up).normalize();

        if (this.keys['KeyW']) this.camera.position.addScaledVector(forward, velocity);
        if (this.keys['KeyS']) this.camera.position.addScaledVector(forward, -velocity);
        if (this.keys['KeyA']) this.camera.position.addScaledVector(right, -velocity);
        if (this.keys['KeyD']) this.camera.position.addScaledVector(right, velocity);

        if (this.keys['KeyE']) this.camera.position.y += velocity;
        if (this.keys['KeyQ']) this.camera.position.y -= velocity;
    }

    public dispose()
    {
        // Keyboard
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);

        // Mouse
        this.domElement.removeEventListener('contextmenu', this.onContextMenu);
        this.domElement.removeEventListener('mousedown', this.onMouseDown);

        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('mousemove', this.onMouseMove);

        this.domElement.removeEventListener('wheel', this.onWheel);
        
        // Optional: clear state
        this.keys = {};
        this.isRotating = false;
    }
}