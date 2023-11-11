import { MultiCellWithGallery } from "../Helper/MultiCellWithGallery";
import { tagColors } from "../Themes/ChartThemes";

export class GameProjectsPanel
{
    private _galleries: MultiCellWithGallery[] = [];

    constructor(pageParent: HTMLDivElement)
    {
        this.createElements(pageParent);
    }

    private createElements(pageParent: HTMLDivElement)
    {
        const parentNode = document.createElement("div");
        parentNode.id = "gameProjectsPanel";
        parentNode.className = "fullwidth";
        pageParent.appendChild(parentNode);

        let title = document.createElement("div");
        title.className = "sectionTitle";
        title.innerHTML = "Personal Projects";
        parentNode.appendChild(title);

        let cellsPerWidth = 2;
        
        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "serenityGardenCell",
            _title: "Serenity Garden",
            _description: `Tower defense game that I build as part of my Bachelor's Degree assessment.<br><br>
            The game has the following features:<br>
            <div class='bulletPointList'>
                <b>&#149;</b> Construct & upgrade 6 different types of turrets<br>
                <b>&#149;</b> Control a playable character that shoots enemies & can empower the turrets<br>
                <b>&#149;</b> Play 30 different PvE levels on 6 different maps<br>
                <b>&#149;</b> Buy permanent upgrades for your turrets<br>
                <b>&#149;</b> Play a co-op boss-fight arena mode with a friend on 3 different difficulties<br>
                <b>&#149;</b> Windows & Android executables<br>
                <b>&#149;</b> Multi-platform co-op (Android devices can match with Windows devices)
            </div>`,
                _tags: ["Unity", "Photon 2", "C#", "Tower Defense", "Multi-user", "Multi-platform"],
            _tagColors: [tagColors.software, tagColors.software, tagColors.language, tagColors.gameType, tagColors.extra, tagColors.extra],
            _btn1Link: "https://kirirato.itch.io/serenity-garden",
            _btn2Link: "",
            _imagesPath: "images/gallery/serenity-garden/",
            _imageCount: 7,
            _videoFormatIndices: [0],
            _imageDurationMs: 5000,
            _downloadPath: "games/Serenity Garden TD.rar",
            _downloadName: "Serenity Garden TD.rar",
            _btn1Name: "More Details",
            _btn2Name: "Download"
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "chickenInvadersCell",
            _title: "Chicken Invaders DX",
            _description: `Replica of the initial Chicken Invaders DX game, which contains the following:<br>
            <div class='bulletPointList'>
                <b>&#149;</b> 10 playable levels that repeat endlessly<br>
                <b>&#149;</b> Local leaderboard system<br>
                <b>&#149;</b> Weapon utility with 8 different levels, each having a different attack pattern<br>
                <b>&#149;</b> Rocket that fries all chickens and skips the level<br>
                <b>&#149;</b> Assistant spaceship that helps with shooting enemies<br>
                <br>
                Main Contributions:<br>
                <b>&#149;</b> Implemented asteroid belt and waves 4-5<br>
                <b>&#149;</b> Created the spritesheets for all non-ui elements in the game (spaceship, chickens, weapons, asteroids, etc.)<br>
                <b>&#149;</b> Optimized resource loading using multithreaded programming
                </div>`,
            _tags: ["C++", "SFML", "Bullet Hell", "Endless", "Leaderboard"],
            _tagColors: [tagColors.language, tagColors.language, tagColors.gameType, tagColors.extra, tagColors.extra],
            _btn1Link: "https://kirirato.itch.io/chicken-invaders-dx",
            _btn2Link: "",
            _imagesPath: "images/gallery/chicken-invaders/",
            _imageCount: 6,
            _videoFormatIndices: [0],
            _imageDurationMs: 5000,
            _downloadPath: "games/Chicken Invaders DX.rar",
            _downloadName: "Chicken Invaders DX.rar",
            _btn1Name: "More Details",
            _btn2Name: "Download"
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "legeithielUnaelianCell",
            _title: "Legeithiel Unaelian",
            _description: `Bullet-hell game that I built during my time at the University of Lincoln UK<br><br>
                It contains the following:<br>
            <div class='bulletPointList'>
                <b>&#149;</b> 3 playable levels<br>
                <b>&#149;</b> 3 types of powerups (increased movement speed, double damage, faster fire rate)<br>
                <b>&#149;</b> Pause menu from which you can tweak sound settings<br>
                <b>&#149;</b> Leaderboard system stored locally<br>
                <b>&#149;</b> Controller support
            </div>`,
            _tags: ["Unity", "C#", "Bullet Hell", "Leaderboard", "Controller Support"],
            _tagColors: [tagColors.software, tagColors.language, tagColors.gameType, tagColors.extra, tagColors.extra],
            _btn1Link: "https://kirirato.itch.io/legeithiel-unaelian",
            _btn2Link: "",
            _imagesPath: "images/gallery/legeithiel-unaelian/",
            _imageCount: 5,
            _videoFormatIndices: [0],
            _imageDurationMs: 5000,
            _imgExtension: "png",
            _downloadPath: "games/Legeithiel Unaelian.rar",
            _downloadName: "Legeithiel Unaelian.rar",
            _btn1Name: "More Details",
            _btn2Name: "Download"
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "oriCloneCell",
            _title: "Ori Gameplay Clone",
            _description: `Gameplay replica of the game Ori and the Blind Forest<br><br>
                It contains the following mechanics:<br>
            <div class='bulletPointList'>
                <b>&#149;</b> Normal attack that can target up to 3 enemies + charge attack that deals a lot of damage<br>
                <b>&#149;</b> Dynamic movement with double jump, dashing, charged jump, wall climbing, propulsion dodge<br>
                <b>&#149;</b> 8 different enemy types<br>
                <b>&#149;</b> 4 kinds of traps that each require different interactions<br>
                <b>&#149;</b> Minimap functionality that shows the objective for the game<br>
                <b>&#149;</b> Checkpoints that save your progress when you reach them
            </div>`,
            _tags: ["Unity", "C#", "Platformer", "Dynamic Gameplay", "Checkpoints"],
            _tagColors: [tagColors.software, tagColors.language, tagColors.gameType, tagColors.extra, tagColors.extra],
            _btn1Link: "https://kirirato.itch.io/origameplayclone",
            _btn2Link: "",
            _imagesPath: "images/gallery/ori/",
            _imageCount: 6,
            _videoFormatIndices: [0],
            _imageDurationMs: 5000,
            _downloadPath: "games/Ori Gameplay Clone.rar",
            _downloadName: "Ori Gameplay Clone.rar",
            _btn1Name: "More Details",
            _btn2Name: "Download"
        }));


        let moreDetailsBorder = document.createElement("div");
        moreDetailsBorder.className = "middleCenterBtnBorder";
        parentNode.appendChild(moreDetailsBorder);

        let moreGamesBtn = document.createElement("div");
        moreGamesBtn.className = "middleCenterBtn";
        moreGamesBtn.addEventListener('mousedown', () => { window.open('https://kirirato.itch.io', '_blank'); });
        moreDetailsBorder.appendChild(moreGamesBtn);

        let moreDetailsText = document.createElement("div");
        moreDetailsText.className = "centerText";
        moreDetailsText.innerHTML = "More Games";
        moreGamesBtn.appendChild(moreDetailsText);
        
        let separator = document.createElement("div");
        separator.className = "separator";
        separator.style.marginTop = "2vw";
        parentNode.appendChild(separator);
    }

    public update()
    {
        for(let index = 0; index < this._galleries.length; ++index)
        {
            this._galleries[index].update();
        }
    }

    public updateColorTheme()
    {
        for(let index = 0; index < this._galleries.length; ++index)
        {
            this._galleries[index].updateColorTheme();
        }
    }
}