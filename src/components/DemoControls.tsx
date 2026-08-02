import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  KeyRound,
  Flame,
  RefreshCw,
  Snowflake,
  Bomb,
  XCircle,
  ScrollText,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { useOrchestrator, useAegis } from '@/orchestrator';

interface DemoButton {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant: 'attack' | 'security' | 'danger' | 'neutral';
  disabled?: boolean;
}

export function DemoControls({ onAuditTrail }: { onAuditTrail: () => void }) {
  const { state } = useAegis();
  const {
    simulatePromptInjection,
    simulateStolenKey,
    launchSpamAttack,
    rotateSessionKey,
    freezeWallet,
    unfreezeWallet,
    nukeWallet,
    cancelPendingTx,
    resetDemo,
  } = useOrchestrator();

  const missionId = state.selectedMissionId;
  const hasMission = !!missionId;

  // Nuke confirmation state
  const [showNukeConfirm, setShowNukeConfirm] = useState(false);
  const [nuking, setNuking] = useState(false);

  const handleNukeClick = () => {
    if (!missionId) return;
    setShowNukeConfirm(true);
  };

  const handleNukeConfirm = async () => {
    if (!missionId) return;
    setNuking(true);
    try {
      await nukeWallet(missionId);
      setShowNukeConfirm(false);
    } catch (error) {
      console.error('Nuke failed:', error);
    } finally {
      setNuking(false);
    }
  };

  const buttons: DemoButton[] = [
    { label: 'Simulate Prompt Injection', icon: Bug, onClick: () => void simulatePromptInjection(), variant: 'attack' },
    { label: 'Simulate Stolen Key', icon: KeyRound, onClick: () => void simulateStolenKey(), variant: 'attack' },
    { label: 'Launch Spam Attack', icon: Flame, onClick: () => void launchSpamAttack(), variant: 'attack' },
    {
      label: 'Rotate Session Key',
      icon: RefreshCw,
      onClick: () => missionId && void rotateSessionKey(missionId),
      variant: 'security',
      disabled: !hasMission,
    },
    {
      label: 'Freeze Wallet',
      icon: Snowflake,
      onClick: () => missionId && void freezeWallet(missionId),
      variant: 'security',
      disabled: !hasMission,
    },
    {
      label: 'Unfreeze Wallet',
      icon: Snowflake,
      onClick: () => missionId && void unfreezeWallet(missionId),
      variant: 'security',
      disabled: !hasMission,
    },
    {
      label: 'Nuke Wallet',
      icon: Bomb,
      onClick: handleNukeClick,
      variant: 'danger',
      disabled: !hasMission || nuking,
    },
    { label: 'Cancel Pending Transaction', icon: XCircle, onClick: () => void cancelPendingTx(), variant: 'security' },
    { label: 'Audit Trail', icon: ScrollText, onClick: onAuditTrail, variant: 'neutral' },
    { label: 'Reset Demo', icon: RotateCcw, onClick: () => void resetDemo(), variant: 'neutral' },
  ];

  const variantStyles = {
    attack: 'border-error/20 bg-error/5 text-error/90 hover:border-error/40 hover:bg-error/10',
    security: 'border-gold/20 bg-gold/5 text-gold hover:border-gold/40 hover:bg-gold/10',
    danger: 'border-error/30 bg-error/10 text-error hover:border-error/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    neutral: 'border-white/10 bg-white/[0.03] text-ink-dim hover:border-white/20 hover:text-white',
  };

  return (
    <div className="rounded-2xl border border-gold/15 bg-bg-card/40 p-4 relative">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-3.5 w-3.5 text-gold" strokeWidth={2} />
        <span className="text-[12px] font-semibold tracking-wide text-white">Demo Controls</span>
        <span className="text-[10px] text-ink-faint">— every button is live</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {buttons.map((btn, i) => {
          const Icon = btn.icon;
          return (
            <motion.button
              key={btn.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              whileHover={btn.disabled ? {} : { scale: 1.02 }}
              whileTap={btn.disabled ? {} : { scale: 0.98 }}
              onClick={btn.onClick}
              disabled={btn.disabled}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all ${
                variantStyles[btn.variant]
              } ${btn.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              {btn.label}
            </motion.button>
          );
        })}
      </div>

      {/* Nuke confirmation overlay */}
      <AnimatePresence>
        {showNukeConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="w-full max-w-xs rounded-xl border border-error/40 bg-bg-card p-5 shadow-2xl"
            >
              <div className="flex items-center gap-2 text-error mb-3">
                <AlertTriangle className="h-5 w-5" strokeWidth={2} />
                <h4 className="text-sm font-bold">Confirm Nuke</h4>
              </div>
              <p className="text-xs text-ink-dim mb-4">
                This will permanently destroy the mission wallet and refund the budget. This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowNukeConfirm(false)}
                  disabled={nuking}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 text-ink-dim hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNukeConfirm}
                  disabled={nuking}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-error text-white hover:bg-error/90 transition-colors flex items-center gap-1.5"
                >
                  {nuking ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Nuking…
                    </>
                  ) : (
                    <>
                      <Bomb className="h-3 w-3" />
                      Nuke
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}