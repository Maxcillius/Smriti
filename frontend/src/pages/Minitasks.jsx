import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Target, Zap, LayoutGrid, ChevronLeft, Check, X, RefreshCw, Clock } from 'lucide-react';
import PurblePlace from '../components/PurplePLace';

// --- Configuration Constants ---

const STROOP_DURATION = 60; // seconds
const TRAIL_COUNT = 10; // Number of circles in the trail
const SORTING_TRIALS = 15; // Number of items to sort

// --- Utility Functions ---

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 */
const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// --- Custom Components ---

const Card = ({ title, description, icon, onClick, color }) => (
    <div
        className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-t-4 border-${color}-500`}
        onClick={onClick}
    >
        <div className={`text-${color}-500 mb-3`}>
            {icon}
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">{title}</h2>
        <p className="text-gray-500 text-sm min-h-[3rem]">{description}</p>
    </div>
);

const Button = ({ children, onClick, color = 'indigo', disabled = false, className = '' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-6 py-3 font-semibold text-lg rounded-xl transition-all duration-200 shadow-md ${className}
            ${disabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : `bg-${color}-600 text-white hover:bg-${color}-700 active:bg-${color}-800 focus:outline-none focus:ring-4 focus:ring-${color}-300`}`}
    >
        {children}
    </button>
);

const ScoreDisplay = ({ score, total, isTime = false }) => (
    <div className="flex items-center justify-center p-3 bg-white rounded-xl shadow-inner text-gray-700 font-mono min-w-[100px]">
        <span className="font-bold text-2xl tabular-lining mr-1">
            {isTime ? score.toFixed(1) : score}
        </span>
        <span className="text-lg">
            {isTime ? 's' : (total ? `/ ${total}` : '')}
        </span>
    </div>
);

// --- Task 1: Stroop Test (Attention & Processing Speed) ---

