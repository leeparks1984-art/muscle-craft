import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, Utensils, Camera, Barcode, Flame, 
  Settings, Play, Pause, RotateCcw, CheckCircle, 
  Plus, Trash2, ChevronRight, Activity, AlertCircle, RefreshCw, X, Check
} from 'lucide-react';

export default function App() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Nutrition & Creon Settings
  const [fatRatio, setFatRatio] = useState(12); // 1 capsule per 12g fat default
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2800,
    protein: 180,
    carbs: 300,
    fat: 90
  });

  // Logged Intake & Tasks
  const [loggedMeals, setLoggedMeals] = useState(() => {
    const saved = localStorage.getItem('mc_logged_meals');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('mc_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: 'Take Creon with Breakfast', completed: false },
      { id: 2, text: 'Pre-workout blood glucose check', completed: false },
      { id: 3, text: 'Hydration target: 500ml water', completed: false },
      { id: 4, text: 'Take Creon with Lunch & Dinner', completed: false },
    ];
  });

  // Workout State
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [workoutActive, setWorkoutActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(10);
  const [timerPhase, setTimerPhase] = useState('UP'); // 'UP' (concentric 10s) or 'DOWN' (eccentric 10s) or 'REST'
  const [isPaused, setIsPaused] = useState(true);
  const [workoutLogs, setWorkoutLogs] = useState({});

  // Scanner State
  const [scannerMode, setScannerMode] = useState(null); // 'camera' | 'barcode' | null
  const [scanResult, setScanResult] = useState(null);
  const [simulatedInput, setSimulatedInput] = useState('');

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('mc_logged_meals', JSON.stringify(loggedMeals));
  }, [loggedMeals]);

  useEffect(() => {
    localStorage.setItem('mc_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // --- WORKOUT TEMPO TIMER EFFECT ---
  useEffect(() => {
    let interval = null;
    if (workoutActive && !isPaused) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev > 1) return prev - 1;
          // Phase transition
          if (timerPhase === 'UP') {
            setTimerPhase('DOWN');
            return 10;
          } else if (timerPhase === 'DOWN') {
            setTimerPhase('REST');
            return 30; // 30s rest between sets
          } else {
            setTimerPhase('UP');
            return 10;
          }
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [workoutActive, isPaused, timerPhase]);

  // --- CALCULATIONS ---
  const totalConsumed = loggedMeals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    protein: acc.protein + (meal.protein || 0),
    carbs: acc.carbs + (meal.carbs || 0),
    fat: acc.fat + (meal.fat || 0),
    creon: acc.creon + (meal.creon || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, creon: 0 });

  const calculateCreon = (fatGrams) => {
    if (!fatGrams || fatGrams <= 0) return 0;
    return Math.ceil(fatGrams / fatRatio);
  };

  const addMealToLog = (meal) => {
    const creonNeeded = calculateCreon(meal.fat);
    const newMeal = { ...meal, id: Date.now(), creon: creonNeeded };
    setLoggedMeals([newMeal, ...loggedMeals]);
    setScanResult(null);
    setScannerMode(null);
  };

  // --- PRE-SET WORKOUTS ---
  const workoutPlans = [
    {
      id: 'upper',
      name: 'Upper Body Home Hypertrophy',
      exercises: [
        { name: 'Dumbbell Floor Press', sets: 4, reps: '8-10' },
        { name: 'Bent-Over Dumbbell Rows', sets: 4, reps: '10-12' },
        { name: 'Seated Dumbbell Shoulder Press', sets: 3, reps: '10' },
        { name: 'Dumbbell Bicep Curls to Hammer Curls', sets: 3, reps: '12' }
      ]
    },
    {
      id: 'lower',
      name: 'Lower Body & Core Stability',
      exercises: [
        { name: 'Goblet Squats (Slow Tempo)', sets: 4, reps: '10-12' },
        { name: 'Dumbbell Romanian Deadlifts', sets: 4, reps: '10' },
        { name: 'Bulgarian Split Squats (Bodyweight/Light)', sets: 3, reps: '8 per leg' },
        { name: 'Weighted Plank Holds', sets: 3, reps: '45 sec' }
      ]
    }
  ];

  // --- MOCK SCANNER HANDLERS ---
  const handleSimulatedAISnap = () => {
    const sampleMeals = [
      { name: 'Grilled Chicken Breast, Quinoa & Steamed Broccoli', calories: 520, protein: 55, carbs: 45, fat: 12 },
      { name: 'Salmon Fillet with Sweet Potato Wedges & Olive Oil Drizzle', calories: 650, protein: 42, carbs: 50, fat: 28 },
      { name: 'Lean Turkey Mince Pasta with Rich Tomato & Garlic Sauce', calories: 610, protein: 48, carbs: 65, fat: 15 }
    ];
    const picked = sampleMeals[Math.floor(Math.random() * sampleMeals.length)];
    setScanResult(picked);
  };

  const handleSimulatedBarcodeScan = (code) => {
    const barcodeDatabase = {
      '5000158': { name: 'High Protein Peanut Butter (30g)', calories: 190, protein: 10, carbs: 4, fat: 16 },
      '5012345': { name: 'Greek Yogurt 0% Fat (200g)', calories: 120, protein: 20, carbs: 8, fat: 0 },
      '5098765': { name: 'Whole Rolled Oats 100g', calories: 370, protein: 13, carbs: 60, fat: 7 }
    };
    const item = barcodeDatabase[code] || { name: 'Scanned Packet Item (150g)', calories: 340, protein: 25, carbs: 30, fat: 10 };
    setScanResult(item);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-500 p-2 rounded-lg text-slate-950 font-black">
            <Dumbbell size={22} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide">MuscleCraft Pro</h1>
            <p className="text-xs text-slate-400">Type 3c • EPI & Muscle Builder</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <span className="text-xs text-emerald-400 font-semibold">Creon Ratio:</span>
          <span className="text-xs font-bold">1: {fatRatio}g Fat</span>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-md mx-auto p-4">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Daily Macros & Creon Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Today's Nutrition & Enzymes</h2>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 font-medium px-2.5 py-1 rounded-full border border-emerald-500/30">
                  {totalConsumed.creon} Creon 25k Caps Req.
                </span>
              </div>

              {/* Calories Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Calories</span>
                  <span className="font-bold">{totalConsumed.calories} / {dailyGoals.calories} kcal</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (totalConsumed.calories / dailyGoals.calories) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Macros Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-xs text-slate-400 block">Protein</span>
                  <span className="text-sm font-bold text-blue-400">{totalConsumed.protein}g</span>
                  <span className="text-[10px] text-slate-500 block">/ {dailyGoals.protein}g</span>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-xs text-slate-400 block">Carbs (Low-GI)</span>
                  <span className="text-sm font-bold text-amber-400">{totalConsumed.carbs}g</span>
                  <span className="text-[10px] text-slate-500 block">/ {dailyGoals.carbs}g</span>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-xs text-slate-400 block">Fat</span>
                  <span className="text-sm font-bold text-rose-400">{totalConsumed.fat}g</span>
                  <span className="text-[10px] text-slate-500 block">/ {dailyGoals.fat}g</span>
                </div>
              </div>
            </div>

            {/* Quick Action Scanners */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setScannerMode('camera')}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center transition-all group"
              >
                <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                  <Camera size={24} />
                </div>
                <span className="text-sm font-bold">AI Food Snap</span>
                <span className="text-xs text-slate-400">Photo plate analysis</span>
              </button>

              <button 
                onClick={() => setScannerMode('barcode')}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center transition-all group"
              >
                <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                  <Barcode size={24} />
                </div>
                <span className="text-sm font-bold">Barcode Scan</span>
                <span className="text-xs text-slate-400">Packet lookup & Creon</span>
              </button>
            </div>

            {/* Daily Reminders & Tasks */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between">
                <span>Daily Health & Routine Tasks</span>
                <Activity size={16} className="text-emerald-400" />
              </h3>
              <div className="space-y-2">
                {tasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      task.completed ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400 line-through' : 'bg-slate-800/40 border-slate-800 text-slate-200'
                    }`}
                  >
                    <span className="text-sm">{task.text}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${task.completed ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'}`}>
                      {task.completed && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Logged Meals */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Logged Meals & Creon Doses</h3>
              {loggedMeals.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No meals logged yet today. Use the AI Camera or Barcode scanner above!</p>
              ) : (
                <div className="space-y-3">
                  {loggedMeals.map(meal => (
                    <div key={meal.id} className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{meal.name}</h4>
                        <p className="text-xs text-slate-400">
                          {meal.calories} kcal | P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fat}g
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg text-xs font-bold block">
                          {meal.creon} Caps 25k
                        </span>
                        <button 
                          onClick={() => setLoggedMeals(loggedMeals.filter(m => m.id !== meal.id))}
                          className="text-[10px] text-rose-400 hover:underline mt-1 inline-block"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: WORKOUTS */}
        {activeTab === 'workouts' && (
          <div className="space-y-6">
            {!selectedWorkout ? (
              <div>
                <h2 className="text-lg font-bold mb-3">Home Muscle Building Routines</h2>
                <p className="text-xs text-slate-400 mb-4">Select a routine below to open the 10-second rep tempo timer and set tracker.</p>
                
                <div className="space-y-3">
                  {workoutPlans.map(plan => (
                    <div 
                      key={plan.id}
                      onClick={() => setSelectedWorkout(plan)}
                      className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-emerald-500/50 transition-all flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-bold text-slate-100">{plan.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">{plan.exercises.length} Exercises • Dumbbell & Bodyweight</p>
                      </div>
                      <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <button 
                  onClick={() => { setSelectedWorkout(null); setWorkoutActive(false); }}
                  className="text-xs text-emerald-400 font-semibold mb-3 flex items-center space-x-1"
                >
                  ← Back to Workouts
                </button>

                <h2 className="text-lg font-bold mb-1">{selectedWorkout.name}</h2>
                
                {/* TEMPO TIMER DISPLAY */}
                <div className="my-6 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-3 text-[10px] uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    Phase: {timerPhase}
                  </div>

                  <span className="text-xs text-slate-400 block mb-1">
                    {timerPhase === 'REST' ? 'Rest Between Sets' : '10s Tempo Metronome'}
                  </span>
                  <div className="text-6xl font-black text-emerald-400 my-2 tracking-tighter">
                    {timerSeconds}s
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    {timerPhase === 'UP' && 'Concentric Phase (Push/Pull UP)'}
                    {timerPhase === 'DOWN' && 'Eccentric Phase (Lower DOWN slow)'}
                    {timerPhase === 'REST' && 'Recover and breathe'}
                  </p>

                  <div className="flex justify-center space-x-3">
                    <button 
                      onClick={() => setWorkoutActive(!workoutActive)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center space-x-2 ${
                        workoutActive ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                      }`}
                    >
                      {workoutActive ? <Pause size={16} /> : <Play size={16} />}
                      <span>{workoutActive ? 'Pause Timer' : 'Start Timer'}</span>
                    </button>
                    <button 
                      onClick={() => { setTimerSeconds(10); setTimerPhase('UP'); setWorkoutActive(false); }}
                      className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl text-slate-300"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>

                {/* EXERCISE LIST */}
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Exercises & Set Tracker</h3>
                <div className="space-y-3">
                  {selectedWorkout.exercises.map((ex, idx) => (
                    <div key={idx} className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs text-emerald-400 font-bold">Exercise {idx + 1}</span>
                          <h4 className="font-bold text-sm text-slate-100">{ex.name}</h4>
                        </div>
                        <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{ex.sets} Sets × {ex.reps}</span>
                      </div>
                      <div className="flex space-x-2 text-xs">
                        <input type="text" placeholder="Weight (kg)" className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 w-1/2 text-slate-200" />
                        <input type="text" placeholder="Reps completed" className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 w-1/2 text-slate-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MEALS & RECIPES */}
        {activeTab === 'meals' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold mb-1">Muscle Building & Type 3c Meals</h2>
            <p className="text-xs text-slate-400 mb-4">Low-GI complex carbohydrates combined with clean protein and automated Creon calculations.</p>

            <div className="space-y-4">
              {[
                { name: 'Steel-Cut Oats with Whey Isolate & Blueberries', calories: 450, protein: 40, carbs: 55, fat: 8, tag: 'Breakfast' },
                { name: 'Grilled Turkey Breast & Wild Rice Bowl with Avocado', calories: 620, protein: 52, carbs: 60, fat: 18, tag: 'Lunch' },
                { name: 'Lean Beef Steaks with Sweet Potato Mash & Asparagus', calories: 680, protein: 58, carbs: 50, fat: 22, tag: 'Dinner' },
                { name: 'Greek Yogurt, Mixed Berries & Almond Butter Snack', calories: 310, protein: 25, carbs: 18, fat: 14, tag: 'Snack' }
              ].map((recipe, idx) => {
                const creonReq = calculateCreon(recipe.fat);
                return (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">{recipe.tag}</span>
                      <span className="text-xs font-bold text-amber-400">{creonReq} Creon Capsules</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-100 mb-1">{recipe.name}</h3>
                    <p className="text-xs text-slate-400 mb-3">
                      {recipe.calories} kcal | Protein: {recipe.protein}g | Carbs: {recipe.carbs}g | Fat: {recipe.fat}g
                    </p>
                    <button 
                      onClick={() => addMealToLog(recipe)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2 rounded-xl transition-all"
                    >
                      Log Meal & Add Creon Dose
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold mb-1">Configuration & Creon Ratio</h2>
            <p className="text-xs text-slate-400 mb-4">Adjust your enzyme ratios and daily macro targets.</p>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Fat-to-Creon Ratio (1 Creon 25k capsule per X grams of fat)
                </label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="range" 
                    min="5" 
                    max="25" 
                    value={fatRatio} 
                    onChange={(e) => setFatRatio(Number(e.target.value))}
                    className="w-full accent-emerald-500" 
                  />
                  <span className="font-bold text-emerald-400 text-sm whitespace-nowrap">1 : {fatRatio}g</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Current formula: {fatRatio}g fat = 1 capsule of Creon 25,000.</p>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <h3 className="text-xs font-semibold text-slate-300 mb-3">Daily Calorie & Macro Targets</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Target Calories (kcal)</span>
                    <input 
                      type="number" 
                      value={dailyGoals.calories} 
                      onChange={(e) => setDailyGoals({...dailyGoals, calories: Number(e.target.value)})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-400 block mb-1">Protein (g)</span>
                      <input 
                        type="number" 
                        value={dailyGoals.protein} 
                        onChange={(e) => setDailyGoals({...dailyGoals, protein: Number(e.target.value)})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-100 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Carbs (g)</span>
                      <input 
                        type="number" 
                        value={dailyGoals.carbs} 
                        onChange={(e) => setDailyGoals({...dailyGoals, carbs: Number(e.target.value)})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-100 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Fat (g)</span>
                      <input 
                        type="number" 
                        value={dailyGoals.fat} 
                        onChange={(e) => setDailyGoals({...dailyGoals, fat: Number(e.target.value)})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-100 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: SCANNER / AI CAMERA SIMULATOR */}
      {scannerMode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 relative">
            <button 
              onClick={() => { setScannerMode(null); setScanResult(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X size={20} />
            </button>

            <h3 className="text-base font-bold mb-1">
              {scannerMode === 'camera' ? 'AI Camera Food Snapshot' : 'Barcode Packet Scanner'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {scannerMode === 'camera' ? 'Snap a photo of your plate to instantly analyze macros and Creon.' : 'Scan package barcode to query nutritional database.'}
            </p>

            {!scanResult ? (
              <div className="space-y-4">
                <div className="bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center">
                  <Camera size={36} className="mx-auto text-emerald-400 mb-2 animate-pulse" />
                  <p className="text-xs text-slate-400 mb-3">Camera stream active (Simulated for web)</p>
                  
                  {scannerMode === 'camera' ? (
                    <button 
                      onClick={handleSimulatedAISnap}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                    >
                      Capture & Analyze Plate
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleSimulatedBarcodeScan('5000158')}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl"
                      >
                        Simulate Scan: Peanut Butter Packet
                      </button>
                      <button 
                        onClick={() => handleSimulatedBarcodeScan('5098765')}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2 rounded-xl"
                      >
                        Simulate Scan: Rolled Oats Packet
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">Analysis Complete</span>
                  <h4 className="font-bold text-sm text-slate-100 mb-2">{scanResult.name}</h4>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Calories</span>
                      <span className="font-bold">{scanResult.calories}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Protein</span>
                      <span className="font-bold text-blue-400">{scanResult.protein}g</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Carbs</span>
                      <span className="font-bold text-amber-400">{scanResult.carbs}g</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Fat</span>
                      <span className="font-bold text-rose-400">{scanResult.fat}g</span>
                    </div>
                  </div>

                  <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="text-xs text-emerald-400 font-bold block">Required Creon Dose</span>
                      <span className="text-[10px] text-slate-400">Based on {scanResult.fat}g fat (Ratio 1:{fatRatio})</span>
                    </div>
                    <span className="text-base font-black text-emerald-400">
                      {calculateCreon(scanResult.fat)} Capsules
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => addMealToLog(scanResult)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <Check size={16} />
                  <span>Add to Daily Tracker</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="bg-slate-900 border-t border-slate-800 fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto grid grid-cols-4 py-2 px-3 text-center">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`flex flex-col items-center py-1 ${activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <Activity size={20} />
          <span className="text-[10px] mt-1 font-semibold">Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveTab('workouts')} 
          className={`flex flex-col items-center py-1 ${activeTab === 'workouts' ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <Dumbbell size={20} />
          <span className="text-[10px] mt-1 font-semibold">Workouts</span>
        </button>
        <button 
          onClick={() => setActiveTab('meals')} 
          className={`flex flex-col items-center py-1 ${activeTab === 'meals' ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <Utensils size={20} />
          <span className="text-[10px] mt-1 font-semibold">Meals</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          className={`flex flex-col items-center py-1 ${activeTab === 'settings' ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <Settings size={20} />
          <span className="text-[10px] mt-1 font-semibold">Settings</span>
        </button>
      </nav>
    </div>
  );
}