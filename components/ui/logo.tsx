import { Zap } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
        <Zap size={20} className="text-white" />
      </div>
      <span className="text-xl font-bold text-white">PADD-R</span>
    </div>
  );
}