import { Color, Mesh, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { IShaderScene } from "../IShaderScene";
import { ProceduralShuriken2DMaterial, ProceduralShuriken2DUniforms } from "./Scripts/ProceduralShuriken2DMaterial";
import { exposedCodeShurikenFrag, exposedCodeShurikenVert } from "./ExposedCode/ExposedCodeShurikenMaterial.ts";


//Handles high-level management of the scene and it's components
export class ShaderSceneProceduralShapes2D implements IShaderScene
{
    private scene: Scene = new Scene();
    private visualizer!: ShaderVisualizer;
    private camera!: PerspectiveCamera;

    private debugUI!: DebugUI;

    private shuriken!: Mesh;
    private screenshotCamera!: OrthographicCamera;
    private screenshotRenderer!: WebGLRenderer;

    //Keeping for reference because they were some cool experiments. They used MathFunctionsMaterial
    // private mathFunctionsSettings: MathFunctionsUniforms = {
    //     u_LinearFunctionSlope: { value: 0.5 },
    //     u_LinearFunctionCenter: { value: new Vector2(0.5, 0.5) },

    //     u_CircleRadius: { value: 0.025 },
    //     u_CircleSmoothness: { value: 0.1 },

    //     u_SegmentPoint0: { value: new Vector2(0.2, 0.25) },
    //     u_SegmentPoint1: { value: new Vector2(0.8, 0.25) },
        
    //     u_QuadraticCenter: { value: new Vector2(0.5, 0.75) },
    //     u_QuadraticCurvature: { value: -2.0 },
    //     u_QuadraticSlope: { value: 0.0 },
        
    //     u_TrigAmplitude: { value: 0.5 },
    //     u_TrigFrequency: { value: 5.0 },
    //     u_TrigCenter: { value: new Vector2(0.5, 0.5) },

    //     u_ReflectPoint: { value: new Vector2(0.25, 0.0) },
    //     u_ReflectAngle: { value: 45.0 }
    // }

    private shurikenSettings: ProceduralShuriken2DUniforms = {
        u_ShurikenRadius: { value: 0.45 },
        u_NumPoints: { value: 6 },
        u_MidPointDist: { value: 0.5 },
        u_MidPointRadius: { value: 0.05 },
        u_CenterRadius: { value: 0.05 },

        u_SharpSize: { value: 0.05 },
        u_SharpColor: { value: new Color(0x9ab2e9) },
        u_BodyColor: { value: new Color(0xf2e8ed) },
        u_ShadowColor: { value: new Color(0xc9d2e8) },

        u_BorderSize: { value: 0.0 },
        u_BorderColor: { value: new Color(0x74453f) },

        u_BackgroundColor: { value: new Color(0xaa795c) },
        u_BackgroundOpacity: { value: 0.0 }
    }

    public getScene() { return this.scene; }

    public init(visualizer: ShaderVisualizer)
    {
        this.visualizer = visualizer;
        this.camera = visualizer.cameraManager.getCamera();

        //Initialize debug ui
        this.debugUI = new DebugUI();
        let guiHtml = this.debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        //Set up the current scene
        this.displayUI();
        this.setupShaderPlane();

        this.visualizer.addScript("ShurikenMaterial.vert", exposedCodeShurikenVert);
        this.visualizer.addScript("ShurikenMaterial.frag", exposedCodeShurikenFrag);
    }

    public update(deltaTime: number)
    {

    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        //Reset the debug ui and the camera
        this.debugUI.reset(); //Events will also unsubscribe here
        this.screenshotRenderer.dispose();
        this.shuriken.geometry.dispose();
        (this.shuriken.material as ShaderMaterial).dispose();

        this.visualizer.removeScript("ShurikenMaterial.vert");
        this.visualizer.removeScript("ShurikenMaterial.frag");
    }

    private displayUI()
    {
        this.debugUI.reset();
        //Keeping for reference because they were some cool math experiments
        // this.debugUI.addFolder("Linear Function", "");
        // this.debugUI.addSlider("Linear Function", this.mathFunctionsSettings.u_LinearFunctionSlope, "value", -10.0, 10.0, "Slope");
        // this.debugUI.addSlider("Linear Function", this.mathFunctionsSettings.u_LinearFunctionCenter.value, "x", 0.0, 1.0, "Center X");
        // this.debugUI.addSlider("Linear Function", this.mathFunctionsSettings.u_LinearFunctionCenter.value, "y", 0.0, 1.0, "Center Y");
        
        // this.debugUI.addFolder("Circle", "");
        // this.debugUI.addSlider("Circle", this.mathFunctionsSettings.u_CircleRadius, "value", 0.0, 1.0, "Radius");
        // this.debugUI.addSlider("Circle", this.mathFunctionsSettings.u_CircleSmoothness, "value", 0.0, 1.0, "Smoothness");
        
        // this.debugUI.addFolder("Segment", "");
        // this.debugUI.addSlider("Segment", this.mathFunctionsSettings.u_SegmentPoint0.value, "x", 0.0, 1.0, "Point 1 X");
        // this.debugUI.addSlider("Segment", this.mathFunctionsSettings.u_SegmentPoint0.value, "y", 0.0, 1.0, "Point 1 Y");
        // this.debugUI.addSlider("Segment", this.mathFunctionsSettings.u_SegmentPoint1.value, "x", 0.0, 1.0, "Point 2 X");
        // this.debugUI.addSlider("Segment", this.mathFunctionsSettings.u_SegmentPoint1.value, "y", 0.0, 1.0, "Point 2 Y");

        
        // this.debugUI.addFolder("Quadratic", "");
        // this.debugUI.addSlider("Quadratic", this.mathFunctionsSettings.u_QuadraticCurvature, "value", -10.0, 10.0, "Curvature");
        // this.debugUI.addSlider("Quadratic", this.mathFunctionsSettings.u_QuadraticSlope, "value", -10.0, 10.0, "Slope");
        // this.debugUI.addSlider("Quadratic", this.mathFunctionsSettings.u_QuadraticCenter.value, "x", 0.0, 1.0, "Center X");
        // this.debugUI.addSlider("Quadratic", this.mathFunctionsSettings.u_QuadraticCenter.value, "y", 0.0, 1.0, "Center Y");

        // this.debugUI.addFolder("Trigonometry", "");
        // this.debugUI.addSlider("Trigonometry", this.mathFunctionsSettings.u_TrigAmplitude, "value", 0.0, 1.0, "Amplitude");
        // this.debugUI.addSlider("Trigonometry", this.mathFunctionsSettings.u_TrigFrequency, "value", 0.0, 100.0, "Frequency");
        // this.debugUI.addSlider("Trigonometry", this.mathFunctionsSettings.u_TrigCenter.value, "x", 0.0, 1.0, "Center X");
        // this.debugUI.addSlider("Trigonometry", this.mathFunctionsSettings.u_TrigCenter.value, "y", 0.0, 1.0, "Center Y");
        
        // this.debugUI.addFolder("Reflection", "");
        // this.debugUI.addSlider("Reflection", this.mathFunctionsSettings.u_ReflectAngle, "value", 0.0, 180.0, "Angle");
        // this.debugUI.addSlider("Reflection", this.mathFunctionsSettings.u_ReflectPoint.value, "x", -0.5, 0.5, "Point X");
        // this.debugUI.addSlider("Reflection", this.mathFunctionsSettings.u_ReflectPoint.value, "y", -0.5, 0.5, "Point Y");
        
        this.debugUI.addFolder("Shape Settings", "");
        this.debugUI.addSlider("Shape Settings", this.shurikenSettings.u_ShurikenRadius, "value", 0.1, 1.0, "Shuriken Radius");
        this.debugUI.addSlider("Shape Settings", this.shurikenSettings.u_NumPoints, "value", 3.0, 10.0, "Num Of Points");
        this.debugUI.addSlider("Shape Settings", this.shurikenSettings.u_MidPointDist, "value", 0.0, 1.0, "Outer Circle Distance");
        this.debugUI.addSlider("Shape Settings", this.shurikenSettings.u_MidPointRadius, "value", 0.0, 0.2, "Outer Circle Radius");
        this.debugUI.addSlider("Shape Settings", this.shurikenSettings.u_CenterRadius, "value", 0.0, 0.2, "Inner Circle Radius");

        this.debugUI.addFolder("Color Settings", "");
        this.debugUI.addSlider("Color Settings", this.shurikenSettings.u_SharpSize, "value", 0.0, 0.3, "Sharp Size");
        this.debugUI.addColorPicker("Color Settings", this.shurikenSettings.u_SharpColor, "value", "Sharp Color", (value) => {
            this.shurikenSettings.u_SharpColor.value.set(value);
        });
        this.debugUI.addColorPicker("Color Settings", this.shurikenSettings.u_BodyColor, "value", "Body Color", (value) => {
            this.shurikenSettings.u_BodyColor.value.set(value);
        });
        this.debugUI.addColorPicker("Color Settings", this.shurikenSettings.u_ShadowColor, "value", "Body Color", (value) => {
            this.shurikenSettings.u_ShadowColor.value.set(value);
        });

        this.debugUI.addFolder("Background Settings", "");
        this.debugUI.addSlider("Background Settings", this.shurikenSettings.u_BorderSize, "value", 0.0, 0.1, "Border Size");
        this.debugUI.addColorPicker("Background Settings", this.shurikenSettings.u_BorderColor, "value", "Border Color", (value) => {
            this.shurikenSettings.u_BorderColor.value.set(value);
        });

        this.debugUI.addSlider("Background Settings", this.shurikenSettings.u_BackgroundOpacity, "value", 0.0, 1.0, "Background Opacity");
        this.debugUI.addColorPicker("Background Settings", this.shurikenSettings.u_BackgroundColor, "value", "Background Color", (value) => {
            this.shurikenSettings.u_BackgroundColor.value.set(value);
        });

        this.debugUI.addButton("", this, "grabScreenshot", "Download Image");
    }

    private setupShaderPlane()
    {
        let mat = ProceduralShuriken2DMaterial.createMaterial(this.shurikenSettings);
        this.shuriken = new Mesh(new PlaneGeometry(), mat);
        this.shuriken.scale.set(5, 5, 5);
        this.scene.add(this.shuriken);

        let halfScale = new Vector2(this.shuriken.scale.x, this.shuriken.scale.y).multiplyScalar(0.5);
        this.screenshotCamera = new OrthographicCamera(-halfScale.x, halfScale.x, halfScale.y, -halfScale.y, 0.01, 100.0);
        this.screenshotCamera.position.set(0, 0, 1);
        this.screenshotCamera.lookAt(0.0, 0.0, 0.0);

        this.screenshotRenderer = new WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        this.screenshotRenderer.setSize(1024, 1024);
        this.screenshotRenderer.setClearColor(0x000000, 0.0);
    }

    //Called through ui when pressing "Download Image"
    private grabScreenshot()
    {
        this.screenshotRenderer.render(this.scene, this.screenshotCamera);

        const canvas = this.screenshotRenderer.domElement;

        const dataURL = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = dataURL;
        link.download = "Shuriken.png";
        link.click();
    }
}
