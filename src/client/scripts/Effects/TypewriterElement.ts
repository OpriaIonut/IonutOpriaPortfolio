import { timeStats } from "../../client";

export class TypewriterElement
{
    private _htmlElement: HTMLElement;
    private _characterIndex: number = 0;
    private _finishedMessage: boolean = true;
    private _lastUpdateTime: number = 0;
    private _startTime: number = 0;
    private _endTime: number = 0;

    private _characterSpeed: number[] = [];
    private _startDelay: number[] = [];
    private _endDelay: number[] = [];
    private _textToDisplay: string[] = [];
    private _OnFinishCallback: any[] = [];

    private _createdSpanElem : any[] = [];

    constructor(htmlElement: HTMLElement) 
    {
        this._htmlElement = htmlElement;

    }

    public update(currentTime: any, deltaTime: any) 
    {
        //If we don't have any more messages, stop execution.
        if (this._textToDisplay.length == 0)
            return;

        //If we didn't finish writing the message
        if (this._finishedMessage == false) 
        {
            //See if it passed the start delay
            if (currentTime - this._startTime > this._startDelay[0]) 
            {
                //See if it time to write a new character
                if (currentTime - this._lastUpdateTime > this._characterSpeed[0]) 
                {
                    //If the character is new line, add a break line to the html
                    if (this._textToDisplay[0][this._characterIndex] == "\n")
                        this._htmlElement.innerHTML += "<br/>";
                    else if (this._textToDisplay[0][this._characterIndex] == "<") 
                    {
                        //If the text is a span tag
                        if(this._textToDisplay[0].slice(this._characterIndex + 1, this._characterIndex+5) == "span" || this._textToDisplay[0].slice(this._characterIndex + 1, this._characterIndex+6) == "/span")
                        {
                            //Save all the text from the opening span tag
                            var i = 0;
                            for(i=this._characterIndex+1 ;i<this._textToDisplay[0].length;i++)        
                            {
                                if(this._textToDisplay[0][i] == ">")
                                    break;
                            } 

                            var spanText = this._textToDisplay[0].slice(this._characterIndex, i + 1);

                            //If it is opening tag
                            if(this._textToDisplay[0].slice(this._characterIndex + 1, this._characterIndex + 5) == "span")
                            {
                                var spanCollection: any = [];
                                
                                //Create span element
                                if(this._createdSpanElem.length == 0)
                                {
                                    this._htmlElement.innerHTML += spanText;
                                    spanCollection = this._htmlElement.getElementsByTagName("span");
                                }
                                else
                                {
                                    this._createdSpanElem[this._createdSpanElem.length - 1].innerHTML += spanText;
                                    spanCollection = this._createdSpanElem[this._createdSpanElem.length - 1].getElementsByTagName("span");
                                }

                                this._createdSpanElem.push(spanCollection[spanCollection.length -1]);
                            }
                            else
                            {
                                //Otherwise, if it is closing tag, close it
                                if(this._createdSpanElem.length == 0)
                                    this._htmlElement.innerHTML += spanText;
                                else
                                    this._createdSpanElem[this._createdSpanElem.length - 1].innerHTML += spanText;
                                this._createdSpanElem.pop();
                            }

                            this._characterIndex = i;
                        }
                    }
                    else if(this._createdSpanElem.length > 0)
                    {
                        this._createdSpanElem[this._createdSpanElem.length - 1].innerHTML += this._textToDisplay[0][this._characterIndex];
                    }
                    else
                    {
                        this._htmlElement.innerHTML += this._textToDisplay[0][this._characterIndex];
                    }

                    //Increment the index and save the time
                    this._characterIndex++;
                    this._lastUpdateTime = currentTime;
                    if (this._characterIndex >= this._textToDisplay[0].length) 
                    {
                        //If we reached the end of the word, save end time (to be used by end delay)
                        this._endTime = currentTime;
                        this._finishedMessage = true;
                    }
                }
            }
        }
        else if (currentTime - this._endTime > this._endDelay[0]) 
        {
            //Else if the text has finished writing & the end delay passed

            //Call the callback if it isn't null
            if (this._OnFinishCallback[0] !== null)
                this._OnFinishCallback[0]();

            //Remove all properties of the current message to be able to move on to the next one
            this._OnFinishCallback = this._OnFinishCallback.slice(1);
            this._textToDisplay = this._textToDisplay.slice(1);
            this._characterSpeed = this._characterSpeed.slice(1);
            this._startDelay = this._startDelay.slice(1);
            this._endDelay = this._endDelay.slice(1);

            //Reset character & html text
            this._characterIndex = 0;
            if (this._textToDisplay.length == 0) 
            {
                this._finishedMessage = true;
            }
            else 
            {
                this._htmlElement.innerHTML = "";
                this._finishedMessage = false;
            }
            this._lastUpdateTime = currentTime;
            this._startTime = currentTime;
        }
    }

    /**
     * Change displayed text for this html element.
     * @param textToDisplay 
     * @param characterSpeed 
     * @param startDelay 
     * @param endDelay 
     * @param stopPreviousText Should we finish previous text before starting this one or hide it & replace it with current one
     * @param OnFinishCallback Function that will be called when text finishes.
     */
    public displayText(textToDisplay: string, characterSpeed: number, startDelay: number, endDelay: number, stopPreviousText: boolean, OnFinishCallback: any) 
    {
        if (stopPreviousText) 
        {
            this._textToDisplay = [];
            this._characterSpeed = [];
            this._startDelay = [];
            this._endDelay = [];
            this._OnFinishCallback = [];

            this._characterIndex = 0;
            this._htmlElement.innerHTML = "";
            this._lastUpdateTime = timeStats.currentTime;
            this._startTime = timeStats.currentTime;
        }
        
        this._textToDisplay.push(textToDisplay);
        this._characterSpeed.push(characterSpeed);
        this._startDelay.push(startDelay);
        this._endDelay.push(endDelay);
        this._OnFinishCallback.push(OnFinishCallback);
        this._finishedMessage = false;
    }
}