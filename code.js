
let game = null;

window.addEventListener("load", () => {
    game = GetEngine();
    game.Init();
    game.StartNewGame();
});

function GetEngine() {

    let card0 = mapCard(1);
    if(card0.error != "")
        alert(card0.error);

    let card1 = mapCard(2);
    if(card1.error != "")
        alert(card1.error);

    let card2 = mapCard(3);
    if(card2.error != "")
        alert(card2.error);
    
    let stateDIV = document.querySelector("#stateIndicator");
    if (stateDIV == null)
        alert("State div not found!");
    
    return {
        StateIndicatorDIV: stateDIV,
        Cards: [card0, card1, card2],
        GameModeIndex: 0,
        SelectedCard: null,
        Retry: false,
        WinCount: 0,
        TotalCount: 0,
        Init: function () {
            this.Cards[0].gameEngine = this;
            this.Cards[1].gameEngine = this;
            this.Cards[2].gameEngine = this;
        },
        SetGameMode: function (index) {
            if (this.GameModeIndex != index) {
                this.GameModeIndex = index;
                this.WinCount = 0;
                this.TotalCount = 0;
                this.Retry = false;
                this.StartNewGame();
                this.WriteStateIndicator();
            }
        },
        StartNewGame: async function () {
            this.SelectedCard = null;
            this.Retry = false;
            let newTreasure = Math.floor(Math.random() * this.Cards.length);
            console.log(`new treasure: ${newTreasure}`);

            this.Cards[0].setIsTreasure(newTreasure === 0);
            this.Cards[1].setIsTreasure(newTreasure === 1);
            this.Cards[2].setIsTreasure(newTreasure === 2);

            await this.Cards[0].turnFaceDown();
            await this.Cards[1].turnFaceDown();
            await this.Cards[2].turnFaceDown();
        },
        WriteStateIndicator: function () {
            this.StateIndicatorDIV.innerText = `${this.WinCount} of ${this.TotalCount} (${Math.round(this.WinCount / this.TotalCount * 100.0)}%)`;            
        },
        playerSelection: function (card) {
            switch (this.GameModeIndex) {
                case 0:
                    if (this.SelectedCard == null) {
                        this.SelectedCard = card;
                        if (card.isTreasure) {
                            this.WinCount += 1;
                        }
        
                        this.TotalCount += 1;
                        this.WriteStateIndicator();
                    }
                    card.turnFaceUp();
                    break;
                
                case 1:
                    if (this.SelectedCard == null && this.Retry === false) {
                        this.Retry = true;

                        let NotSelected = Array(this.Cards.length - 1);
                        let i = 0;
                        this.Cards.forEach(item => {
                            if (item != card && item.isTreasure === false)
                                NotSelected[i++] = item;
                        });

                        if (i == 2) {
                            // The selected card is the treasure
                            let toBeOpened = Math.floor(Math.random() * i);
                            NotSelected[toBeOpened].turnFaceUp();
                            console.log(`Clicked treasure, open ${toBeOpened} of ${i}`);
                        } else if (i == 1) {
                            NotSelected[0].turnFaceUp();
                            console.log(`Not clicked treasure, open first of ${i}`);
                        } else {
                            alert("Bad calc?");
                        }
                    } else if (this.SelectedCard == null && this.Retry === true) {
                        this.SelectedCard = card;
                        if (card.isTreasure) {
                            this.WinCount += 1;
                        }
        
                        this.TotalCount += 1;
                        card.turnFaceUp();
                        this.WriteStateIndicator();
                    } else {
                        card.turnFaceUp();
                    }
                    
                    break;
                
                case 2:
                    alert("Game mode not implemented!");
                    break;
                
                default:
                    alert("Unknown Game Mode");
            }
        },
        onCardImageLoaded: function (index) {
            this.Cards[index].onCardImageLoaded();
        },
        onCardTransitionComplete: function (index) {
            this.Cards[index].onCardFlipComplete();
        },
        onCardClick: function (index) {
            this.Cards[index].onCardClick();
        }
    }


    function mapCard(index, gameEngine) {

        let container = document.querySelector(`#Card${index}`);
        if (container == null)
            return { error: "Card container element not found!" };
        
        let card = container.querySelector(".card");
        if (card == null)
            return { error: "Card class not found!" };

        let backDIV = card.querySelector(".card-back");
        if (backDIV == null)
            return { error: "Back side element not found!" };
    
        let backImage = backDIV.querySelector(".cardImg");
        if (backImage == null)
            return { error: "Back side image not found!" };
    
        let frontImage = card.querySelector(".card-front .cardImg");
        if (frontImage == null)
            return { error: "Front side image not found!" };
    
        let cardInfo = card.querySelector(".card-front .card-info");
        if (cardInfo == null)
            return { error: "Card info class not found!" };

        let apiInfo = card.querySelector(".card-back .api-info");
        if (apiInfo == null)
            return { error: "API info class not found!" };
    
        return { // CARD OBJECT
            index: index,
            gameEngine: gameEngine,
            isTreasure: false,
            isLoading: true,
            error: "",
            backFaceDIV: backDIV,
            backFaceImage: backImage,
            frontFaceImage: frontImage,
            containerDIV: container,
            cardDIV: card,
            cardInfoDIV: cardInfo,
            apiInfoDIV: apiInfo,
            setIsTreasure: function (trueFalse) {
                this.isTreasure = trueFalse;
            },
            onCardImageLoaded: function () {
                this.apiInfoDIV.innerText = "";
                this.setImageLoaded(true);
                this.isLoading = false;
            },
            onCardFlipComplete: async function () {
                if (!this.cardIsFaceUp()) {
                    // load new card image
                    await this.loadNew();
                }
            },
            onCardClick: async function () {
                if (!this.isLoading) {
                    if (this.cardIsFaceUp()) {
                        if(this.gameEngine.SelectedCard != null)
                            await this.gameEngine.StartNewGame();
                    } else {
                        this.gameEngine.playerSelection(this);
                        
                    }
                }
            },
            cardIsFaceUp: function () {
                return this.cardDIV.classList.contains("flip-it");
            },
            turnFaceUp: function () {
                this.cardDIV.classList.add("flip-it");
            },
            turnFaceDown: async function () {
                await new Promise(resolve => setTimeout(resolve, 100));

                this.isLoading = true;
                this.setImageLoaded(false);
                if (this.cardIsFaceUp()) {
                    this.cardDIV.classList.remove("flip-it");
                } else {
                    this.loadNew();
                }
            },
            setImageLoaded: function (trueFalse) {
                if (trueFalse === true)
                    this.backFaceDIV.classList.remove("wait-for-image");
                else
                    this.backFaceDIV.classList.add("wait-for-image");
            },
            loadNew: async function () {
                this.setImageLoaded(false);

                let url = "https://api.scryfall.com/cards/random?";

                if (this.isTreasure === true) {
                    url += "q=year>2010 eur>50";
                } else {
                    url += "q=year>2020 eur%3d0.01";
                }

                this.apiInfoDIV.innerText = "Fetching card from API";
            
                await fetch(url) //q=r%3dc
                    .then((response) => response.json())
                    .then((json) => {
                        let imgNode = json;
            
                        if(json.card_faces != undefined && json.card_faces.length >= 1)
                            imgNode = json.card_faces[0];
            
                        this.apiInfoDIV.innerText = "Loading image";
                        this.frontFaceImage.src = imgNode.image_uris.normal;

                        if(json.prices.eur != null)
                            this.showPrice(Number.parseFloat(json.prices.eur), false);
                        else
                            this.showPrice(Number.parseFloat(json.prices.eur_foil), true);

                    })
                    .catch((err) => { throw err });
            },
            showPrice: function (eur, isFoil) {
                let price = eur * 10.0; // simple euro -> sek
                if(price < 10.0)
                    price = Math.ceil(price);
                else
                    price = Math.round(price);
    
                this.cardInfoDIV.innerText = price.toString() + " kr" + (isFoil ? " (foil)" : "");

                if (price >= 100) {
                    this.cardInfoDIV.classList.remove("bad");
                    this.cardInfoDIV.classList.add("good");
                } else {
                    this.cardInfoDIV.classList.remove("good");
                    this.cardInfoDIV.classList.add("bad");
                }
            },
        }
    }
};

