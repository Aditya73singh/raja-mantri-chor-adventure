
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { ChevronLeft, Crown, ScrollText, UserX, Shield } from 'lucide-react';

const Rules: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-radial from-blue-50 to-white pt-20 pb-10">
      <Header />
      
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="pl-0 flex items-center hover:bg-transparent">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <div className="glass rounded-2xl p-8 shadow-lg animate-fade-in">
          <h1 className="text-3xl font-bold mb-6">How to Play</h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Game Overview</h2>
              <p className="text-muted-foreground">
                Raja Mantri Chor Sipahi is a traditional Indian guessing game where
                players are assigned secret roles, and the Sipahi must identify who has 
                the role of Chor.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Roles & Points</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass p-3 rounded-xl border-l-4 border-game-raja">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="h-4 w-4 text-game-raja" />
                    <h3 className="font-medium">Raja</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">800 points</p>
                </div>
                
                <div className="glass p-3 rounded-xl border-l-4 border-game-mantri">
                  <div className="flex items-center gap-2 mb-1">
                    <ScrollText className="h-4 w-4 text-game-mantri" />
                    <h3 className="font-medium">Mantri</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">900 points</p>
                </div>
                
                <div className="glass p-3 rounded-xl border-l-4 border-game-chor">
                  <div className="flex items-center gap-2 mb-1">
                    <UserX className="h-4 w-4 text-game-chor" />
                    <h3 className="font-medium">Chor</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">0 points (or 1000 if not caught)</p>
                </div>
                
                <div className="glass p-3 rounded-xl border-l-4 border-game-sipahi">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-game-sipahi" />
                    <h3 className="font-medium">Sipahi</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">1000 points (if correct)</p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Game Rules</h2>
              <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                <li>At the beginning of each round, players are randomly assigned roles.</li>
                <li>Raja and Sipahi roles are revealed to all players.</li>
                <li>Mantri and Chor remain hidden.</li>
                <li>The Sipahi must guess which player has been assigned the Chor role.</li>
                <li>
                  If the Sipahi guesses correctly:
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Raja gets 800 points</li>
                    <li>Mantri gets 900 points</li>
                    <li>Sipahi gets 1000 points</li>
                    <li>Chor gets 0 points</li>
                  </ul>
                </li>
                <li>
                  If the Sipahi guesses incorrectly:
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Raja gets 800 points</li>
                    <li>Mantri gets 900 points</li>
                    <li>Sipahi gets 0 points</li>
                    <li>Chor gets 1000 points</li>
                  </ul>
                </li>
                <li>After seven rounds, the player with the highest score wins.</li>
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rules;
