import { Trophy, Coins, Sparkles, Wand2, ShoppingBag, Trash2 } from 'lucide-react';
import { HighScoreEntry, CustomizationState, DifficultyLevel, SHOP_ITEMS, ThemeColors } from '../types';
import { sfx } from '../utils/audio';

interface DesktopLeftPanelProps {
  highscores: HighScoreEntry[];
  customization: CustomizationState;
  themeColors: ThemeColors;
  difficulty: DifficultyLevel;
  onOpenShop: () => void;
  onClearScores: () => void;
}

export default function DesktopLeftPanel({
  highscores,
  customization,
  themeColors,
  difficulty,
  onOpenShop,
  onClearScores,
}: DesktopLeftPanelProps) {
  // Get active items objects
  const activeHatItem = SHOP_ITEMS.find(item => item.codename === customization.activeHat && item.category === 'HAT');
  const activeBodyItem = SHOP_ITEMS.find(item => item.codename === customization.activeBody && item.category === 'BODY');
  const activeParticleItem = SHOP_ITEMS.find(item => item.codename === customization.activeParticle && item.category === 'PARTICLE');

  // Filter high scores for active difficulty or general top scores
  const filteredScores = highscores
    .filter(entry => entry.difficulty === difficulty)
    .slice(0, 5);

  const handleClear = () => {
    if (confirm('Are you sure you want to delete all local highs-scores entries?')) {
      sfx.playClick();
      onClearScores();
    }
  };

  return (
    <div 
      className={`hidden lg:flex flex-col gap-5 w-80 p-5 border-4 rounded-md ${themeColors.borderClass} ${themeColors.background} ${themeColors.textPrimary} transition-all duration-300 font-mono`}
      id="desktop-left-cabinet-panel"
    >
      {/* SECTION 1: CAB COIN WALLET & CUSTOM LOCKER */}
      <div className="border-b border-dashed border-current border-opacity-20 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="w-4 h-4 text-yellow-400 animate-pulse" />
          <h3 className="text-xs font-black tracking-widest uppercase text-white">CUSTOMS LOCKER</h3>
        </div>

        {/* Balance card */}
        <div className="flex items-center justify-between p-2.5 bg-black/40 border border-current border-opacity-15 rounded mb-3">
          <span className="text-[10px] uppercase opacity-75">Coin Balance:</span>
          <div className="flex items-center gap-1 text-yellow-500 font-bold">
            <Coins className="w-3.5 h-3.5 animate-bounce" />
            <span className="text-xs">{customization.coins.toLocaleString()} 🪙</span>
          </div>
        </div>

        {/* Equipped display lists */}
        <div className="space-y-2 text-[10px]">
          {/* Hat slot */}
          <div className="flex items-center justify-between p-1.5 border border-current border-opacity-10 bg-black/25 rounded">
            <span className="opacity-60 uppercase">HAT STYLE:</span>
            {activeHatItem ? (
              <span className="font-bold text-white flex items-center gap-1">
                <span>{activeHatItem.emoji}</span>
                <span>{activeHatItem.name.split(' ').pop()}</span>
              </span>
            ) : (
              <span className="text-stone-500 uppercase">NONE</span>
            )}
          </div>

          {/* Skin slot */}
          <div className="flex items-center justify-between p-1.5 border border-current border-opacity-10 bg-black/25 rounded">
            <span className="opacity-60 uppercase">BODY STYLE:</span>
            {activeBodyItem ? (
              <span className="font-bold text-white flex items-center gap-1">
                <span>{activeBodyItem.emoji}</span>
                <span>{activeBodyItem.name.split(' ').pop()}</span>
              </span>
            ) : (
              <span className="text-stone-500 uppercase">CLASSIC</span>
            )}
          </div>

          {/* Engine Trail slot */}
          <div className="flex items-center justify-between p-1.5 border border-current border-opacity-10 bg-black/25 rounded">
            <span className="opacity-60 uppercase">EMISSIONS:</span>
            {activeParticleItem ? (
              <span className="font-bold text-white flex items-center gap-1">
                <span>{activeParticleItem.emoji}</span>
                <span>{activeParticleItem.name.split(' ').pop()}</span>
              </span>
            ) : (
              <span className="text-stone-500 uppercase">NONE</span>
            )}
          </div>
        </div>

        {/* Direct Locker/Store hyperlink button */}
        <button
          onClick={() => {
            sfx.playClick();
            onOpenShop();
          }}
          className="w-full mt-3 py-1.5 uppercase tracking-widest text-[9px] font-black bg-white/5 hover:bg-white/10 text-white rounded border border-white/20 hover:border-white/50 cursor-pointer transition-colors"
          id="desktop-quick-shop-btn"
        >
          ENTER CUSTOMS STORE
        </button>
      </div>

      {/* SECTION 2: HALL OF FAME DIRECT BOARD */}
      <div className="flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500 animate-pulse" />
              <h3 className="text-xs font-black tracking-widest uppercase text-white">HALL OF FAME</h3>
            </div>
            <span className="text-[8px] bg-red-950/45 px-1 border border-red-500/20 text-red-400 capitalize font-bold rounded">
              {difficulty}
            </span>
          </div>

          {filteredScores.length === 0 ? (
            <div className="p-4 bg-black/30 border border-current border-opacity-10 rounded text-center">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block">NO PREVIOUS RECORDS</span>
              <span className="text-[8px] text-stone-600 block mt-1">CRAWL TO SET THE FIRST HIGH-SCORE ENTRY</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredScores.map((entry, index) => {
                const isGold = index === 0;
                const isSilver = index === 1;
                const isBronze = index === 2;
                let trophyColor = 'text-stone-400';
                if (isGold) trophyColor = 'text-yellow-400';
                if (isSilver) trophyColor = 'text-stone-300';
                if (isBronze) trophyColor = 'text-amber-600';

                return (
                  <div 
                    key={entry.id} 
                    className={`flex items-center justify-between p-2 rounded text-[10px] select-none border ${isGold ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-current border-opacity-5 bg-black/10'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-black w-4 text-right ${isGold ? 'text-yellow-400' : 'opacity-60'}`}>
                        {index + 1}.
                      </span>
                      <span className="font-bold text-white opacity-95">{entry.name}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-black text-white">{entry.score}</span>
                      <Sparkles className={`w-3 h-3 ${trophyColor} ${isGold ? 'animate-pulse' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clear Stats Action */}
        {highscores.length > 0 && (
          <button
            onClick={handleClear}
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-1.5 text-stone-500 hover:text-red-400 text-[8.5px] uppercase border border-stone-800 hover:border-red-950 bg-black/10 rounded cursor-pointer transition-all font-bold"
            id="desktop-clear-scores-btn"
          >
            <Trash2 className="w-3 h-3" />
            <span>Wipe Cabinet Entries</span>
          </button>
        )}
      </div>
    </div>
  );
}
