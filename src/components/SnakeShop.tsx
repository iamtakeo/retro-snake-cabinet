import { useState } from 'react';
import { ShoppingBag, Coins, Sparkles, Wand2, RefreshCw } from 'lucide-react';
import { ShopItem, CustomizationState, SHOP_ITEMS, HatStyle, BodyStyle, ParticleTrail, ThemeColors } from '../types';
import { sfx } from '../utils/audio';

interface SnakeShopProps {
  customization: CustomizationState;
  onUpdateCustomization: (updater: (prev: CustomizationState) => CustomizationState) => void;
  themeColors: ThemeColors;
  onClose: () => void;
}

export default function SnakeShop({
  customization,
  onUpdateCustomization,
  themeColors,
  onClose,
}: SnakeShopProps) {
  const [activeTab, setActiveTab] = useState<'HAT' | 'BODY' | 'PARTICLE'>('HAT');

  const filteredItems = SHOP_ITEMS.filter((item) => item.category === activeTab);

  const isUnlocked = (item: ShopItem) => {
    return customization.unlockedItems.includes(item.id);
  };

  const isEquipped = (item: ShopItem) => {
    if (item.category === 'HAT') return customization.activeHat === item.codename;
    if (item.category === 'BODY') return customization.activeBody === item.codename;
    if (item.category === 'PARTICLE') return customization.activeParticle === item.codename;
    return false;
  };

  const handlePurchaseOrEquip = (item: ShopItem) => {
    const unlocked = isUnlocked(item);
    
    if (unlocked) {
      // Equip the item
      sfx.playClick();
      onUpdateCustomization((prev) => {
        let activeHat = prev.activeHat;
        let activeBody = prev.activeBody;
        let activeParticle = prev.activeParticle;

        if (item.category === 'HAT') {
          activeHat = activeHat === item.codename ? 'NONE' : (item.codename as HatStyle);
        } else if (item.category === 'BODY') {
          activeBody = activeBody === item.codename ? 'NORMAL' : (item.codename as BodyStyle);
        } else if (item.category === 'PARTICLE') {
          activeParticle = activeParticle === item.codename ? 'NONE' : (item.codename as ParticleTrail);
        }

        return {
          ...prev,
          activeHat,
          activeBody,
          activeParticle,
        };
      });
    } else {
      // Try to buy the item
      if (customization.coins >= item.cost) {
        sfx.playPowerUp();
        onUpdateCustomization((prev) => {
          let activeHat = prev.activeHat;
          let activeBody = prev.activeBody;
          let activeParticle = prev.activeParticle;

          // Auto-equip on buy
          if (item.category === 'HAT') {
            activeHat = item.codename as HatStyle;
          } else if (item.category === 'BODY') {
            activeBody = item.codename as BodyStyle;
          } else if (item.category === 'PARTICLE') {
            activeParticle = item.codename as ParticleTrail;
          }

          return {
            ...prev,
            coins: prev.coins - item.cost,
            unlockedItems: [...prev.unlockedItems, item.id],
            activeHat,
            activeBody,
            activeParticle,
          };
        });
      } else {
        // Play click sound or crash sfx representing error
        sfx.playClick();
        alert(`NEED EXTRA RETRO COINS!\nPlay more games to earn ${item.cost - customization.coins} more coins!`);
      }
    }
  };

  // Unequip all items helper
  const handleUnequipAll = () => {
    sfx.playClick();
    onUpdateCustomization((prev) => ({
      ...prev,
      activeHat: 'NONE',
      activeBody: 'NORMAL',
      activeParticle: 'NONE',
    }));
  };

  return (
    <div
      className={`w-full border-4 p-5 rounded-md ${themeColors.borderClass} ${themeColors.background} ${themeColors.textPrimary}`}
      id="snake-shop-wrapper"
    >
      {/* Shop Header */}
      <div className="flex items-center justify-between border-b border-dashed border-opacity-30 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-yellow-400 animate-pulse" />
          <h3 className="text-base font-black tracking-widest uppercase text-white">ARCADE CUSTOMS STORE</h3>
        </div>

        {/* Coin counter display */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 border border-yellow-500/50 rounded text-yellow-400 font-bold">
          <Coins className="w-4 h-4 animate-bounce" />
          <span className="text-sm font-mono">{customization.coins.toLocaleString()}</span>
        </div>
      </div>

      {/* Snake Preview Box: Render a fun mock of our active items */}
      <div className="mb-4 bg-black/50 border border-current border-opacity-25 rounded-md p-3 flex flex-col items-center justify-center relative overflow-hidden h-24">
        {/* Glow grid paper backing */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
        
        <span className="absolute top-1.5 left-2 text-[8px] opacity-40 font-mono">CABINET PREVIEW SYSTEM</span>
        
        {/* Customized snake preview rendering */}
        <div className="flex items-center gap-1 z-10 relative mt-1.5 font-mono select-none">
          {/* S_N_A_K_E Segments */}
          <div className="flex flex-row-reverse items-center">
            {/* HEAD with hat */}
            <div className="relative w-8 h-8 rounded border-2 border-dashed flex items-center justify-center font-bold text-xs bg-cyan-700/60 border-cyan-400 text-white animate-pulse">
              <span>H</span>
              {/* Hat emoji positioned on top */}
              {customization.activeHat !== 'NONE' && (
                <span className="absolute -top-4 text-sm scale-125 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  {SHOP_ITEMS.find((s) => s.codename === customization.activeHat && s.category === 'HAT')?.emoji}
                </span>
              )}
            </div>
            
            {/* Body 1 */}
            <div className="w-6 h-6 rounded-sm border flex items-center justify-center text-[10px] bg-cyan-800/40 border-cyan-500/70 text-cyan-400/80 mr-0.5">
              <span>{customization.activeBody !== 'NORMAL' ? '★' : '•'}</span>
            </div>

            {/* Body 2 */}
            <div className="w-5 h-5 rounded-sm border flex items-center justify-center text-[9px] bg-cyan-900/45 border-cyan-500/50 text-cyan-500/70 mr-0.5">
              <span>{customization.activeBody !== 'NORMAL' ? '★' : '•'}</span>
            </div>

            {/* Emit bubbles display */}
            {customization.activeParticle !== 'NONE' && (
              <span className="mr-2 text-xs animate-bounce opacity-80">
                {SHOP_ITEMS.find((s) => s.codename === customization.activeParticle && s.category === 'PARTICLE')?.emoji}
              </span>
            )}
          </div>
        </div>

        {/* Quick status string */}
        <div className="text-[9px] mt-2 opacity-60 flex gap-2 tracking-wider z-10 font-mono">
          <span>HAT: {customization.activeHat}</span>
          <span>•</span>
          <span>SKIN: {customization.activeBody}</span>
          <span>•</span>
          <span>DUST: {customization.activeParticle}</span>
        </div>
      </div>

      {/* Tabs list */}
      <div className="grid grid-cols-3 gap-1 mb-3.5">
        {(['HAT', 'BODY', 'PARTICLE'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              sfx.playClick();
              setActiveTab(tab);
            }}
            className={`py-1.5 px-2 border text-[10px] font-black tracking-widest text-center rounded cursor-pointer uppercase transition-all ${
              activeTab === tab
                ? 'bg-white text-black border-white shadow'
                : 'border-current hover:bg-white/5 opacity-70'
            }`}
          >
            {tab === 'HAT' && '🤠 HATS'}
            {tab === 'BODY' && '🌈 SKINS'}
            {tab === 'PARTICLE' && '✨ TRAILS'}
          </button>
        ))}
      </div>

      {/* Items Scrollable Grid Box */}
      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 select-none font-mono" id="shop-catalog-scroll">
        {filteredItems.map((item) => {
          const unlocked = isUnlocked(item);
          const equipped = isEquipped(item);

          return (
            <div
              key={item.id}
              onClick={() => handlePurchaseOrEquip(item)}
              className={`p-2.5 border rounded flex items-center justify-between transition-all cursor-pointer ${
                equipped
                  ? 'border-yellow-400 bg-yellow-500/10'
                  : unlocked
                  ? 'border-green-500/50 hover:bg-neutral-900/30'
                  : 'border-current hover:bg-white/5 border-opacity-3 w-full'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Emoji Emblem */}
                <div className="w-10 h-10 border border-current border-dashed border-opacity-30 rounded flex items-center justify-center text-2xl relative bg-black/25">
                  <span>{item.emoji}</span>
                  {equipped && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                  )}
                </div>

                <div className="text-left select-none leading-none max-w-[170px]">
                  <h4 className="text-xs font-black text-white leading-tight uppercase">{item.name}</h4>
                  <p className="text-[9px] opacity-65 leading-tight mt-0.5 uppercase">{item.description}</p>
                </div>
              </div>

              {/* Purchase Action Button / Equilibrium Status label */}
              <div className="flex flex-col items-end shrink-0 select-none">
                {equipped ? (
                  <span className="text-[10px] text-yellow-400 font-extrabold uppercase bg-yellow-400/20 px-1.5 py-0.5 border border-yellow-400 rounded">
                    EQUIPPED
                  </span>
                ) : unlocked ? (
                  <span className="text-[10px] text-green-400 font-bold uppercase bg-green-950/40 px-2 py-0.5 border border-green-500/40 rounded hover:bg-green-500 hover:text-black transition-colors">
                    EQUIP
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchaseOrEquip(item);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold leading-none rounded border cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                      customization.coins >= item.cost
                        ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500 hover:text-black'
                        : 'border-neutral-600 text-neutral-500 bg-transparent cursor-not-allowed'
                    }`}
                  >
                    <Coins className="w-3 h-3 text-current" />
                    <span>{item.cost}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer controls inside shop */}
      <div className="mt-4 pt-3 border-t border-dashed border-opacity-30 grid grid-cols-2 gap-2">
        <button
          onClick={handleUnequipAll}
          id="shop-unequip-btn"
          className="py-2.5 bg-black/35 backdrop-blur-sm border border-current text-[10px] font-bold rounded uppercase hover:bg-white/5 transition-all cursor-pointer text-opacity-80 flex items-center justify-center gap-1 hover:scale-[1.01] active:scale-[0.99]"
        >
          <RefreshCw className="w-3 h-3" />
          UNEQUIP ALL
        </button>
        
        <button
          onClick={onClose}
          id="shop-close-btn"
          className="py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black rounded uppercase hover:bg-white hover:text-black hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.06)]"
        >
          CONFIRM PARTS
        </button>
      </div>
    </div>
  );
}
