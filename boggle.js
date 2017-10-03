/** Model classes **/

const DICE_LITERALS = 
        `aaafrs
        aaeeee
        aafirs
        adennn
        aeeeem
        aeegmu
        aegmnn
        afirsy
        bjkqxz
        ccenst
        ceiilt
        ceilpt
        ceipst
        ddhnot
        dhhlor
        dhlnor
        dhlnor
        eiiitt
        emottt
        ensssu
        fiprsy
        gorrvw
        iprrry
        nootuw
        ooottu`.split(/\s+/);

class Dice{
	constructor(literal){
		this.literal = literal.toUpperCase();
	}
	
	getRandom(){
		return this.literal.charAt(Math.floor(Math.random() * this.literal.length));
	}
}

const GAME_DICE = DICE_LITERALS.map(literal => new Dice(literal));

class Board{
	constructor(dice){
		this.characters = new Array(dice.length);
		
		// randomize sequence of dice
		var dicePool = [];
		dice.forEach(die => dicePool.push({ die, r: Math.random() }));
		dicePool.sort((a, b) => a.r > b.r);
		
		// draw random face from each die
		dicePool.forEach((die, i) => {
			// Change Q to Qu
			this.characters[i] = die.die.getRandom();
			if(this.characters[i] === 'Q') this.characters[i] = 'Qu';
		});
	}
}



/** UI classes **/


class UIBoard{
	constructor(el, board, doAddCharacter, doRemoveCharacter){
		this.onAddCharacter = this.onAddCharacter.bind(this);
		this.el = el;
		this.buttons = board.characters.map((face, i) => new LetterButton(face, i, this.onAddCharacter));
		this.drawBoard();
		this.selectedButtons = [];
		this.addCharacter = doAddCharacter;
		this.removeCharacter = doRemoveCharacter;
	}
	
	drawBoard(){
		this.buttons.forEach(button => {
			this.el.appendChild(button.el);
		});
	}
	
	onAddCharacter(button){
		if(button.el.classList.contains('disabled')){
			// can assert selected buttons is > 0
			if(this.selectedButtons[this.selectedButtons.length-1].index === button.index){
				button.setDisabled(false);
				this.selectedButtons = this.selectedButtons.slice(0, this.selectedButtons.length-1);
				this.removeCharacter(button.value);
				clearError();
			}
			else{
				displayError('You can only undo your last move.');
			}
		}
		else{
			if(this.selectedButtons.length>0){
				if(!this.isAdjacent(button, this.selectedButtons[this.selectedButtons.length-1])){
					displayError('The next button needs to be adjacent to the last button selected');
					return;
				}
			}
			
			this.addCharacter(button.value);
			button.setDisabled(true);
			this.selectedButtons.push(button);
			clearError();
		}
	}
	
	isAdjacent(a, b){
		if(a === null || b === null) return true;
		const BOARD_LENGTH = 5;

		const getRow = (i) => Math.floor(i/BOARD_LENGTH);

		const getCol = (i) => i%BOARD_LENGTH;

		return (Math.abs(getRow(a.index) - getRow(b.index)) <= 1 && Math.abs(getCol(a.index) - getCol(b.index)) <= 1);
	}



	reset(){
		this.buttons.forEach(button => {
			button.setDisabled(false);
		});
		this.selectedButtons = [];
	}
}

class LetterButton{
	constructor(face, index, cb){
		this.handleClick = this.handleClick.bind(this);
		this.setDisabled = this.setDisabled.bind(this);
		
		this.value = face;
		this.el = document.createElement('button');
		this.el.value = face;
		this.el.addEventListener('click', this.handleClick);
		this.clickCb = cb;
		this.el.innerHTML = face;
		this.index = index;
	}
	
	handleClick(event){
		this.clickCb(this);
	}
	
	setDisabled(disabled){
		this.el.classList.toggle('disabled', disabled);
	}
}

function scoreWord(word){
	if(word.length < 3) return 0;
	else if(word.length < 5) return 1;
	else if(word.length < 6) return 2;
	else if(word.length < 7) return 3;
	else if(word.length < 8) return 5;
	return 11;
}

/**
 * UI class to hold history of added words
 */
class HistoryList{
	constructor(el){
		this.scoreTotal = 0;

		this.el = el;
		// add total at the bottom
		this.totals = document.createElement('tr');
		this.totals.setAttribute('class', 'totals');
		this.totals.innerHTML = '<td>Totals</td>';
		this.totalScoreDisplay = document.createElement('td');
		this.totalScoreDisplay.innerHTML = this.scoreTotal.toString();
		this.totals.appendChild(this.totalScoreDisplay);
		this.el.appendChild(this.totals);
		this.history = {};
	}

	addWord(word){
		if(this.history.hasOwnProperty(word)){
			displayError('You have already submitted this word before.');
			return false;
		}

		this.history[word] = true;
		const wordScore = scoreWord(word);
		const row = document.createElement('tr');
		const wordDisplay = document.createElement('td');
		wordDisplay.innerHTML = word;
		const scoreDisplay = document.createElement('td');
		scoreDisplay.innerHTML = wordScore.toString(); // fix this
		row.appendChild(wordDisplay);
		row.appendChild(scoreDisplay);
		
		this.el.insertBefore(row, this.totals);
		this.scoreTotal += wordScore;
		this.totalScoreDisplay.innerHTML = this.scoreTotal.toString();
		return true;
	}
}

class WordDisplay{
	constructor(el){
		this.el = el;
		this.clear();
	}

	setString(str){
		this.el.innerHTML = '<b>Current Word</b>: ' + str;	
	}

	clear(){
		this.setString('');
	}
}


class Game{
	constructor({dice, boardEl, wordEl, historyEl, submitEl}){
		this.word = '';
		const boardValues = new Board(GAME_DICE);
		this.uiBoard = new UIBoard(boardEl, boardValues, this.addCharacter.bind(this), this.removeCharacter.bind(this));
		this.history = new HistoryList(historyEl);
		this.wordDisplay = new WordDisplay(wordEl);
		submitEl.addEventListener('click', this.submitWord.bind(this));
	}
	
	addCharacter(char){
		this.word += char;
		this.wordDisplay.setString(this.word);
	}

	removeCharacter(char){
		this.word = this.word.substring(0, this.word.length - char.length);
		this.wordDisplay.setString(this.word);
	}

	submitWord(){
		if(this.word === ''){ 
			displayError('You cannot submit empty words.');
			return;
		}
		if(!this.history.addWord(this.word)) return;
		this.wordDisplay.clear();
		this.word = '';
		this.uiBoard.reset();
		clearError();
	}
	
}

function displayError(msg){
	document.querySelector('#error').innerHTML = msg;
}

function clearError(){
	document.querySelector('#error').innerHTML = '';
}

window.addEventListener('load', function(){
	const game = new Game({
		dice: GAME_DICE,
		boardEl: document.querySelector('#board'),
		wordEl: document.querySelector('#word-display'),
		historyEl: document.querySelector('#history-display'),
		submitEl: document.querySelector('#submit')
	});
});

