// Selectors for various elements
const selectors = {
  boardContainer: document.querySelector('.board-container'),
  board: document.querySelector('.board'),
  moves: document.querySelector('.moves'),
  timer: document.querySelector('.timer'),
  startBtn: document.getElementById('start-btn'),
  endBtn: document.getElementById('end-btn'),
  restartBtn: document.getElementById('restart-btn'),
  win: document.querySelector('.win'),
  progress: document.querySelector('.progress'),
  stars: document.querySelector('.stars')
}

// Game state management
const state = {
  gameStarted: false,
  flippedCards: 0,
  totalFlips: 0,
  totalTime: 0,
  loop: null,
  maxTime: 120, // Maximum time in seconds for progress bar
  progressValue: 100 // Percentage
}

// Shuffle function using Fisher-Yates algorithm
const shuffle = array => {
  const clonedArray = [...array]

  for (let i = clonedArray.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1))
      const original = clonedArray[i]

      clonedArray[i] = clonedArray[randomIndex]
      clonedArray[randomIndex] = original
  }

  return clonedArray
}

// Pick random unique items from an array
const pickRandom = (array, items) => {
  const clonedArray = [...array]
  const randomPicks = []

  for (let i = 0; i < items; i++) {
      const randomIndex = Math.floor(Math.random() * clonedArray.length)
      
      randomPicks.push(clonedArray[randomIndex])
      clonedArray.splice(randomIndex, 1)
  }

  return randomPicks
}

// Generate the game board
const generateGame = () => {
  const dimensions = selectors.board.getAttribute('data-dimension')  

  if (dimensions % 2 !== 0) {
      throw new Error("The dimension of the board must be an even number.")
  }

  const emojis = ['🥔', '🍒', '🥑', '🌽', '🥕', '🍇', '🍉', '🍋‍🟩', '🥭', '🍍']
  const picks = pickRandom(emojis, (dimensions * dimensions) / 2) 
  const items = shuffle([...picks, ...picks])
  const cards = `
      ${items.map(item => `
          <div class="card">
              <div class="card-front"></div>
              <div class="card-back">${item}</div>
          </div>
      `).join('')}
  `
  
  selectors.board.innerHTML = cards
}

// Start the game
const startGame = () => {
  state.gameStarted = true
  selectors.startBtn.classList.add('hidden')
  selectors.endBtn.classList.remove('hidden')
  selectors.restartBtn.classList.remove('hidden')

  state.loop = setInterval(() => {
      state.totalTime++

      selectors.moves.innerText = `${state.totalFlips} moves`
      selectors.timer.innerText = `Time: ${state.totalTime} sec`
      
      // Update progress bar based on time
      const timePercentage = (state.totalTime / state.maxTime) * 100
      state.progressValue = 100 - timePercentage
      if (state.progressValue < 0) state.progressValue = 0
      selectors.progress.style.width = `${state.progressValue}%`

      // Check for time out
      if (state.totalTime >= state.maxTime) {
          endGame(false)
      }
  }, 1000)
}

// End the game
const endGame = (won) => {
  state.gameStarted = false
  clearInterval(state.loop)
  selectors.endBtn.classList.add('hidden')
  selectors.restartBtn.classList.add('hidden')
  selectors.startBtn.classList.remove('hidden')

  if (won) {
      selectors.boardContainer.classList.add('flipped')
      let starRating = 0

      // Determine star rating based on time and moves
      if (state.totalTime < 60 && state.totalFlips < 50) {
          starRating = 3
      } else if (state.totalTime >= 60 && state.totalTime <= 90 && state.totalFlips >= 50 && state.totalFlips <= 70) {
          starRating = 2
      } else if (state.totalTime > 90 && state.totalTime <= 120 && state.totalFlips > 70 && state.totalFlips <= 80) {
          starRating = 1
      }

      // Display stars
      selectors.stars.innerHTML = ''
      for (let i = 0; i < starRating; i++) {
          selectors.stars.innerHTML += '⭐'
      }

      // If starRating is 0, end game with failure message
      if (starRating === 0) {
          selectors.win.innerHTML = `
              <span class="win-text">
                  Please try again later!
              </span>
          `
      } else {
          selectors.win.innerHTML = `
              <span class="win-text">
                  You won!<br />
                  with <span class="highlight">${state.totalFlips}</span> moves<br />
                  under <span class="highlight">${state.totalTime}</span> seconds<br />
                  <span class="highlight">Rating: ${'⭐'.repeat(starRating)}</span>
              </span>
          `
      }
  } else {
      // Time out or manual end
      selectors.win.innerHTML = `
          <span class="win-text">
              Game Ended!<br />
              <span class="highlight">Time: ${state.totalTime}</span> seconds<br />
              <span class="highlight">Moves: ${state.totalFlips}</span>
          </span>
      `
      selectors.boardContainer.classList.add('flipped')
  }
}

