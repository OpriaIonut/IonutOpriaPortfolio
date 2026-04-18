import { ColorThemeButtons } from "./scripts/Effects/ColorThemeButtons";
import { MouseAnimation } from "./scripts/Effects/MouseAnimation";
import { AboutMePanel } from "./scripts/Panels/AboutMePanel";
import { ArtProjectsPanel } from "./scripts/Panels/ArtProjectsPanel";
import { EndingPanel } from "./scripts/Panels/EndingPanel";
import { GameProjectsPanel } from "./scripts/Panels/GameProjectsPanel";
import { HomePanel } from "./scripts/Panels/HomePanel";
import { NavBar } from "./scripts/Panels/Navbar";
import { ShaderProjectsPanel } from "./scripts/Panels/ShaderProjects";
import { SkillChartsPanel } from "./scripts/Panels/SkillChartsPanel";
import { SpecialSkillsPanel } from "./scripts/Panels/SpecialSkillsPanel";
import { WorkProjectsPanel } from "./scripts/Panels/WorkProjectsPanel";
import { CodePrettyPrinter } from "./scripts/ShaderVisualizer/CodePrettyPrinter";
import { ShaderVisualizer } from "./scripts/ShaderVisualizer/ShaderVisualizer";
import { ThreeModelView } from "./scripts/ThreeVisualizer/ThreeModelView";

export const threeDebugGUI = false;
export const timeStats = { currentTime: 0.0, deltaTime: 0.0 }
export const userInteractedWithPage = { value: false }
export const isPortraitMode = { value: window.innerWidth / window.innerHeight < 1.0 }

export const codePrettyPrinter = new CodePrettyPrinter();
export const homePanel = new HomePanel();

const pageParent = document.createElement("div");
pageParent.id = "pageParent";
document.body.appendChild(pageParent);

export const mouseAnim = new MouseAnimation(7.5, 4.0);
const colorThemeButtons = new ColorThemeButtons();

export const shaderVisualizer = new ShaderVisualizer();

export const aboutMePanel = new AboutMePanel(pageParent);
export const skillChartsPanel = new SkillChartsPanel(pageParent);
export const specialSkillsPanel = new SpecialSkillsPanel(pageParent);
export const workProjectsPanel = new WorkProjectsPanel(pageParent);
export const gameProjectsPanel = new GameProjectsPanel(pageParent);
export const shaderProjectsPanel = new ShaderProjectsPanel(pageParent);
export const artProjectsPanel = new ArtProjectsPanel(pageParent);
export const endingPanel = new EndingPanel();

export const threeModelView = new ThreeModelView();

const navbar = new NavBar();

const warningMsg = document.createElement("div");
warningMsg.id = "warningMsg";
warningMsg.style.display = "none";
let warningMsgText = document.createElement("div");
warningMsgText.id = "warningMsgText";
warningMsgText.innerHTML = "Please open the website in a landscape/desktop format."
warningMsg.appendChild(warningMsgText);
document.body.appendChild(warningMsg);

//Called when site gets left in the background
let appIsPaused = false;
document.addEventListener("visibilitychange", () => {
    appIsPaused = document.hidden;
});

let previousFrameTime = 0;
function gameLoop(timestamp: number)
{
    requestAnimationFrame(gameLoop);

    if(appIsPaused)
        return;

    isPortraitMode.value = window.innerWidth / window.innerHeight < 1.0;

    let frameTime = timestamp * 0.001;
    let deltaTime = Math.min(frameTime - previousFrameTime, 0.1); //To prevent large deltaTime
    previousFrameTime = frameTime;

    timeStats.currentTime = frameTime;
    timeStats.deltaTime = deltaTime;

    //Renders 3D scenes
    threeModelView.update(deltaTime);
    shaderVisualizer.update(deltaTime);

    mouseAnim.update();
    workProjectsPanel.update();
    gameProjectsPanel.update();
    specialSkillsPanel.update();
    navbar.update();

    shaderVisualizer.render(deltaTime);
}
requestAnimationFrame(gameLoop);

window.addEventListener("click", () => {
    userInteractedWithPage.value = true;
});
