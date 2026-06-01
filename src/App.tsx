import { useState, useEffect } from 'react';
import { GameStatus, GameModifiers } from './types';
import RetroGrid from './components/RetroGrid';
import TouchController from './components/TouchController';
import MainMenuView from './components/MainMenuView';
import SettingsView from './components/SettingsView';
import GameOverView from './components/GameOverView';
import SnakeShop from './components/SnakeShop';
import CompactHUD from './components/CompactHUD';
import DesktopLeftPanel from './components/DesktopLeftPanel';
import DesktopRightPanel from './components/DesktopRightPanel';
import { Gamepad2, Volume2, VolumeX } from 'lucide-react';
import { sfx } from './utils/audio';
import { GameProvider, useGame } from './context/GameContext';
import { useSnakeEngine } from './hooks/useSnakeEngine';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { applyDifficultyFeedback, applyComplexityFeedback } from './utils/arenaManager';

function AppContent() {
  const {
    theme,
    setTheme,
    themeColors,
    themeLocked,
    setThemeLocked,
    showGridLines,
    setShowGridLines,
    muted,
    toggleMute,
    isTouchDevice,
    touchControlsPreference,
    setTouchControlsPreference,
    arenaType,
    setArenaType,
    difficulty,
    setDifficulty,
    adaptiveSpeedOffsetMs,
    setAdaptiveSpeedOffsetMs,
    adaptiveComplexityOffset,
    setAdaptiveComplexityOffset,
    customization,
    setCustomization,
    handlePurchaseOrEquip,
    handleUnequipAll,
    highscores,
    submitHighscore,
    handleClearScores,

    foodMode,
    bulletTime,
    growthFactor,
    coinYield,
    laserGates,
    slipstream,
    smartImmersiveMode,
    setSmartImmersiveMode,
  } = useGame();

  const {
    snake,
    direction,
    food,
    goldenFood,
    obstacles,
    status,
    setStatus,
    activeArenaType,
    currentGridSize,
    score,
    applesEaten,
    goldenApplesEaten,
    timerSeconds,
    coinsEarnedThisRun,
    startGame,
    handleDirectionChange,

    laserGatesActive,
    laserGateObstacles,
    slipstreamDir,
    slipstreamActive, // Destructure dynamic wind state
    tension,          // real-time director tension metrics
    rivals,           // active glitch serpents list
    rivalCpuLabel,
    biome,            // active environmental biome sector
    terrainDecorations,
    breachActive,
    hasEscapedCabinet,
  } = useSnakeEngine({
    difficulty,
    themeLocked,
    setTheme,
    arenaType,
    adaptiveComplexityOffset,
    adaptiveSpeedOffsetMs,
    setCustomization,
    modifiers: {
      foodMode,
      bulletTime,
      growthFactor,
      coinYield,
      laserGates,
      slipstream,
    },
  });

  const [menuView, setMenuView] = useState<'main' | 'records'>('main');
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  // Smart Immersive HUD states
  const [showQuickMenu, setShowQuickMenu] = useState<boolean>(false);
  const [showImmersiveTip, setShowImmersiveTip] = useState<boolean>(false);

  // Manage Immersive Mode floating banner prompt fadeout
  useEffect(() => {
    if (status === 'PLAYING' && smartImmersiveMode === 'ON') {
      setShowImmersiveTip(true);
      const timer = setTimeout(() => {
        setShowImmersiveTip(false);
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      setShowImmersiveTip(false);
    }
  }, [status, smartImmersiveMode]);

  // Proximity mouse sensor to slide down the smart overlay menu
  useEffect(() => {
    if (status !== 'PLAYING' && status !== 'PAUSED') {
      setShowQuickMenu(false);
      return;
    }

    // Always show the quick menu if paused to give instant navigation control
    if (status === 'PAUSED') {
      setShowQuickMenu(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 55) {
        setShowQuickMenu(true);
      } else if (e.clientY > 115) {
        setShowQuickMenu(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [status]);

  // Keyboard controls handler hook
  const { pressedKeys } = useKeyboardControls({
    gameStatus: status,
    onDirectionChange: handleDirectionChange,
    onTogglePause: () => setStatus((p) => (p === 'PAUSED' ? 'PLAYING' : 'PAUSED')),
    onStartGame: startGame,
    onReturnToMenu: () => {
      sfx.playClick();
      setMenuView('main');
    },
  });

  // Calculate highest score for difficulty preset
  const maxDifficultyHighscore = highscores
    .filter((entry) => entry.difficulty === difficulty)
    .reduce((max, entry) => (entry.score > max ? entry.score : max), 0);

  const checkHighscoreQualification = (finalScore: number): boolean => {
    if (finalScore <= 0) return false;
    const sameDiffScores = highscores.filter((e) => e.difficulty === difficulty);
    if (sameDiffScores.length < 10) return true;
    const lowestScore = sameDiffScores.sort((a, b) => b.score - a.score)[sameDiffScores.length - 1]?.score || 0;
    return finalScore > lowestScore;
  };

  const handleHighscoreSubmission = (initials: string) => {
    submitHighscore(initials, score, difficulty);
  };

  const handleDifficultyFeedback = (feedback: 'EASY' | 'JUST_RIGHT' | 'HARD') => {
    const nextOffset = applyDifficultyFeedback(adaptiveSpeedOffsetMs, feedback);
    setAdaptiveSpeedOffsetMs(nextOffset);
    const nextComplexity = applyComplexityFeedback(adaptiveComplexityOffset, feedback);
    setAdaptiveComplexityOffset(nextComplexity);
  };

  // Detect desktop display aspect ratio (at least lg size or min-width: 1024px)
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showSidePanels = isDesktop && !(smartImmersiveMode === 'ON' && (status === 'PLAYING' || status === 'PAUSED'));

  return (
    <div
      className={`min-h-screen ${themeColors.background} font-mono flex flex-col justify-between items-center overflow-x-hidden select-none transition-colors duration-500`}
      id="retro-snake-root"
    >
      {/* SMART FLOATING QUICK HUD MENU OVERLAY */}
      {smartImmersiveMode === 'ON' && (status === 'PLAYING' || status === 'PAUSED') && showQuickMenu && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-3 animate-slide-down"
          id="smart-immersive-hud"
        >
          <div className={`flex items-center gap-5 bg-neutral-950/90 backdrop-blur-md border-[3px] border-double p-2 px-4 rounded-b-md shadow-2xl transition-all duration-300 ${themeColors.borderClass} ${themeColors.textPrimary} font-mono uppercase text-[9px] tracking-wider`}>
            <div className="flex items-center gap-1.5 shrink-0 opacity-60">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>SMART SYSTEM HUD</span>
            </div>
            
            <span className="opacity-35">|</span>
            
            {/* Play / Pause toggle */}
            <button 
              onClick={() => setStatus((p) => (p === 'PAUSED' ? 'PLAYING' : 'PAUSED'))}
              className="hover:text-yellow-400 cursor-pointer font-bold transition-colors py-1 px-2 rounded hover:bg-white/5 border border-transparent hover:border-current"
            >
              {status === 'PAUSED' ? '▶ RESUME' : '⏸ PAUSE'}
            </button>

            {/* Volume Toggle */}
            <button 
              onClick={toggleMute}
              className="hover:text-yellow-400 cursor-pointer font-bold transition-colors py-1 px-2 rounded hover:bg-white/5 border border-transparent hover:border-current"
            >
              {muted ? '🔊 UNMUTE' : '🔇 MUTE'}
            </button>

            {/* Shop shortcut */}
            <button 
              onClick={() => {
                sfx.playClick();
                setStatus('SHOP');
              }}
              className="hover:text-yellow-400 cursor-pointer font-bold transition-colors py-1 px-2 rounded hover:bg-white/5 border border-transparent hover:border-current"
            >
              🛒 LOCKER SHOP
            </button>

            {/* Back to main menu */}
            <button 
              onClick={() => {
                sfx.playClick();
                setStatus('MENU');
              }}
              className="hover:text-red-400 cursor-pointer font-bold transition-colors py-1 px-2 rounded hover:bg-white/5 border border-transparent hover:border-current"
            >
              🚪 ABORT RUN
            </button>

            <span className="opacity-35">|</span>

            {/* Verbose Mode toggler */}
            <button 
              onClick={() => {
                sfx.playClick();
                setSmartImmersiveMode('OFF');
              }}
              className="text-amber-400 font-extrabold cursor-pointer hover:underline py-1 px-1.5 rounded hover:bg-white/5 border border-transparent hover:border-current"
              title="Switch back to verbose side cabinet panel layout"
            >
              🔍 SHOW PANELS
            </button>
          </div>
        </div>
      )}

      {/* IMMERSIVE MODE GUIDE PROMPT BANNER */}
      {smartImmersiveMode === 'ON' && status === 'PLAYING' && showImmersiveTip && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 bg-black/85 border border-cyan-500/35 p-2 px-4 rounded shadow-lg text-[9px] text-cyan-400/80 font-bold uppercase tracking-widest text-center animate-pulse">
          ✨ IMMERSIVE FOCUS LIVE — SLIDE CURSOR TO TOP FOR SYSTEM MENU ✨
        </div>
      )}

      {status !== 'PLAYING' && status !== 'PAUSED' && (
        <header
          className="w-full border-b border-dashed border-opacity-20 border-current p-4"
          id="retro-app-header"
        >
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className={`flex items-center gap-2 ${themeColors.textPrimary}`}>
              <Gamepad2 className="w-5 h-5 animate-pulse" />
              <h1 className="text-lg font-black tracking-widest uppercase">
                RETRO_SNAKE
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Stereo pixelated equalizer bouncing columns */}
              {!muted && (
                <div 
                  className={`flex items-end gap-[2.5px] h-3.5 w-5 px-[1px] pb-[1px] ${themeColors.textSecondary}`} 
                  title="Arcade Equalizer Audio Waveform"
                >
                  <span className="w-[2.5px] bg-current rounded-t-[1px] animate-eq-1" style={{ animationDelay: '0.15s' }} />
                  <span className="w-[2.5px] bg-current rounded-t-[1px] animate-eq-2" style={{ animationDelay: '0.35s' }} />
                  <span className="w-[2.5px] bg-current rounded-t-[1px] animate-eq-3" style={{ animationDelay: '0.2s' }} />
                  <span className="w-[2.5px] bg-current rounded-t-[1px] animate-eq-4" style={{ animationDelay: '0.45s' }} />
                </div>
              )}

              <button
                onClick={toggleMute}
                className={`p-2 rounded border border-transparent hover:border-current cursor-pointer transition-colors ${themeColors.textPrimary}`}
                title={muted ? 'Unmute Sound' : 'Mute Sound'}
                id="header-mute-toggle"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ADAPTIVE CAB PANELS WRAPPER */}
      <div className="w-full max-w-7xl mx-auto flex-grow flex items-stretch justify-center gap-6 p-4">
        {/* LEFT CABIN PANEL */}
        {showSidePanels && (
          <DesktopLeftPanel
            highscores={highscores}
            customization={customization}
            themeColors={themeColors}
            difficulty={difficulty}
            onOpenShop={() => setStatus('SHOP')}
            onClearScores={handleClearScores}
          />
        )}

        {/* ARCADE SIMULATION SCREEN */}
        <div className={`relative flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${showSidePanels ? 'flex-grow border-[6px] border-double p-5 rounded-md bg-black/35 ' + themeColors.borderClass : 'w-full max-w-3xl border-[6px] border-double p-8 rounded-lg bg-black/50 shadow-2xl ' + themeColors.borderClass}`}>
          {isDesktop && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-neutral-900 border border-current border-opacity-35 px-3 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest text-[#ffffff]/80">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'PLAYING' ? 'bg-green-400 animate-ping' : 'bg-green-800'}`}></span>
                GAME LIVE
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'PAUSED' ? 'bg-amber-400 animate-ping' : 'bg-amber-800'}`}></span>
                PAUSE
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'GAMEOVER' ? 'bg-red-500 animate-ping' : 'bg-red-800'}`}></span>
                OVER
              </span>
            </div>
          )}

          <main className={`w-full ${status === 'PLAYING' || status === 'PAUSED' ? 'max-w-2xl sm:max-w-max' : 'max-w-md'} mx-auto flex flex-col items-center justify-center transition-all duration-300`}>
            
            {/* VIEW 1: MAIN MENU & HALL OF FAME DIRECT INTEGRATION */}
            {status === 'MENU' && (
              <div className="w-full flex flex-col gap-4">
                <MainMenuView
                  menuView={menuView}
                  highscores={highscores}
                  difficulty={difficulty}
                  theme={theme}
                  themeColors={themeColors}
                  coins={customization.coins}
                  onStartGame={startGame}
                  onOpenSettings={() => setStatus('SETTINGS')}
                  onOpenShop={() => setStatus('SHOP')}
                  onSetMenuView={setMenuView}
                  onClearScores={handleClearScores}
                />
              </div>
            )}

            {/* VIEW 2: GAME SETTINGS */}
            {status === 'SETTINGS' && (
              <SettingsView
                touchControlsPreference={touchControlsPreference}
                setTouchControlsPreference={setTouchControlsPreference}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                theme={theme}
                setTheme={setTheme}
                themeLocked={themeLocked}
                setThemeLocked={setThemeLocked}
                arenaType={arenaType}
                setArenaType={setArenaType}
                showGridLines={showGridLines}
                setShowGridLines={setShowGridLines}
                smartImmersiveMode={smartImmersiveMode}
                setSmartImmersiveMode={setSmartImmersiveMode}
                themeColors={themeColors}
                isTouchDevice={isTouchDevice}
                onClose={() => setStatus('MENU')}
              />
            )}

            {/* VIEW 3: GAME OVER VIEW */}
            {status === 'GAMEOVER' && (
              <GameOverView
                score={score}
                difficulty={difficulty}
                theme={theme}
                themeColors={themeColors}
                coinsEarnedThisRun={coinsEarnedThisRun}
                totalCoins={customization.coins}
                checkHighscoreQualification={checkHighscoreQualification}
                onSubmitHighscore={handleHighscoreSubmission}
                onStartGame={startGame}
                onReturnToMenu={() => setStatus('MENU')}
                onProvideFeedback={handleDifficultyFeedback}
                adaptiveSpeedOffsetMs={adaptiveSpeedOffsetMs}
                adaptiveComplexityOffset={adaptiveComplexityOffset}
              />
            )}

            {/* VIEW 4: ACTIVE PLAYING HUD & SCREEN CANVAS */}
            {(status === 'PLAYING' || status === 'PAUSED') && (
              <div className="w-full flex flex-col items-center select-none" id="active-play-container">
                 <CompactHUD
                  score={score}
                  maxDifficultyHighscore={maxDifficultyHighscore}
                  timerSeconds={timerSeconds}
                  themeColors={themeColors}
                  tension={tension}
                  rivals={rivals}
                  rivalCpuLabel={rivalCpuLabel}
                  biome={biome}
                />

                <RetroGrid
                  snake={snake}
                  direction={direction}
                  food={food}
                  goldenFood={goldenFood}
                  obstacles={obstacles}
                  themeColors={themeColors}
                  gridSize={currentGridSize}
                  gameStatus={status}
                  themeKey={theme}
                  showGridLines={showGridLines}
                  score={score}
                  touchControlsVisible={touchControlsPreference === 'ON'}
                  activeHat={customization.activeHat}
                  activeBody={customization.activeBody}
                  activeParticle={customization.activeParticle}
                  laserGatesActive={laserGatesActive}
                  laserGateObstacles={laserGateObstacles}
                  slipstreamDir={slipstreamDir}
                  slipstream={slipstreamActive} // Wired dynamic active gusts!
                  rivals={rivals}               // Dynamic Glitch Rival Serpents!
                  tension={tension}             // Expose director tension telemetry!
                  biome={biome}                 // Expose active environmental biome sector!
                  terrainDecorations={terrainDecorations}
                  breachActive={breachActive}
                  hasEscapedCabinet={hasEscapedCabinet}
                />

                {touchControlsPreference === 'ON' && (
                  <TouchController
                    onDirectionChange={handleDirectionChange}
                    currentDirection={direction}
                    onTogglePause={() => setStatus((p) => (p === 'PAUSED' ? 'PLAYING' : 'PAUSED'))}
                    isPaused={status === 'PAUSED'}
                    isPlaying={true}
                    themeColors={themeColors}
                  />
                )}

                <div className="mt-4 flex items-center gap-1 opacity-40 text-[9px] tracking-wider uppercase font-mono text-center">
                  <span>{difficulty} Difficulty Mode</span>
                  <span>•</span>
                  <span>Press Space to Pause</span>
                </div>
              </div>
            )}

            {/* VIEW 5: CUSTOM PARTS SHOP STORE */}
            {status === 'SHOP' && (
              <div className="w-full flex flex-col gap-4 animate-fade-in">
                <SnakeShop
                  customization={customization}
                  onUpdateCustomization={setCustomization}
                  themeColors={themeColors}
                  onClose={() => setStatus('MENU')}
                />
              </div>
            )}
          </main>
        </div>

        {/* RIGHT CABIN PANEL */}
        {showSidePanels && (
          <DesktopRightPanel
            pressedKeys={pressedKeys}
            currentDirection={direction}
          />
        )}
      </div>

      {status !== 'PLAYING' && status !== 'PAUSED' && (
        <footer
          className="w-full border-t border-dashed border-opacity-10 border-current p-4 font-mono text-[9px] text-center opacity-60 uppercase tracking-widest"
          id="retro-app-footer"
        >
          <div className="max-w-md mx-auto flex flex-col sm:flex-row justify-between items-center gap-1.5">
            <p>© 2026 RETRO SNAKE CABINET</p>
            <p>CHROMEBOOK HIGH-FRAME OPTIMIZATION</p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
