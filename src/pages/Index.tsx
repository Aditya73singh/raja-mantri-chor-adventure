
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Info, PlayCircle } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-radial from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4">
            <Crown className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              Raja Mantri Chor Sipahi
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            A traditional Indian multiplayer guessing game reimagined for the digital age
          </p>
        </div>
        
        <div className="glass rounded-2xl p-8 shadow-lg mb-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">About the Game</h2>
              <p className="text-muted-foreground mb-4">
                In Raja Mantri Chor Sipahi, players are assigned secret roles and the Sipahi
                must use their deduction skills to identify which player has been assigned
                the role of Chor.
              </p>
              <p className="text-muted-foreground mb-4">
                With strategic elements of deception and observation, this game has been
                a favorite traditional pastime in India for generations.
              </p>
              <div className="space-x-3 mt-6">
                <Link to="/game">
                  <Button className="rounded-full">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Play Now
                  </Button>
                </Link>
                <Link to="/rules">
                  <Button variant="outline" className="rounded-full">
                    <Info className="mr-2 h-4 w-4" />
                    Game Rules
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center relative h-40 w-36">
                {/* Role cards in a fanned arrangement */}
                <div className="absolute h-36 w-24 glass rounded-xl shadow-md transform -rotate-12 bg-game-raja" />
                <div className="absolute h-36 w-24 glass rounded-xl shadow-md transform rotate-6 bg-game-mantri" />
                <div className="absolute h-36 w-24 glass rounded-xl shadow-md transform -rotate-3 bg-game-chor" />
                <div className="absolute h-36 w-24 glass rounded-xl shadow-md transform rotate-12 bg-game-sipahi" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
          <div className="glass rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-2">Secret Roles</h3>
            <p className="text-sm text-muted-foreground">
              Each player is assigned a secret role with different abilities and point values.
            </p>
          </div>
          
          <div className="glass rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-2">Strategic Guessing</h3>
            <p className="text-sm text-muted-foreground">
              The Sipahi must observe carefully to identify who is the Chor.
            </p>
          </div>
          
          <div className="glass rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-2">Real-time Gameplay</h3>
            <p className="text-sm text-muted-foreground">
              Experience smooth animations and seamless gameplay in this digital adaptation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
