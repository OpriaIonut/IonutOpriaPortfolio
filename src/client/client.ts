import { ColorThemeButtons } from "./scripts/Effects/ColorThemeButtons";
import { MouseAnimation } from "./scripts/Effects/MouseAnimation";
import { AboutMePanel } from "./scripts/Panels/AboutMePanel";
import { ArtProjectsPanel } from "./scripts/Panels/ArtProjectsPanel";
import { EndingPanel } from "./scripts/Panels/EndingPanel";
import { GameProjectsPanel } from "./scripts/Panels/GameProjectsPanel";
import { HomePanel } from "./scripts/Panels/HomePanel";
import { SkillChartsPanel } from "./scripts/Panels/SkillChartsPanel";
import { SpecialSkillsPanel } from "./scripts/Panels/SpecialSkillsPanel";
import { WorkProjectsPanel } from "./scripts/Panels/WorkProjectsPanel";
import { ThreeModelView } from "./scripts/ThreeVisualizer/ThreeModelView";

export const threeDebugGUI = false;
export const timeStats = { currentTime: 0.0, deltaTime: 0.0 }
export const userInteractedWithPage = { value: false }

export const homePanel = new HomePanel();

const pageParent = document.createElement("div");
pageParent.id = "pageParent";
document.body.appendChild(pageParent);

export const mouseAnim = new MouseAnimation(0.75, 0.4);
const colorThemeButtons = new ColorThemeButtons();


export const aboutMePanel = new AboutMePanel(pageParent);
export const skillChartsPanel = new SkillChartsPanel(pageParent);
export const specialSkillsPanel = new SpecialSkillsPanel(pageParent);
export const workProjectsPanel = new WorkProjectsPanel(pageParent);
export const gameProjectsPanel = new GameProjectsPanel(pageParent);
export const artProjectsPanel = new ArtProjectsPanel(pageParent);
export const endingPanel = new EndingPanel();

export const threeModelView = new ThreeModelView();

const warningMsg = document.createElement("div");
warningMsg.id = "warningMsg";
let warningMsgText = document.createElement("div");
warningMsgText.id = "warningMsgText";
warningMsgText.innerHTML = "Please open the website in a landscape/desktop format."
warningMsg.appendChild(warningMsgText);
document.body.appendChild(warningMsg);

let previousFrameTime = 0;
function gameLoop(timestamp: number)
{
    requestAnimationFrame(gameLoop);

    warningMsg.style.display = (window.innerWidth / window.innerHeight < 1.0) ? "block" : "none";

    let frameTime = timestamp;
    let deltaTime = (frameTime - previousFrameTime) * 0.01;
    previousFrameTime = frameTime;

    timeStats.currentTime = timestamp;
    timeStats.deltaTime = deltaTime;

    mouseAnim.update();
    threeModelView.update(deltaTime);
    workProjectsPanel.update();
    gameProjectsPanel.update();
    specialSkillsPanel.update();

}
requestAnimationFrame(gameLoop);

window.addEventListener("click", () => {
    userInteractedWithPage.value = true;
});
