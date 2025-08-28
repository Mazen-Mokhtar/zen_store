"use client";

import { useState } from 'react';
import { X, User, Lock, AlertCircle } from 'lucide-react';
import type { SteamGame } from '@/lib/types';

interface SteamAccountInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: SteamGame;
  onSubmit: (accountInfo: { fieldName: string; value: string }[]) => void;
  isLoading: boolean;
}

export function SteamAccountInfoModal({ 
  isOpen, 
  onClose, 
  game, 
  onSubmit, 
  isLoading 
}: SteamAccountInfoModalProps) {
  const [accountInfo, setAccountInfo] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(true);

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields and email format
    const newErrors: Record<string, string> = {};
    const missingFields: string[] = [];
    
    if (game.accountInfoFields && Array.isArray(game.accountInfoFields)) {
      game.accountInfoFields.forEach(field => {
        const fieldValue = accountInfo[field.fieldName];
        const fieldName = field.fieldName.toLowerCase();
        
        // Check if required field is empty
        if (field.isRequired && (!fieldValue || fieldValue.trim() === '')) {
          newErrors[field.fieldName] = 'This field is required';
          missingFields.push(field.fieldName);
        }
        // Check email format validation
        else if (fieldValue && fieldValue.trim() !== '' && 
                (fieldName.includes('email') || fieldName.includes('gmail') || fieldName.includes('mail'))) {
          if (!isValidEmail(fieldValue)) {
            newErrors[field.fieldName] = 'Please enter a valid email address';
          }
        }
      });
    }

    // Check if there are any validation errors (missing fields or invalid emails)
    if (missingFields.length > 0 || Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsFormValid(false);
      return;
    }

    setIsFormValid(true);

    // Convert to API format
    const formattedAccountInfo = Object.entries(accountInfo)
      .filter(([_, value]) => value.trim() !== '')
      .map(([fieldName, value]) => ({ fieldName, value: value.trim() }));

    onSubmit(formattedAccountInfo);
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setAccountInfo(prev => ({ ...prev, [fieldName]: value }));
    
    // Real-time email validation
    const fieldNameLower = fieldName.toLowerCase();
    if (value.trim() !== '' && (fieldNameLower.includes('email') || fieldNameLower.includes('gmail') || fieldNameLower.includes('mail'))) {
      if (!isValidEmail(value)) {
        setErrors(prev => ({ ...prev, [fieldName]: 'Please enter a valid email address' }));
        setIsFormValid(false);
      } else {
        setErrors(prev => ({ ...prev, [fieldName]: '' }));
        // Check if all other fields are valid
        const updatedErrors = { ...errors, [fieldName]: '' };
        setIsFormValid(Object.values(updatedErrors).every(error => error === ''));
      }
    } else {
      // Clear error when user starts typing
      if (errors[fieldName]) {
        setErrors(prev => ({ ...prev, [fieldName]: '' }));
        // Check if all other fields are valid
        const updatedErrors = { ...errors, [fieldName]: '' };
        setIsFormValid(Object.values(updatedErrors).every(error => error === ''));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1B20] rounded-2xl max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold text-white">Account Information</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Game Info */}
          <div className="mb-6 p-4 bg-[#232329] rounded-xl">
            <h3 className="font-bold text-white mb-2">{game.name}</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Price:</span>
              <span className="text-green-400 font-bold">
                {game.isOffer && game.finalPrice ? game.finalPrice : game.price || 0} EGP
              </span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-medium text-sm">Secure Purchase</span>
            </div>
            <p className="text-gray-300 text-sm">
              Your account information is encrypted and used only for game delivery.
            </p>
          </div>

          {/* Account Info Fields */}
          <div className="space-y-4 mb-6">
            {game.accountInfoFields && Array.isArray(game.accountInfoFields) ? game.accountInfoFields.map((field, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  {field.fieldName}
                  {field.isRequired && <span className="text-red-400 ml-1">*</span>}
                </label>
                <input
                  type={field.fieldName.toLowerCase().includes('password') ? 'password' : 'text'}
                  value={accountInfo[field.fieldName] || ''}
                  onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                  className={`w-full px-4 py-3 bg-[#232329] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                    errors[field.fieldName] 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : 'border-gray-600 focus:border-green-500 focus:ring-green-500/50'
                  }`}
                  placeholder={`Enter your ${field.fieldName.toLowerCase()}`}
                  required={field.isRequired}
                />
                {errors[field.fieldName] && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={14} />
                    {errors[field.fieldName]}
                  </div>
                )}
              </div>
            )) : (
              <div className="text-gray-400 text-center py-4">
                No account information required for this game.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isFormValid || Object.values(errors).some(error => error !== '')}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'Complete Purchase'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}