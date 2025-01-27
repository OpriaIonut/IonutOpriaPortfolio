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
        const section = document.createElement("div");
        section.id = "gameProjectsPanel";
        section.className = "fullwidth";
        pageParent.appendChild(section);

        const parentNode = document.createElement("div");
        parentNode.id = "gameProjectsGalleryParent";
        parentNode.className = "fullwidth";
        section.appendChild(parentNode);

        let title = document.createElement("div");
        title.className = "sectionTitle";
        title.innerHTML = "Personal Projects";
        parentNode.appendChild(title);

        let cellsPerWidth = 2;
        
        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "jorogumosCradleCell",
            _title: "Jorogumo's Cradle",
            _description: `
                Short first-person horror game that I built on my own as a passion project, in order to learn Unreal Engine and launch my first ever steam game.<br>
                <br>
                The game is a short, 30 min experience in which you have to explore a wild forest and build tools to defend yourself against a humanoid spider-like creature.<br>
                <br>
                The enemy has multiple attack patterns that it utilizes to get into your cabin, which is the only thing keeping it at bay. You need to react to it's attack patterns and find ways to stop it from breaking through. This includes: building torches to burn the spider webs, navigating labyrinth-like structures, setting up a blockade inside the cabin, shooting the monster down with a slingshot, etc.
            `,
            _tags: ["Unreal Engine", "Blueprints", "First-Person", "Horror", "Steam Release", "Enemy AI"],
            _tagColors: [tagColors.software, tagColors.language, tagColors.gameType, tagColors.gameType, tagColors.extra, tagColors.extra],
            _btn1Link: "https://store.steampowered.com/app/2914870/Jorogumos_Cradle/",
            _btn2Link: "",
            _imagesPath: "images/gallery/jorogumos-cradle/",
            _imageCount: 8,
            _videoFormatIndices: [0],
            _imageDurationMs: 5000,
            _imgExtension: "jpg",
            _downloadPath: "",
            _downloadName: "",
            _btn1Name: "More Details",
            _btn2Name: ""
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "bubbleManiaCell",
            _title: "Bubble Mania",
            _description: `
                Game that I built together with 2 other people for the 2025 Global Game Jam. The theme of the game jam was 'Bubble'. I was the main programmer and developed all of the systems of the game. It is a vampire-survivors-like top-down shooter in which you kill origami.
                <br><br>
                My purpose for the game was to create a short and fun experience for the players, and I achieved that by creating an intense 3-5 minutes experience in which you get overwhelmed gradually by enemies. The experience was very fun for me and I enjoyed immensely working with the other team members as we clicked very well and our entire workflow was extremely smooth (almost too smooth for a gamejam)
            `,
            _tags: ["Unity", "C#", "Top-down Shooter", "Web Build", "48 Hour Game Jam"],
            _tagColors: [tagColors.software, tagColors.language, tagColors.gameType, tagColors.extra, tagColors.extra],
            _btn1Link: "https://lexydotzip.itch.io/ggj-2025",
            _btn2Link: "",
            _imagesPath: "images/gallery/bubble-mania/",
            _imageCount: 4,
            _videoFormatIndices: [0],
            _imageDurationMs: 5000,
            _imgExtension: "jpg",
            _downloadPath: "",
            _downloadName: "",
            _btn1Name: "More Details",
            _btn2Name: ""
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "serenityGardenCell",
            _title: "Serenity Garden",
            _description: `Tower defense game that I build on my ownas part of my Bachelor's Degree assessment.<br><br>
            The game has the following features:<br>
            <div class='bulletPointList'>
                <b>&#149;</b> Construct & upgrade 6 different types of turrets<br>
                <b>&#149;</b> Control a playable character that shoots enemies & can empower the turrets<br>
                <b>&#149;</b> Play 30 different PvE levels on 6 different maps<br>
                <b>&#149;</b> Buy permanent upgrades for your turrets<br>
                <b>&#149;</b> Play a co-op boss-fight arena mode with a friend on 3 different difficulties<br>
                <b>&#149;</b> Windows & Android executables<br>
            </div>`,
                _tags: ["Unity", "Photon 2", "C#", "Tower Defense", "Multi-user", "Multi-platform"],
            _tagColors: [tagColors.software, tagColors.software, tagColors.language, tagColors.gameType, tagColors.extra, tagColors.extra],
            _btn1Link: "https://kirirato.itch.io/serenity-garden",
            _btn2Link: "",
            _imagesPath: "images/gallery/serenity-garden/",
            _imageCount: 7,
            _videoFormatIndices: [0],
            _imageDurationMs: 5000,
            _downloadPath: "",
            _downloadName: "",
            _btn1Name: "More Details",
            _btn2Name: ""
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "chickenInvadersCell",
            _title: "Chicken Invaders DX",
            _description: `Replica of the initial Chicken Invaders DX game, which contains the following features:<br><br>
            <div class='bulletPointList'>
                <b>&#149;</b> 10 playable levels that repeat endlessly<br>
                <b>&#149;</b> Local leaderboard system<br>
                <b>&#149;</b> Weapon utility with 8 different levels, each having a different attack pattern<br>
                <b>&#149;</b> Rocket that fries all chickens and skips the level<br>
                <b>&#149;</b> Assistant spaceship that helps with shooting enemies<br>
                </div>`,
            _tags: ["C++", "SFML", "Bullet Hell", "Endless", "Leaderboard"],
            _tagColors: [tagColors.language, tagColors.language, tagColors.gameType, tagColors.extra, tagColors.extra],
            _btn1Link: "https://kirirato.itch.io/chicken-invaders-dx",
            _btn2Link: "",
            _imagesPath: "images/gallery/chicken-invaders/",
            _imageCount: 6,
            _videoFormatIndices: [0],
            _imageDurationMs: 5000,
            _downloadPath: "",
            _downloadName: "",
            _btn1Name: "More Details",
            _btn2Name: ""
        }));

        // this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
        //     _id: "legeithielUnaelianCell",
        //     _title: "Legeithiel Unaelian",
        //     _description: `Bullet-hell game that I built during my time at the University of Lincoln UK<br><br>
        //         It contains the following:<br>
        //     <div class='bulletPointList'>
        //         <b>&#149;</b> 3 playable levels<br>
        //         <b>&#149;</b> 3 types of powerups (increased movement speed, double damage, faster fire rate)<br>
        //         <b>&#149;</b> Pause menu from which you can tweak sound settings<br>
        //         <b>&#149;</b> Leaderboard system stored locally<br>
        //         <b>&#149;</b> Controller support
        //     </div>`,
        //     _tags: ["Unity", "C#", "Bullet Hell", "Leaderboard", "Controller Support"],
        //     _tagColors: [tagColors.software, tagColors.language, tagColors.gameType, tagColors.extra, tagColors.extra],
        //     _btn1Link: "https://kirirato.itch.io/legeithiel-unaelian",
        //     _btn2Link: "",
        //     _imagesPath: "images/gallery/legeithiel-unaelian/",
        //     _imageCount: 5,
        //     _videoFormatIndices: [0],
        //     _imageDurationMs: 5000,
        //     _imgExtension: "png",
        //     _downloadPath: "https://drive.google.com/file/d/1yx7KNyS5YnUH3r_LGqOQwMHjVEFkOKgw/view?usp=sharing",
        //     _downloadName: "Legeithiel Unaelian.rar",
        //     _btn1Name: "More Details",
        //     _btn2Name: "Download"
        // }));

        // this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
        //     _id: "oriCloneCell",
        //     _title: "Ori Gameplay Clone",
        //     _description: `Gameplay replica of the game Ori and the Blind Forest<br><br>
        //         It contains the following mechanics:<br>
        //     <div class='bulletPointList'>
        //         <b>&#149;</b> Normal attack that can target up to 3 enemies + charge attack that deals a lot of damage<br>
        //         <b>&#149;</b> Dynamic movement with double jump, dashing, charged jump, wall climbing, propulsion dodge<br>
        //         <b>&#149;</b> 8 different enemy types<br>
        //         <b>&#149;</b> 4 kinds of traps that each require different interactions<br>
        //         <b>&#149;</b> Minimap functionality that shows the objective for the game<br>
        //         <b>&#149;</b> Checkpoints that save your progress when you reach them
        //     </div>`,
        //     _tags: ["Unity", "C#", "Platformer", "Dynamic Gameplay", "Checkpoints"],
        //     _tagColors: [tagColors.software, tagColors.language, tagColors.gameType, tagColors.extra, tagColors.extra],
        //     _btn1Link: "https://kirirato.itch.io/origameplayclone",
        //     _btn2Link: "",
        //     _imagesPath: "images/gallery/ori/",
        //     _imageCount: 6,
        //     _videoFormatIndices: [0],
        //     _imageDurationMs: 5000,
        //     _downloadPath: "https://drive.google.com/file/d/1HHsoNvKYvfDEnrI-6k_y--FHEQXToXla/view?usp=sharing",
        //     _downloadName: "Ori Gameplay Clone.rar",
        //     _btn1Name: "More Details",
        //     _btn2Name: "Download"
        // }));


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