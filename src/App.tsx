import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Character {
  id: string;
  name: string;
  characterClass: string;
  health: number;
  mana: number;
  strength: number;
  portrait?: string;
  backstory?: string;
}

export default function App() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [deck, setDeck] = useState<Character[]>([]);
  const [portrait, setPortrait] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPortrait, setLoadingPortrait] = useState(false);
  const [backstory, setBackstory] = useState<string | null>(null);
  const [loadingBackstory, setLoadingBackstory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCharacter = async () => {
    setLoading(true);
    setError(null);
    setPortrait(null);
    setBackstory(null);
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Generate a unique fantasy character name and a class (e.g., Mage, Rogue, Warrior, Archer, Paladin). Respond in JSON format with "name" and "characterClass" keys.',
        config: {
          responseMimeType: 'application/json',
        }
      });
      const response = result;
      const text = response.text.trim();
      const generatedCharacter = JSON.parse(text);
      setCharacter({
        ...generatedCharacter,
        id: self.crypto.randomUUID(),
        health: Math.floor(Math.random() * 51) + 50, // 50-100
        mana: Math.floor(Math.random() * 51) + 50, // 50-100
        strength: Math.floor(Math.random() * 41) + 10, // 10-50
      });
    } catch (e) {
      console.error(e);
      setError('Failed to generate character. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatePortrait = async () => {
    if (!character) return;
    setLoadingPortrait(true);
    setError(null);
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Generate a cartoon/video game-style portrait of a fantasy character named ${character.name}, who is a ${character.characterClass}. The portrait should visually match the character’s class.`,
            },
          ],
        },
      });

      const imagePart = result.candidates[0].content.parts.find(part => part.inlineData);
      if (imagePart && imagePart.inlineData) {
        const base64Image = imagePart.inlineData.data;
        const imageUrl = `data:image/png;base64,${base64Image}`;
        setPortrait(imageUrl);
        if (character) {
          setCharacter({ ...character, portrait: imageUrl });
        }
      } else {
        throw new Error('No image was generated.');
      }

    } catch (e) {
      console.error(e);
      setError('Failed to generate portrait. Please try again.');
    } finally {
      setLoadingPortrait(false);
    }
  };

  const generateBackstory = async () => {
    if (!character) return;
    setLoadingBackstory(true);
    setError(null);
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a unique 1-2 sentence origin story for a fantasy character named ${character.name}, who is a ${character.characterClass}.`,
      });
      const newBackstory = result.text.trim();
      setBackstory(newBackstory);
      if (character) {
        setCharacter({ ...character, backstory: newBackstory });
      }
    } catch (e) {
      console.error(e);
      setError('Failed to generate backstory. Please try again.');
    } finally {
      setLoadingBackstory(false);
    }
  };

  const saveToDeck = () => {
    if (character && !deck.find(c => c.id === character.id)) {
      setDeck([...deck, character]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans p-4">
      <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3">
            <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-stone-700 text-center sticky top-8">
              <h1 className="text-4xl font-bold mb-6 tracking-tight font-fantasy text-amber-400">Character Generator</h1>
              <button
                onClick={generateCharacter}
                disabled={loading || loadingPortrait || loadingBackstory}
                className="btn-primary"
              >
                {loading ? 'Generating...' : 'Generate New Character'}
              </button>
              {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
            {deck.length > 0 && (
              <div className="mt-8 bg-stone-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-stone-700 text-center">
                <h2 className="text-3xl font-bold mb-6 tracking-tight font-fantasy text-amber-400">My Deck</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {deck.map(c => (
                    <div key={c.id} className="bg-stone-900/60 rounded-lg p-2 border border-stone-700 text-center">
                      {c.portrait ? <img src={c.portrait} alt={c.name} className="w-full h-20 object-cover rounded-md"/> : <div className="w-full h-20 bg-stone-800 rounded-md"/>}
                      <p className="text-xs font-fantasy mt-1 truncate text-amber-300">{c.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:w-2/3">
            {character && (
              <div className="bg-stone-900/60 rounded-xl animate-fade-in border-4 border-amber-800 shadow-2xl relative overflow-hidden">
                <div className="p-6">
                  <h2 className="text-4xl font-bold text-amber-300 font-fantasy">{character.name}</h2>
                  <p className="text-xl text-stone-300 mt-1">{character.characterClass}</p>
                </div>
                
                {portrait ? (
                  <img src={portrait} alt={`${character.name} Portrait`} className="w-full h-96 object-cover object-top" />
                ) : (
                  <div className="w-full h-96 bg-stone-800 flex items-center justify-center">
                    <button onClick={generatePortrait} disabled={loadingPortrait || loadingBackstory} className="btn-secondary">
                      {loadingPortrait ? 'Generating...' : 'Generate Portrait'}
                    </button>
                  </div>
                )}

                <div className="p-6 bg-stone-800/50">
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <p className="text-sm text-stone-400">Health</p>
                      <p className="text-2xl font-bold text-red-500">{character.health}</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-400">Mana</p>
                      <p className="text-2xl font-bold text-blue-500">{character.mana}</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-400">Strength</p>
                      <p className="text-2xl font-bold text-green-500">{character.strength}</p>
                    </div>
                  </div>

                  {backstory ? (
                    <div className="p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                      <p className="text-stone-300 italic">{backstory}</p>
                    </div>
                  ) : (
                    <button onClick={generateBackstory} disabled={loadingBackstory || loadingPortrait} className="btn-secondary">
                      {loadingBackstory ? 'Generating...' : 'Generate Backstory'}
                    </button>
                  )}

                  <div className="mt-6 flex gap-4">
                    {portrait && 
                      <button onClick={generatePortrait} disabled={loadingPortrait || loadingBackstory} className="btn-secondary flex-1">
                        {loadingPortrait ? 'Regenerating...' : 'Regenerate Portrait'}
                      </button>
                    }
                    <button onClick={saveToDeck} disabled={deck.some(c => c.id === character.id)} className="btn-primary flex-1">
                      {deck.some(c => c.id === character.id) ? 'Saved' : 'Save to Deck'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

