import React, { useState } from 'react';
import { LogOut, ShoppingCart, ChefHat } from 'lucide-react';
import UserAvatar from './shared/UserAvatar';
import { useWebSocket } from '../context/WebSocketContext';

export default function Navbar({ user, cartCount = 0, onCartClick, onLogout }) {
  const { connected } = useWebSocket();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'MANAGER':
        return 'Kitchen Manager';
      case 'CUSTOMER':
        return 'Customer';
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center shadow-sm">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight font-display text-slate-900">
                Smart Canteen
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    connected ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span className="text-[10px] text-slate-500 font-medium">
                  {connected ? 'Live sync' : 'Offline sync'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Customer Cart Button */}
            {user?.role === 'CUSTOMER' && (
              <button
                onClick={onCartClick}
                className="relative p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-teal-600/40 hover:text-teal-800 hover:bg-teal-50/50 active:scale-95 transition-all duration-200 cursor-pointer shadow-sm"
                title="View Cart"
              >
                <ShoppingCart className="h-5 w-5 text-teal-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-[10px] font-bold text-white ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile Capsule */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-3 p-1 sm:pl-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition cursor-pointer shadow-sm"
                >
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-900 leading-tight">{user.fullName}</span>
                    <span className="text-[10px] text-teal-700 font-medium">{getRoleLabel(user.role)}</span>
                  </div>
                  <UserAvatar name={user.fullName} role={user.role} size="sm" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 p-2 rounded-xl glass-panel z-50 animate-fade-in-up">
                      <div className="px-3 py-2 border-b border-slate-200 mb-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
