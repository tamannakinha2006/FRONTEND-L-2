import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, KeyRound, PhoneCall, XCircle, Search, Loader2, Check } from 'lucide-react';
import { useAegis, useOrchestrator } from '@/orchestrator';

export function VerificationPrompt() {
  const { state, dispatch } = useAegis();
  const { verifyOtp, rejectVerification, approveVerification } = useOrchestrator();
  const { active, missionId, level, message } = state.verification;

  const [otpInput, setOtpInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-dismiss the 'phone' notification when the mission enters 'executing' (time lock phase)
  useEffect(() => {
    if (level === 'phone' && state.mission?.status === 'executing') {
      setTimeout(() => {
        dispatch({ type: 'CLEAR_VERIFICATION' });
      }, 3000); // Give the user 3 seconds to see the notification before it clears
    }
  }, [level, state.mission?.status, dispatch]);

  if (!active || !missionId) return null;

  const handleVerify = async () => {
    if (level === 'otp' && otpInput.length !== 6) {
      setError('OTP must be 6 digits.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyOtp(missionId, otpInput);
      setOtpInput('');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await rejectVerification(missionId);
    } catch (err: any) {
      setError('Failed to cancel mission.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      await approveVerification(missionId);
    } catch (err: any) {
      setError(err.message || 'Failed to approve mission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-bg/90 p-6 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-md overflow-hidden rounded-2xl border border-gold/30 bg-bg-secondary shadow-gold-lg"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gold/15 bg-gold/5 px-6 py-5">
            {level === 'otp' && <KeyRound className="h-6 w-6 text-warning" strokeWidth={2} />}
            {level === 'phone' && <PhoneCall className="h-6 w-6 text-success animate-pulse" strokeWidth={2} />}
            {level === 'manual' && <Search className="h-6 w-6 text-error" strokeWidth={2} />}
            <div>
              <h3 className="text-[16px] font-bold text-white tracking-wide">
                {level === 'otp' ? 'Level 1: Verification Required' : 
                 level === 'phone' ? 'Level 2: Automated Alert' : 
                 'Level 3: Manual Review'}
              </h3>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-[13px] leading-relaxed text-ink-dim mb-6">
              {message}
            </p>

            {level === 'otp' && (
              <div className="space-y-4">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-gold/20 bg-bg px-4 py-3 text-center text-[18px] font-mono font-bold tracking-[0.5em] text-white placeholder:text-ink-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  autoFocus
                />
                {error && <div className="text-center text-[11px] text-error">{error}</div>}
                
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="flex-1 rounded-xl border border-gold/20 px-4 py-3 text-[13px] font-bold text-white hover:bg-white/5 disabled:opacity-50 transition-colors"
                  >
                    Cancel Mission
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={loading || otpInput.length !== 6}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-[13px] font-bold text-bg hover:shadow-gold disabled:opacity-50 transition-all"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify Execution'}
                  </button>
                </div>
              </div>
            )}

            {level === 'phone' && (
              <div className="flex flex-col items-center py-4 space-y-4">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                   <div className="absolute inset-0 rounded-full border-2 border-success/30 animate-ping" />
                   <PhoneCall className="h-8 w-8 text-success" />
                </div>
                <p className="text-center text-[12px] font-medium text-success">Browser Call Sequence Initiated...</p>
                <div className="w-full pt-4">
                  <button
                    onClick={() => dispatch({ type: 'CLEAR_VERIFICATION' })}
                    className="w-full rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-[13px] font-bold text-success hover:bg-success/20 transition-colors"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            )}

            {level === 'manual' && (
              <div className="flex flex-col items-center py-4 space-y-4">
                 <ShieldAlert className="h-12 w-12 text-warning mb-2" />
                 <p className="text-center text-[12px] text-warning font-medium max-w-[80%]">
                    This transaction has been paused indefinitely until a human administrator can review and sign off.
                 </p>
                 {error && <div className="text-center text-[11px] text-error">{error}</div>}
                 <div className="w-full pt-4 flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-error/90 px-4 py-3 text-[13px] font-bold text-white hover:bg-error transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4" /> Reject Mission</>}
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-success/90 px-4 py-3 text-[13px] font-bold text-white hover:bg-success transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Approve Mission</>}
                    </button>
                 </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}