// Flip back non-matched cards
const flipBackCards = () => {
  document.querySelectorAll('.card:not(.matched)').forEach(card => {
      card.classList.remove('flipped')
  })

  state.flippedCards = 0
}

// Handle card flipping
const flipCard = card => {
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return

  state.flippedCards++
  state.totalFlips++

  if (!state.gameStarted) {
      startGame()
  }

  if (state.flippedCards <= 2) {
      card.classList.add('flipped')
  }

  // Update moves display
  selectors.moves.innerText = `${state.totalFlips} moves`

  // Update progress bar based on moves
  const movePenalty = (state.totalFlips / 80) * 100 // Assuming 80 moves as max
  state.progressValue = 100 - movePenalty
  if (state.progressValue < 0) state.progressValue = 0
  selectors.progress.style.width = `${state.progressValue}%`

  if (state.flippedCards === 2) {
      const flippedCards = document.querySelectorAll('.flipped:not(.matched)')

      if (flippedCards[0].innerText === flippedCards[1].innerText) {
          flippedCards[0].classList.add('matched')
          flippedCards[1].classList.add('matched')
      }

      setTimeout(() => {
          flipBackCards()
      }, 1000)
  }

  // Check if all cards are matched
  if (document.querySelectorAll('.card.matched').length === parseInt(selectors.board.getAttribute('data-dimension')) ** 2) {
      endGame(true)
  }

  // Check if progress bar has depleted due to moves
  if (state.progressValue <= 0) {
      endGame(false)
  }
}

// Attach event listeners to buttons and cards
const attachEventListeners = () => {
  // Start Button
  selectors.startBtn.addEventListener('click', () => {
      resetGame()
      startGame()
  })

  // End Game Button
  selectors.endBtn.addEventListener('click', () => {
      if (state.gameStarted) {
          endGame(false)
      }
  })

  // Restart Game Button
  selectors.restartBtn.addEventListener('click', () => {
      resetGame()
      startGame()
  })

  // Card Click Event (Event Delegation)
  selectors.board.addEventListener('click', event => {
      const card = event.target.closest('.card')
      if (card) {
          flipCard(card)
      }
  })
}

// Reset the game to initial state
const resetGame = () => {
  // Reset state
  state.gameStarted = false
  state.flippedCards = 0
  state.totalFlips = 0
  state.totalTime = 0
  state.progressValue = 100
  clearInterval(state.loop)

  // Reset UI elements
  selectors.moves.innerText = `0 moves`
  selectors.timer.innerText = `Time: 0 sec`
  selectors.progress.style.width = `100%`
  selectors.stars.innerHTML = ''
  selectors.boardContainer.classList.remove('flipped')
  selectors.win.innerHTML = `<span class="win-text">You won!</span>`

  // Hide End and Restart buttons, show Start button
  selectors.endBtn.classList.add('hidden')
  selectors.restartBtn.classList.add('hidden')
  selectors.startBtn.classList.remove('hidden')

  // Unflip all cards and remove matched classes
  document.querySelectorAll('.card').forEach(card => {
      card.classList.remove('flipped', 'matched')
  })

  // Regenerate game board
  generateGame()
}

// Initialize the game on page load
const init = () => {
  generateGame()
  attachEventListeners()
}

// Start initialization
init()