const StroopTest = ({ onBack }) => {
    const [gameState, setGameState] = useState('menu'); // 'menu', 'running', 'finished'
    const [score, setScore] = useState(0);
    const [totalTrials, setTotalTrials] = useState(0);
    const [timer, setTimer] = useState(STROOP_DURATION);
    const [trial, setTrial] = useState(null);
    const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect'

    // Colors mapping
    const COLORS_MAP = {
        RED: { class: 'text-red-600', hex: '#dc2626' },
        GREEN: { class: 'text-green-600', hex: '#16a34a' },
        BLUE: { class: 'text-blue-600', hex: '#2563eb' },
        YELLOW: { class: 'text-yellow-600', hex: '#ca8a04' },
    };
    const COLOR_NAMES = Object.keys(COLORS_MAP);

    // Generates a single Stroop trial state.
    const generateStroopTrial = useCallback(() => {
        const wordIndex = getRandomInt(0, COLOR_NAMES.length - 1);
        let inkIndex = getRandomInt(0, COLOR_NAMES.length - 1);

        // Ensure a high chance of interference (mismatch)
        if (Math.random() < 0.7 && inkIndex === wordIndex) {
            inkIndex = (inkIndex + getRandomInt(1, COLOR_NAMES.length - 1)) % COLOR_NAMES.length;
        }

        const word = COLOR_NAMES[wordIndex];
        const correctColorName = COLOR_NAMES[inkIndex];
        const colorClass = COLORS_MAP[correctColorName].class;

        const options = new Set([correctColorName]);
        while (options.size < 4) {
            options.add(COLOR_NAMES[getRandomInt(0, COLOR_NAMES.length - 1)]);
        }

        return {
            word,
            colorClass,
            correctColorName,
            options: Array.from(options).sort(() => Math.random() - 0.5),
        };
    }, [COLOR_NAMES, COLORS_MAP]);

    // Game initiation
    const startGame = useCallback(() => {
        setScore(0);
        setTotalTrials(0);
        setTimer(STROOP_DURATION);
        setTrial(generateStroopTrial());
        setGameState('running');
        setFeedback(null);
    }, [generateStroopTrial]);

    // Timer logic
    useEffect(() => {
        let interval = null;
        if (gameState === 'running' && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => Math.max(0, prev - 0.1));
            }, 100);
        } else if (timer <= 0 && gameState === 'running') {
            setGameState('finished');
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [gameState, timer]);

    const handleAnswer = (selectedColorName) => {
        if (gameState !== 'running') return;

        setTotalTrials(prev => prev + 1);

        if (selectedColorName === trial.correctColorName) {
            setScore(prev => prev + 1);
            setFeedback('correct');
        } else {
            setFeedback('incorrect');
        }

        setTimeout(() => {
            setTrial(generateStroopTrial());
            setFeedback(null);
        }, 200);
    };

    if (gameState === 'finished') {
        const accuracy = totalTrials > 0 ? ((score / totalTrials) * 100).toFixed(1) : 0;
        return (
            <div className="p-6 bg-white rounded-xl shadow-2xl max-w-lg mx-auto text-center">
                <h2 className="text-3xl font-bold text-indigo-600 mb-4">Test Complete!</h2>
                <p className="text-xl text-gray-700 mb-2">Total Trials: <span className="font-extrabold">{totalTrials}</span></p>
                <p className="text-xl text-gray-700 mb-6">Score: <span className="font-extrabold text-green-600">{score}</span> correct (<span className="font-extrabold text-indigo-600">{accuracy}%</span> accuracy)</p>
                <div className="flex justify-center space-x-4">
                    <Button onClick={onBack} color="gray" className="flex items-center">
                        <ChevronLeft className="w-5 h-5 mr-2" /> Back to Menu
                    </Button>
                    <Button onClick={startGame} color="indigo" className="flex items-center">
                        <RefreshCw className="w-5 h-5 mr-2" /> Play Again
                    </Button>
                </div>
            </div>
        );
    }

    if (gameState === 'menu' || !trial) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-2xl max-w-lg mx-auto text-center">
                <h2 className="text-3xl font-bold text-indigo-600 mb-4">Stroop Color Word Test</h2>
                <p className="text-gray-700 mb-6">
                    **Task:** Quickly identify and click the <strong className='font-extrabold'>INK COLOR</strong> of the word, ignoring the word itself.
                    <br />**Goal:** Maximize correct answers in {STROOP_DURATION} seconds.
                </p>
                <Button onClick={startGame} color="indigo" className="w-full">
                    Start Test
                </Button>
                <button onClick={onBack} className="mt-4 text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center justify-center w-full">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </button>
            </div>
        );
    }

    const { word, colorClass, options } = trial;

    return (
        <div className="flex flex-col items-center p-4">
            <div className="w-full max-w-md flex justify-between mb-6">
                <div className="flex items-center p-3 bg-white rounded-xl shadow-inner text-gray-700 font-mono min-w-[100px]">
                    <Clock className='w-5 h-5 mr-2 text-indigo-500' />
                    <span className="font-bold text-2xl tabular-lining">{timer.toFixed(1)}s</span>
                </div>
                <ScoreDisplay score={score} total={totalTrials} />
            </div>

            <div className={`w-64 h-32 flex items-center justify-center mb-10 rounded-xl shadow-2xl transition-all duration-150 ${
                feedback === 'correct' ? 'bg-green-100 ring-4 ring-green-400' :
                feedback === 'incorrect' ? 'bg-red-100 ring-4 ring-red-400' :
                'bg-white'
            }`}>
                <p className={`font-black text-6xl uppercase ${colorClass} text-shadow-lg transition-colors duration-100`}>
                    {word}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {options.map((colorName) => (
                    <button
                        key={colorName}
                        onClick={() => handleAnswer(colorName)}
                        style={{ backgroundColor: COLORS_MAP[colorName].hex }}
                        className={`py-4 px-6 text-xl font-bold text-white uppercase rounded-xl shadow-lg transition-all duration-150 hover:opacity-90 active:scale-[0.98] ${
                            gameState !== 'running' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={gameState !== 'running'}
                    >
                        {colorName}
                    </button>
                ))}
            </div>
            <button onClick={onBack} className="mt-6 text-sm text-gray-200 hover:text-indigo-600 transition-colors flex items-center">
                <ChevronLeft className="w-4 h-4 mr-1" /> End Test
            </button>
        </div>
    );
};


// --- Task 2: Trail Making Test (Executive Function/Speed) ---

const TrailMakingTest = ({ onBack }) => {
    const [gameState, setGameState] = useState('menu'); // 'menu', 'running', 'finished'
    const [currentNumber, setCurrentNumber] = useState(1);
    const [circles, setCircles] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const containerRef = useRef(null);

    // Generates circles with non-overlapping positions
    const generateCircles = useCallback(() => {
        const generated = [];
        const containerWidth = 300;
        const containerHeight = 300;
        const radius = 25;

        for (let i = 1; i <= TRAIL_COUNT; i++) {
            let newX, newY, isOverlapping;
            let attempts = 0;
            const maxAttempts = 50;

            do {
                newX = getRandomInt(radius, containerWidth - radius);
                newY = getRandomInt(radius, containerHeight - radius);
                isOverlapping = false;

                for (const circle of generated) {
                    const dx = newX - circle.x;
                    const dy = newY - circle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < radius * 2.5) { // Ensure minimum distance between centers
                        isOverlapping = true;
                        break;
                    }
                }
                attempts++;
            } while (isOverlapping && attempts < maxAttempts);

            generated.push({ id: i, number: i, x: newX, y: newY, clicked: false });
        }
        return generated;
    }, []);

    const startGame = useCallback(() => {
        setCircles(generateCircles());
        setCurrentNumber(1);
        setStartTime(Date.now());
        setElapsedTime(0);
        setGameState('running');
        setFeedback(null);
    }, [generateCircles]);

    // Timer logic
    useEffect(() => {
        let interval = null;
        if (gameState === 'running') {
            interval = setInterval(() => {
                setElapsedTime((Date.now() - startTime) / 1000);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [gameState, startTime]);

    const handleCircleClick = (number, id) => {
        if (gameState !== 'running') return;

        if (number === currentNumber) {
            setFeedback('correct');
            setCircles(prev => prev.map(c => c.id === id ? { ...c, clicked: true } : c));

            if (currentNumber === TRAIL_COUNT) {
                setGameState('finished');
                setStartTime(null); // Stop timer
            } else {
                setCurrentNumber(prev => prev + 1);
            }
        } else {
            setFeedback('incorrect');
            setTimeout(() => setFeedback(null), 500);
        }
    };

    if (gameState === 'finished') {
        return (
            <div className="p-6 bg-white rounded-xl shadow-2xl max-w-lg mx-auto text-center">
                <h2 className="text-3xl font-bold text-teal-600 mb-4">Trail Completed!</h2>
                <p className="text-xl text-gray-700 mb-6">Your time: <span className="font-extrabold text-teal-600 text-4xl">{elapsedTime.toFixed(2)}s</span></p>
                <div className="flex justify-center space-x-4">
                    <Button onClick={onBack} color="gray" className="flex items-center">
                        <ChevronLeft className="w-5 h-5 mr-2" /> Back to Menu
                    </Button>
                    <Button onClick={startGame} color="teal" className="flex items-center">
                        <RefreshCw className="w-5 h-5 mr-2" /> Play Again
                    </Button>
                </div>
            </div>
        );
    }

    if (gameState === 'menu') {
        return (
            <div className="p-6 bg-white rounded-xl shadow-2xl max-w-lg mx-auto text-center">
                <h2 className="text-3xl font-bold text-teal-600 mb-4">Trail Making Test (Part A)</h2>
                <p className="text-gray-700 mb-6">
                    **Task:** Click the numbered circles in sequential order: **1, 2, 3, ...**
                    <br />**Goal:** Complete the sequence in the fastest time possible.
                </p>
                <Button onClick={startGame} color="teal" className="w-full">
                    Start Test
                </Button>
                <button onClick={onBack} className="mt-4 text-sm text-gray-500 hover:text-teal-600 transition-colors flex items-center justify-center w-full">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </button>
            </div>
        );
    }

    // Canvas drawing for the lines
    const CanvasOverlay = useMemo(() => {
        const activeCircles = circles.filter(c => c.clicked);
        if (activeCircles.length < 2) return null;

        const lines = [];
        for (let i = 0; i < activeCircles.length - 1; i++) {
            const start = activeCircles[i];
            const end = activeCircles[i + 1];
            lines.push(
                <line
                    key={i}
                    x1={start.x} y1={start.y}
                    x2={end.x} y2={end.y}
                    stroke="#10b981"
                    strokeWidth="3"
                />
            );
        }

        return (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {lines}
            </svg>
        );
    }, [circles]);


    return (
        <div className="flex flex-col items-center p-4">
            <div className="w-full max-w-md flex justify-between items-center mb-6">
                <div className='flex items-center space-x-2'>
                    <span className="text-lg text-gray-600 font-semibold">Next:</span>
                    <div className='w-12 h-12 flex items-center justify-center rounded-full bg-teal-600 text-white text-2xl font-bold shadow-md'>
                        {currentNumber}
                    </div>
                </div>
                <ScoreDisplay score={elapsedTime} isTime={true} />
            </div>

            <div
                ref={containerRef}
                className={`relative w-[300px] h-[300px] bg-white rounded-xl shadow-2xl border-4 transition-colors duration-200 overflow-hidden
                    ${feedback === 'incorrect' ? 'border-red-500 ring-4 ring-red-200' : 'border-gray-200'}`}
            >
                {circles.map(circle => (
                    <div
                        key={circle.id}
                        onClick={() => handleCircleClick(circle.number, circle.id)}
                        style={{
                            top: circle.y - 25,
                            left: circle.x - 25,
                        }}
                        className={`absolute w-[50px] h-[50px] flex items-center justify-center rounded-full cursor-pointer transition-all duration-150
                            ${circle.number === currentNumber && gameState === 'running'
                                ? 'bg-teal-500 text-white font-extrabold shadow-lg ring-4 ring-teal-200 scale-110'
                                : circle.clicked
                                    ? 'bg-teal-100 text-teal-800 font-bold opacity-70 cursor-default'
                                    : 'bg-gray-200 text-gray-700 font-medium hover:bg-gray-300'
                            }`}
                    >
                        {circle.number}
                    </div>
                ))}
                {CanvasOverlay}
            </div>

            <button onClick={onBack} className="mt-6 text-sm text-gray-500 hover:text-teal-600 transition-colors flex items-center">
                <ChevronLeft className="w-4 h-4 mr-1" /> End Test
            </button>
        </div>
    );
};


// --- Main App Component ---

const MiniTasks = () => {
    // State to manage the current view: 'menu', 'stroop', 'trail', 'sorting'
    const [currentTask, setCurrentTask] = useState('menu');

    const renderTask = () => {
        switch (currentTask) {
            case 'stroop':
                return <StroopTest onBack={() => setCurrentTask('menu')} />;
            case 'trail':
                return <TrailMakingTest onBack={() => setCurrentTask('menu')} />;
            case 'sorting':
                return <PurblePlace />;
            case 'menu':
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto p-4">
                        <Card
                            title="Stroop Test"
                            description="Measure attention and inhibitory control by identifying ink colors."
                            icon={<Zap className="w-8 h-8" />}
                            onClick={() => setCurrentTask('stroop')}
                            color="indigo"
                        />
                        <Card
                            title="Trail Making Test"
                            description="Challenge attention and visual processing speed by connecting numbered dots."
                            icon={<Target className="w-8 h-8" />}
                            onClick={() => setCurrentTask('trail')}
                            color="teal"
                        />
                        <Card
                            title="Attribute Sorting"
                            description="Test logical reasoning and categorization speed based on visual attributes."
                            icon={<LayoutGrid className="w-8 h-8" />}
                            onClick={() => setCurrentTask('sorting')}
                            color="pink"
                        />
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 pt-[10rem] font-sans p-4 flex flex-col items-center">
            {/* Tailwind utility classes for color safety. (Avoids purging dynamic classes) */}
            <div className="hidden text-red-600 text-green-600 text-blue-600 text-yellow-600 text-cyan-600 text-fuchsia-600 border-indigo-500 border-teal-500 border-pink-500 bg-indigo-600 bg-teal-600 bg-pink-600 bg-gray-300 bg-red-500 bg-blue-500 hover:bg-red-600 hover:bg-blue-600 ring-4 ring-red-200 border-red-500"></div>

            <header className="w-full max-w-6xl mb-10">
                <h1 className="text-6xl font-extrabold text-white text-center">
                    Cognitive Fitness Lab
                </h1>
                <p className="text-center text-gray-800 mt-6">
                    A collection of mini-tests for attention, memory, and problem-solving.
                </p>
            </header>

            <main className="w-full max-w-6xl">
                {renderTask()}
            </main>
        </div>
    );
};

export default MiniTasks;
