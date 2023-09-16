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

const homePanel = new HomePanel();

const pageParent = document.createElement("div");
pageParent.id = "pageParent";
document.body.appendChild(pageParent);

export const mouseAnim = new MouseAnimation(0.75, 0.4);


const aboutMePanel = new AboutMePanel(pageParent);
const skillChartsPanel = new SkillChartsPanel(pageParent);
const specialSkillsPanel = new SpecialSkillsPanel(pageParent);
const workProjectsPanel = new WorkProjectsPanel(pageParent);
const gameProjectsPanel = new GameProjectsPanel(pageParent);
const artProjectsPanel = new ArtProjectsPanel(pageParent);
const endingPanel = new EndingPanel();

export const threeModelView = new ThreeModelView();

let previousFrameTime = 0;
function gameLoop(timestamp: number)
{
    requestAnimationFrame(gameLoop);

    let frameTime = timestamp;
    let deltaTime = (frameTime - previousFrameTime) * 0.01;
    previousFrameTime = frameTime;

    timeStats.currentTime = timestamp;
    timeStats.deltaTime = deltaTime;

    threeModelView.update(deltaTime);
    workProjectsPanel.update();
    gameProjectsPanel.update();
    specialSkillsPanel.update();

    mouseAnim.update();
}
requestAnimationFrame(gameLoop);

window.addEventListener("click", () => {
    userInteractedWithPage.value = true;
});
