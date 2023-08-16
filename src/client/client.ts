import { AboutMePanel } from "./scripts/Panels/AbotMePanel";
import { ArtProjectsPanel } from "./scripts/Panels/ArtProjectsPanel";
import { GameProjectsPanel } from "./scripts/Panels/GameProjectsPanel";
import { HomePanel } from "./scripts/Panels/HomePanel";
import { SkillChartsPanel } from "./scripts/Panels/SkillChartsPanel";
import { SoftwareProjectsPanel } from "./scripts/Panels/SoftwareProjectsPanel";
import { SpecialSkillsPanel } from "./scripts/Panels/SpecialSkillsPanel";
import { WorkProjectsPanel } from "./scripts/Panels/WorkProjectsPanel";
import { ThreeModelView } from "./scripts/ThreeVisualizer/ThreeModelView";

const homePanel = new HomePanel();
const aboutMePanel = new AboutMePanel();
const skillChartsPanel = new SkillChartsPanel();
const specialSkillsPanel = new SpecialSkillsPanel();
const workProjectsPanel = new WorkProjectsPanel();
const gameProjectsPanel = new GameProjectsPanel();
const softwareProjectsPanel = new SoftwareProjectsPanel();
const artProjectsPanel = new ArtProjectsPanel();

export const threeModelView = new ThreeModelView();

let previousFrameTime = 0;
function gameLoop(timestamp: number)
{
    requestAnimationFrame(gameLoop);

    let frameTime = timestamp;
    let deltaTime = (frameTime - previousFrameTime) * 0.01;
    previousFrameTime = frameTime;

    threeModelView.update(deltaTime);
}
requestAnimationFrame(gameLoop);