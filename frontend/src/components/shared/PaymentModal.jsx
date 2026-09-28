import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CreditCard, ArrowRight } from 'lucide-react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function PaymentModal({
  isOpen,
  orderId,
  totalAmount,
  onSuccess,
  onClose,
}) {
  const [processing, setProcessing] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  if (!isOpen) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0f6e6a', '#067647', '#b54708', '#14212b'],
      });
    } catch {
      // ignore
    }
  };

  const createPaymentSession = async ({ useDemo }) => {
    const res = await api.post('/payments/create-order', {
      orderId,
      demoMode: !!useDemo,
    });
    const orderData = res.data;
    setRazorpayOrder(orderData);
    return orderData;
  };

  const handleStartPayment = async () => {
    setProcessing(true);
    try {
      const orderData = await createPaymentSession({ useDemo: false });

      const isRealKey =
        orderData.keyId &&
        !String(orderData.keyId).includes('mock') &&
        !String(orderData.keyId).includes('demo');

      const isMockGateway = String(orderData.razorpayOrderId || '').startsWith('order_mock_');

      if (window.Razorpay && isRealKey && !isMockGateway) {
        const options = {
          key: orderData.keyId,
          amount: Math.round(Number(orderData.amount) * 100),
          currency: orderData.currency || 'INR',
          name: 'Smart Canteen',
          description: `Order #${orderId}`,
          order_id: orderData.razorpayOrderId,
          handler: async (response) => {
            try {
              await api.post('/payments/verify', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              triggerConfetti();
              showToast('Payment verified successfully! Order sent to kitchen', 'success');
              onSuccess();
            } catch (err) {
              setRazorpayOrder(null);
              showToast(err.message || 'Payment verification failed', 'error');
            } finally {
              setProcessing(false);
            }
          },
          prefill: {
            name: user?.fullName || 'Customer',
            email: user?.email || '',
          },
          theme: {
            color: '#0f6e6a',
          },
          modal: {
            ondismiss: () => {
              setProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', () => {
          setRazorpayOrder(null);
          setProcessing(false);
          showToast('Payment failed. You can retry or use sandbox mode.', 'error');
        });
        rzp.open();
      } else {
        // No Razorpay SDK / mock gateway — fall back to sandbox session
        const demoSession = await createPaymentSession({ useDemo: true });
        setRazorpayOrder(demoSession);
        setDemoMode(true);
        setProcessing(false);
      }
    } catch (err) {
      setRazorpayOrder(null);
      showToast(err.message || 'Could not start payment. Please try again.', 'error');
      setProcessing(false);
    }
  };

  const handleEnterDemoMode = async () => {
    setProcessing(true);
    try {
      const demoSession = await createPaymentSession({ useDemo: true });
      setRazorpayOrder(demoSession);
      setDemoMode(true);
    } catch (err) {
      setRazorpayOrder(null);
      showToast(err.message || 'Could not create payment session', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSimulatedPayment = async (status = 'SUCCESS') => {
    setProcessing(true);
    try {
      if (status === 'SUCCESS') {
        let session = razorpayOrder;
        if (!session?.razorpayOrderId?.startsWith('order_mock_')) {
          session = await createPaymentSession({ useDemo: true });
        }
        await api.post('/payments/verify', {
          razorpayOrderId: session.razorpayOrderId,
          razorpayPaymentId: 'pay_mock_' + Date.now(),
          razorpaySignature: 'sig_mock_valid',
        });
        triggerConfetti();
        showToast('Payment successful! Your meal is being queued in kitchen', 'success');
        onSuccess();
      } else {
        setRazorpayOrder(null);
        showToast('Payment was cancelled. You can retry anytime.', 'warning');
        onClose();
      }
    } catch (err) {
      setRazorpayOrder(null);
      showToast(err.message || 'Payment simulation failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in-up">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl relative">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-3 text-teal-700">
            <CreditCard className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-display">Razorpay Secure Checkout</h3>
          <p className="text-xs text-slate-500 mt-1">Smart Canteen Instant Payment Gateway</p>
        </div>

        <div className="bg-stone-50 rounded-xl p-4 border border-slate-200 mb-6">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
            <span>Order Reference</span>
            <span className="font-mono text-slate-700">#{orderId?.substring(0, 10)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-sm font-semibold text-slate-800">Total Payable</span>
            <span className="text-2xl font-extrabold text-emerald-700">₹{totalAmount}</span>
          </div>
        </div>

        {!demoMode ? (
          <div className="space-y-3">
            <button
              onClick={handleStartPayment}
              disabled={processing}
              className="w-full gradient-btn-primary py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Pay ₹{totalAmount} with Razorpay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={handleEnterDemoMode}
              disabled={processing}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-700 transition text-center cursor-pointer disabled:opacity-50"
            >
              Test with Sandbox / Simulated Payment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center">
              <strong>Test / Demo Mode</strong>: Using a backend mock payment session. Simulate success to send the order to the kitchen.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleSimulatedPayment('SUCCESS')}
                disabled={processing}
                className="flex-1 gradient-btn-success py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {processing ? 'Verifying...' : 'Simulate Success'}
              </button>
              <button
                onClick={() => handleSimulatedPayment('FAILED')}
                disabled={processing}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-sm cursor-pointer"
              >
                Fail
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-xs text-slate-500 hover:text-slate-700 text-center transition cursor-pointer"
        >
          Cancel & Return
        </button>
      </div>
    </div>
  );
}
