import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Star, Heart, Feather, Cloud, Zap, Coffee, Tractor, Anchor, Palette, Gift, Moon, Sun, Dribbble,
  Diamond, Bone, Car, Bike, Plane, Trophy, RotateCcw, MonitorPlay, Home
} from 'lucide-react';

// --- Icon Setup ---
const initialIcons = [
  Star, Heart, Feather, Cloud, Zap, Coffee, Tractor, Anchor, Palette, Gift, Moon, Sun,
  Dribbble, Diamond, Bone, Car, Bike, Plane
];

// Double the icons to create 18 pairs (36 total cards)
const allIcons = initialIcons.flatMap((Icon, index) => [
  { id: 2 * index, Icon, iconKey: `icon-${index}` },
  { id: 2 * index + 1, Icon, iconKey: `icon-${index}` }
]);

// Helper to shuffle an array (Fisher-Yates)
const shuffleArray = (array) => {
  let newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- Game Constants ---
const PREVIEW_DURATION = 5; // seconds
const FLIP_BACK_DELAY = 800; // milliseconds to visually complete the flip back animation
const GAME_DURATION = 300; // seconds
const POINTS_PER_MATCH = 200;
const TIME_BONUS_MULTIPLIER = 5;

const GameState = {
  MENU: 'MENU', // New state for the start screen
  LOADING: 'LOADING',
  PREVIEW: 'PREVIEW',
  PLAYING: 'PLAYING',
  WON: 'WON',
  LOST: 'LOST'
};

// --- Stat Box Component for clean UI ---
const StatBox = ({ label, value, color, isPulsing = false }) => (
    <div className="flex flex-col items-center p-2 w-1/3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{label}</span>
        <span className={`text-3xl font-extrabold ${color} transition-all duration-300 ${isPulsing ? 'animate-pulse scale-105' : ''}`}>
            {value}
        </span>
    </div>
);

// --- Card Component ---
const Card = React.memo(({ iconKey, Icon, isFlipped, onClick, isMatched }) => {
  // Use a teal/indigo theme for a modern, beautiful look
  const cardClasses = isFlipped || isMatched
    ? 'bg-white transform rotate-y-0 shadow-2xl'
    : 'bg-teal-600 transform rotate-y-180 shadow-xl hover:shadow-2xl hover:bg-teal-500 cursor-pointer';

  return (
    <div
      className={`relative w-full h-full perspective-1000 transition-transform duration-500 ease-in-out rounded-xl ${cardClasses}`}
      onClick={!isFlipped && !isMatched ? onClick : undefined}
      style={{
        transformStyle: 'preserve-3d',
        transitionProperty: 'transform, background-color, box-shadow',
      }}
    >
      {/* Front Face (Icon side) */}
      <div
        className="absolute inset-0 backface-hidden flex items-center justify-center rounded-xl transition-opacity duration-500"
        style={{
          transform: 'rotateY(0deg)',
          opacity: isFlipped || isMatched ? 1 : 0,
          backgroundColor: isMatched ? 'rgb(204 251 241 / 1)' : 'rgb(255 255 255 / 1)', // Pale Teal or White
        }}
      >
        <Icon className={`w-10 h-10 md:w-12 md:h-12 transition-colors ${isMatched ? 'text-teal-700' : 'text-indigo-800'}`} />
      </div>
      {/* Back Face (Cover side) */}
      <div
        className="absolute inset-0 backface-hidden flex items-center justify-center rounded-xl border-4 border-teal-700 transition-opacity duration-500"
        style={{
          transform: 'rotateY(180deg)',
          opacity: isFlipped || isMatched ? 0 : 1,
          backgroundColor: 'rgb(45 212 191 / 1)', // Teal
        }}
      >
        <MonitorPlay className="w-8 h-8 text-white opacity-70" />
      </div>
    </div>
  );
});


const PurblePlace = () => {
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [isBoardLocked, setIsBoardLocked] = useState(true);
  const [gameState, setGameState] = useState(GameState.MENU); // Initial state is now MENU
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);

  // --- Game Setup / Reset Functions ---

  // Function to return to the initial menu state
  const resetToMenu = useCallback(() => {
    setCards([]);
    setFlippedIndices([]);
    setIsBoardLocked(true);
    setGameState(GameState.MENU);
    setTimeRemaining(GAME_DURATION);
    setScore(0);
  }, []);

  // Function to start the game (from Menu or Restart button)
  const startGame = useCallback(() => {
    // 1. Shuffle and reset cards
    const shuffledCards = shuffleArray(allIcons).map((card, index) => ({
      ...card,
      index, // Card's position in the grid
      isFlipped: true, // Start all flipped for preview
      isMatched: false,
    }));

    setCards(shuffledCards);
    setFlippedIndices([]);
    setIsBoardLocked(true);
    setGameState(GameState.PREVIEW);
    setTimeRemaining(GAME_DURATION);
    setScore(0);

    // 2. Start initial preview countdown
    const previewTimeout = setTimeout(() => {
      setCards(prevCards => prevCards.map(c => ({ ...c, isFlipped: false })));
      setIsBoardLocked(false);
      setGameState(GameState.PLAYING);
    }, PREVIEW_DURATION * 1000);

    // This handles cleanup if the component unmounts quickly, though unlikely here
    return () => clearTimeout(previewTimeout);
  }, []);

  // Set initial state to MENU when component mounts
  useEffect(() => {
    resetToMenu();
  }, [resetToMenu]);


  // --- Game Timer Countdown ---
  useEffect(() => {
    let timerInterval;

    if (gameState === GameState.PLAYING) {
      timerInterval = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerInterval);
            setGameState(GameState.LOST);
            setIsBoardLocked(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerInterval);
  }, [gameState]);

  // --- Match/Mismatch Logic (Purble Place Style) ---
  useEffect(() => {
    if (flippedIndices.length === 2) {
      // Lock board to prevent 3rd click while processing
      setIsBoardLocked(true);

      const [idx1, idx2] = flippedIndices;
      const card1 = cards[idx1];
      const card2 = cards[idx2];

      if (card1.iconKey === card2.iconKey) {
        // MATCH FOUND
        setScore(s => s + POINTS_PER_MATCH);

        setCards(prevCards => prevCards.map(card =>
          card.index === idx1 || card.index === idx2 ? { ...card, isMatched: true, isFlipped: true } : card
        ));

        setFlippedIndices([]);
        setIsBoardLocked(false); // Unlock immediately on match

        // Check for win condition
        // FIX: Replaced 'card.index' with 'c.index' to resolve ReferenceError.
        const allMatched = cards.every(c => c.isMatched || c.index === idx1 || c.index === idx2);
        if (allMatched) {
          // Time Bonus calculation
          setScore(s => s + timeRemaining * TIME_BONUS_MULTIPLIER);
          setGameState(GameState.WON);
        }

      } else {
        // NO MATCH - Flip back after a brief delay for user to see the mismatch
        const timeout = setTimeout(() => {
          setCards(prevCards => prevCards.map(card =>
            card.index === idx1 || card.index === idx2 ? { ...card, isFlipped: false } : card
          ));
          setFlippedIndices([]);
          setIsBoardLocked(false); // Unlock after flip-back delay
        }, FLIP_BACK_DELAY);

        return () => clearTimeout(timeout);
      }
    }
  }, [flippedIndices, cards, timeRemaining]);

  // --- Handle Card Click ---
  const handleCardClick = useCallback((index) => {
    if (isBoardLocked || cards[index].isFlipped || flippedIndices.length === 2) {
      return;
    }

    // Flip the clicked card
    setCards(prevCards => prevCards.map(card =>
      card.index === index ? { ...card, isFlipped: true } : card
    ));

    // Add the index to the flipped list
    setFlippedIndices(prev => [...prev, index]);
  }, [isBoardLocked, flippedIndices.length, cards]);


  // --- Render Functions ---
  const renderStatus = useMemo(() => {
    let message = '';
    let color = 'text-white';

    switch (gameState) {
      case GameState.MENU:
        message = 'Welcome! Ready to test your memory?';
        color = 'text-teal-400';
        break;
      case GameState.PREVIEW:
        message = `Memorize! Cards hide in ${PREVIEW_DURATION} seconds.`;
        color = 'text-yellow-400';
        break;
      case GameState.PLAYING:
        message = 'Find the matching pairs! (200 pts/match)';
        color = 'text-teal-400';
        break;
      case GameState.WON:
        message = `Game Won! Total Score: ${score} points!`;
        color = 'text-green-400';
        break;
      case GameState.LOST:
        message = 'Time is up! Game Over.';
        color = 'text-red-400';
        break;
      case GameState.LOADING:
      default:
        message = 'Loading game assets...';
        color = 'text-gray-500';
    }

    return (
      <div className={`p-3 rounded-xl text-center font-semibold text-lg flex items-center justify-center ${color} bg-gray-700`}>
        {message}
      </div>
    );
  }, [gameState, score]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center font-['Inter']">
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-0 { transform: rotateY(0deg); }
        .rotate-y-180 { transform: rotateY(180deg); }
        /* Responsive Grid: 6 columns on all sizes, but centered on page */
        .card-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.5rem; /* 8px */
          max-width: 600px; /* Limit overall size on desktop */
          width: 100%;
          padding: 0.75rem;
          background-color: #1f2937; /* Dark background for the board */
          border-radius: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
          aspect-ratio: 1 / 1; /* Keep the grid perfectly square */
          border: 6px solid rgb(52 211 163 / 1); /* Teal border */
        }
        /* Ensure card height is equal to width for a square cell */
        .card-cell {
            width: 100%;
            padding-bottom: 100%; /* Aspect ratio trick: 1:1 */
            position: relative;
        }
        .card-cell > * {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
      `}</style>
      <header className="w-full max-w-xl text-center mb-8">
        <h1 className="text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">Memory Master</h1>
        <p className="text-lg text-gray-800 mt-2">Find 18 pairs & score big!</p>
      </header>

      <div className="w-full max-w-xl mb-6 bg-gray-900 p-4 rounded-xl shadow-2xl border-b-4 border-indigo-600">
        {renderStatus}

        {/* --- Stats Display (Visible during Preview and Playing) --- */}
        {(gameState === GameState.PLAYING || gameState === GameState.PREVIEW) && (
            <div className="flex justify-between items-center mt-4 border-t border-gray-700 pt-4">
                <StatBox
                    label="SCORE"
                    value={score}
                    color="text-teal-400"
                    isPulsing={flippedIndices.length === 0 && cards.some(c => c.isMatched) && gameState === GameState.PLAYING}
                />
                <StatBox
                    label="TIME LEFT"
                    value={formatTime(timeRemaining)}
                    color={timeRemaining <= 10 && gameState === GameState.PLAYING ? 'text-red-500' : 'text-indigo-400'}
                    isPulsing={timeRemaining <= 10 && gameState === GameState.PLAYING}
                />
                <StatBox
                    label="CARDS LEFT"
                    value={cards.length - cards.filter(c => c.isMatched).length}
                    color="text-gray-400"
                />
            </div>
        )}

        {/* --- Control Buttons (Conditional) --- */}
        {gameState === GameState.MENU && (
            <button
                onClick={startGame}
                className="mt-4 w-full flex items-center justify-center bg-teal-600 hover:bg-teal-500 text-white text-xl font-bold py-4 px-4 rounded-xl transition shadow-lg hover:scale-[1.01] duration-300"
            >
                <MonitorPlay className="w-6 h-6 mr-3" /> Start Game
            </button>
        )}
        {gameState === GameState.PLAYING && (
             <button
                onClick={startGame} // Restart button
                className="mt-4 w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-md"
            >
                <RotateCcw className="w-5 h-5 mr-2" /> Restart Game
            </button>
        )}
        {gameState === GameState.PREVIEW && (
             <button
                // This button is disabled but visible to show the user they can't interrupt the preview
                disabled
                className="mt-4 w-full flex items-center justify-center bg-gray-600 text-white font-bold py-3 px-4 rounded-xl opacity-70 cursor-not-allowed"
            >
                Memorizing...
            </button>
        )}
      </div>

      {/* --- Game Grid (Visible during Preview and Playing) --- */}
      {(gameState === GameState.PLAYING || gameState === GameState.PREVIEW) && (
        <div className="card-grid">
          {cards.map((card) => (
            <div key={card.id} className="card-cell">
              <Card
                iconKey={card.iconKey}
                Icon={card.Icon}
                isFlipped={card.isFlipped}
                isMatched={card.isMatched}
                onClick={() => handleCardClick(card.index)}
              />
            </div>
          ))}
        </div>
      )}

      {/* --- Game Over / Victory Modal --- */}
      {(gameState === GameState.WON || gameState === GameState.LOST) && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 p-10 rounded-2xl shadow-2xl text-center max-w-sm w-full border-t-8 border-teal-500">
            <div className={`p-4 rounded-full inline-block mb-4 ${gameState === GameState.WON ? 'bg-teal-700' : 'bg-red-700'}`}>
              {gameState === GameState.WON ? (
                <Trophy className="w-10 h-10 text-white" />
              ) : (
                <RotateCcw className="w-10 h-10 text-white" />
              )}
            </div>
            <h2 className={`text-4xl font-extrabold mb-2 ${gameState === GameState.WON ? 'text-teal-400' : 'text-red-400'}`}>
              {gameState === GameState.WON ? 'PERFECT MATCH!' : 'TIME OVER'}
            </h2>
            <p className="text-gray-300 mb-6 text-xl font-bold">
              Final Score: <span className="text-teal-400">{score}</span> points
            </p>
            {gameState === GameState.WON && (
                <p className="text-gray-400 text-sm mb-6">
                    (Includes <span className="font-semibold text-white">{timeRemaining * TIME_BONUS_MULTIPLIER}</span> Time Bonus Points!)
                </p>
            )}

            {/* --- End Game Buttons: Menu and New Game --- */}
            <div className="flex space-x-4 mt-8">
                <button
                  onClick={resetToMenu}
                  className="flex-1 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition shadow-lg"
                >
                  <Home className="w-5 h-5 mr-2" /> Menu
                </button>
                <button
                  onClick={startGame}
                  className="flex-1 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg"
                >
                  <RotateCcw className="w-5 h-5 mr-2" /> New Game
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurblePlace;
