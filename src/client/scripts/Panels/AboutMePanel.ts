export class AboutMePanel
{
    constructor(parentElem: HTMLDivElement)
    {
        this.createElements(parentElem);
    }

    private createElements(parentElem: HTMLDivElement)
    {
        const parentNode = document.createElement("div");
        parentNode.id = "aboutMeParent";
        parentNode.className = "fullwidth";
        parentElem.appendChild(parentNode);

        let title = document.createElement("div");
        title.className = "sectionTitle";
        title.innerHTML = "About Me";
        parentNode.appendChild(title);

        let descriptionText = document.createElement("div");
        descriptionText.id = "aboutMeDescription";
        descriptionText.innerHTML = `
        Hello and thank you for checking out my portfolio!<br><br>
        My name is Ionu&#x021b; Opria and I'm from Romania. I'm a versatile Software Developer with 3+ years of experience in building Unity and web-based applications. During my career I developed various types of applications and aquired a wide variety of skills, ranging from engine programming, graphics programming, network programming, web development using Three.js, Unity development for games & VR applications.<br><br>
        I've always been curios about how games work beneath the surface, which is what got me into programming (and 3D modelling later on). I'm passionate about building games, learning how complex mechanics should be implemented properly, what optimizations are required to ship successful games and how I can best contribute to the projects I'm working on.<br><br>
        I love the process of learning new things, improving my skills as much as I can and I don't shy away from difficult problems, because in my opinion, the harder the problem, the more things there are to be learned.`;
        parentNode.appendChild(descriptionText);

        let separator = document.createElement("div");
        separator.className = "separator";
        parentNode.appendChild(separator);
    }
}