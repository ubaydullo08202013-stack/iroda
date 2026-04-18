/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  BookOpen, 
  BrainCircuit, 
  Search, 
  ChevronRight, 
  Volume2, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Menu, 
  X, 
  Lightbulb,
  Plane,
  Briefcase,
  Coffee
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Plane,
  Briefcase,
  Coffee,
};
import { translateText, getWordDetails, explainGrammar, generateRandomWords } from './lib/gemini';
import { Word, Category, QuizQuestion, GrammarTopic } from './types';
import ReactMarkdown from 'react-markdown';

// Mock Data
const MOCK_GRAMMAR_TOPICS: GrammarTopic[] = [
  { id: '1', title: 'Present Simple', description: 'Hozirgi oddiy zamon qoidalari' },
  { id: '2', title: 'Articles (A, An, The)', description: 'Artikllarning ishlatilishi' },
  { id: '3', title: 'Passive Voice', description: 'Majhul nisbatning hosil bo\'lishi' },
  { id: '4', title: 'Conditionals', description: 'Shart jumlalari (If cluases)' },
];
const MOCK_WORDS: Word[] = [
  { id: '1', english: 'Resilient', uzbek: 'Chidamli', phonetic: '/rɪˈzɪl.jənt/', example: 'She is a resilient woman who overcomes all obstacles.' },
  { id: '2', english: 'Eloquent', uzbek: 'Notiq', phonetic: '/ˈel.ə.kwənt/', example: 'He gave an eloquent speech at the graduation.' },
  { id: '3', english: 'Perseverance', uzbek: 'Matonat', phonetic: '/ˌpɜː.sɪˈvɪə.rəns/', example: 'Stability and perseverance are keys to success.' },
  { id: '4', english: 'Ambiguous', uzbek: 'Mavhum', phonetic: '/æmˈbɪɡ.ju.əs/', example: 'The instructions were ambiguous and difficult to follow.' },
  { id: '5', english: 'Coherent', uzbek: 'Mantiqiy', phonetic: '/kəʊˈhɪə.rənt/', example: 'She failed to give a coherent account of the events.' },
];

const MOCK_CATEGORIES: Category[] = [
  { id: '1', title: 'Sayohat', description: 'Aeroport, mehmonxona va yo\'nalishlar', icon: 'Plane' },
  { id: '2', title: 'Biznes', description: 'Muzokaralar va uchrashuvlar', icon: 'Briefcase' },
  { id: '3', title: 'Kundalik', description: 'Salomlashish va suhbat', icon: 'Coffee' },
];

const MOCK_QUIZ: QuizQuestion[] = [
  { 
    id: '1', 
    question: '"Adventure" so\'zining o\'zbekcha tarjimasi nima?', 
    options: ['Sayohat', 'Sarguzasht', 'Oram', 'Qiziqish'], 
    correctAnswer: 'Sarguzasht' 
  },
  { 
    id: '2', 
    question: '"Always" so\'zining o\'zbekcha tarjimasi nima?', 
    options: ['Ba\'zan', 'Hech qachon', 'Har doim', 'Tezda'], 
    correctAnswer: 'Har doim' 
  },
  {
    id: '3',
    question: '"Beautiful" so\'zining antonimi nima?',
    options: ['Ugly', 'Pretty', 'Nice', 'Smart'],
    correctAnswer: 'Ugly'
  },
  {
    id: '4',
    question: '"Success" so\'zining o\'zbekcha ma\'nosi nima?',
    options: ['Omad', 'Muvaffaqiyat', 'G\'alaba', 'Harakat'],
    correctAnswer: 'Muvaffaqiyat'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'translate' | 'learn' | 'quiz' | 'grammar' | 'about'>('learn');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Caching mechanism
  const translationCache = React.useRef<Record<string, string>>({});
  const wordSearchCache = React.useRef<Record<string, Word>>({});
  const grammarCache = React.useRef<Record<string, string>>({});

  // Word Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundWord, setFoundWord] = useState<Word | null>(null);

  // Dynamic Words state
  const [dynamicWords, setDynamicWords] = useState<Word[]>([]);
  const [isGeneratingWords, setIsGeneratingWords] = useState(false);

  // Grammar state
  const [selectedGrammarTopic, setSelectedGrammarTopic] = useState<string | null>(null);
  const [grammarExplanation, setGrammarExplanation] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [grammarSearchQuery, setGrammarSearchQuery] = useState('');

  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTranslate = async () => {
    if (!inputText) return;
    
    const trimmed = inputText.trim().toLowerCase();
    if (translationCache.current[trimmed]) {
      setTranslatedText(translationCache.current[trimmed]);
      return;
    }

    setIsTranslating(true);
    const result = await translateText(inputText);
    setTranslatedText(result);
    translationCache.current[trimmed] = result;
    setIsTranslating(false);
  };

  const handleWordSearch = async () => {
    if (!searchQuery) return;
    
    const trimmed = searchQuery.trim().toLowerCase();
    if (wordSearchCache.current[trimmed]) {
      setFoundWord(wordSearchCache.current[trimmed]);
      return;
    }

    setIsSearching(true);
    setFoundWord(null);
    const details = await getWordDetails(searchQuery);
    if (details && details.uzbek) {
      const wordObj = {
        id: Date.now().toString(),
        english: searchQuery,
        uzbek: details.uzbek,
        phonetic: details.phonetic,
        example: details.example
      };
      setFoundWord(wordObj);
      wordSearchCache.current[trimmed] = wordObj;
    }
    setIsSearching(false);
  };

  const handleExplainGrammar = async (topic: string) => {
    if (!topic) return;
    setSelectedGrammarTopic(topic);
    
    const trimmed = topic.trim().toLowerCase();
    if (grammarCache.current[trimmed]) {
      setGrammarExplanation(grammarCache.current[trimmed]);
      return;
    }

    setIsExplaining(true);
    setGrammarExplanation('');
    const explanation = await explainGrammar(topic);
    setGrammarExplanation(explanation);
    grammarCache.current[trimmed] = explanation;
    setIsExplaining(false);
  };

  const handleLoadMoreWords = async () => {
    setIsGeneratingWords(true);
    const newWords = await generateRandomWords();
    setDynamicWords(prev => [...prev, ...newWords]);
    setIsGeneratingWords(false);
  };

  useEffect(() => {
    // Initial pre-load of dynamic words for perceived speed
    if (dynamicWords.length === 0) {
      handleLoadMoreWords();
    }
  }, []);

  const handleQuizAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    if (answer === MOCK_QUIZ[currentQuizIndex].correctAnswer) {
      setQuizScore(quizScore + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuizIndex + 1 < MOCK_QUIZ.length) {
      setCurrentQuizIndex(currentQuizIndex + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setSelectedAnswer(null);
  };

  const NavButtons = () => (
    <>
      <button 
        onClick={() => { setActiveTab('learn'); setIsMobileMenuOpen(false); }}
        className={`text-left text-[14px] tracking-[1px] uppercase py-2 transition-colors ${activeTab === 'learn' ? 'text-[#E2B87E]' : 'text-[#666] hover:text-[#E0E0E0]'}`}
      >
        Learn
      </button>
      <button 
        onClick={() => { setActiveTab('translate'); setIsMobileMenuOpen(false); }}
        className={`text-left text-[14px] tracking-[1px] uppercase py-2 transition-colors ${activeTab === 'translate' ? 'text-[#E2B87E]' : 'text-[#666] hover:text-[#E0E0E0]'}`}
      >
        Translator
      </button>
      <button 
        onClick={() => { setActiveTab('grammar'); setIsMobileMenuOpen(false); }}
        className={`text-left text-[14px] tracking-[1px] uppercase py-2 transition-colors ${activeTab === 'grammar' ? 'text-[#E2B87E]' : 'text-[#666] hover:text-[#E0E0E0]'}`}
      >
        Grammar
      </button>
      <button 
        onClick={() => { setActiveTab('quiz'); setIsMobileMenuOpen(false); }}
        className={`text-left text-[14px] tracking-[1px] uppercase py-2 transition-colors ${activeTab === 'quiz' ? 'text-[#E2B87E]' : 'text-[#666] hover:text-[#E0E0E0]'}`}
      >
        Quiz
      </button>
      <button 
        onClick={() => { setActiveTab('about'); setIsMobileMenuOpen(false); }}
        className={`text-left text-[14px] tracking-[1px] uppercase py-2 transition-colors ${activeTab === 'about' ? 'text-[#E2B87E]' : 'text-[#666] hover:text-[#E0E0E0]'}`}
      >
        About
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-[#E0E0E0] font-sans relative overflow-x-hidden">
      {/* Mobile Header Overlay */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111111]/80 backdrop-blur-md border-b border-[#222] p-6 flex items-center justify-between">
        <div className="text-[10px] tracking-[3px] uppercase text-[#888] font-bold">
          IRODA USTOZ AI
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-5 h-5 text-[#888]" /> : <Menu className="w-5 h-5 text-[#888]" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="md:hidden fixed inset-0 z-40 bg-[#111111] p-12 pt-24 space-y-8 flex flex-col"
          >
            <NavButtons />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation (Desktop) */}
      <aside className="w-[280px] bg-[#111111] border-r border-[#222] p-10 flex flex-col justify-between sticky top-0 h-screen hidden md:flex shrink-0">
        <div className="top-part">
          <div className="text-[12px] tracking-[4px] uppercase text-[#888] font-bold mb-16">
            IRODA USTOZ AI
          </div>
          <nav className="flex flex-col gap-4">
            <NavButtons />
          </nav>
        </div>
        <div className="bottom-part">
          <div className="text-[11px] text-[#333] uppercase tracking-[1px]">
            System Protocol 4.0.2
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-16 flex flex-col min-w-0 pt-24 md:pt-16">
        <header className="mb-12 md:mb-20">
          <div className="text-[12px] uppercase tracking-[3px] text-[#E2B87E] mb-3">
            {activeTab === 'learn' ? 'Vocabulary Builder' : activeTab === 'translate' ? 'AI Processing' : activeTab === 'grammar' ? 'Grammar Masterclass' : activeTab === 'about' ? 'The Visionary' : 'Knowledge Test'}
          </div>
          <h1 className="text-[52px] md:text-[82px] font-extralight tracking-[-2px] text-white leading-[0.9] m-0">
            {activeTab === 'learn' ? 'Learn.' : activeTab === 'translate' ? 'Speak.' : activeTab === 'grammar' ? 'Rules.' : activeTab === 'about' ? 'Iroda.' : 'Prove.'}
          </h1>
        </header>

        {/* Content Tabs */}
        <AnimatePresence mode="wait">
          {activeTab === 'about' && (
            <motion.section 
              key="about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl space-y-16 pb-20"
            >
              <div className="elegant-card p-12 bg-[#111] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Lightbulb className="w-32 h-32 text-[#E2B87E]" />
                </div>
                <div className="micro-label mb-8 text-[#E2B87E]">Iroda Ustoz haqida sher</div>
                <div className="space-y-6">
                  <p className="text-[28px] md:text-[36px] font-extralight italic text-white leading-relaxed">
                    "Bilim cho'qqisiga eltuvchi yo'lda,<br />
                    Iroda sabog'i bo'lsin har qo'lda.<br />
                    Har bir darsga kirib, beradi ta'lim,<br />
                    9 oy ichida o'zgarar olam."
                  </p>
                </div>
                <div className="accent-line mt-12 w-24"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="micro-label">Missiya va Maqsad</div>
                  <h3 className="text-[24px] font-light text-white">Har bir darsda mukammallik sari</h3>
                  <p className="text-[16px] text-[#888] leading-relaxed">
                    Iroda Ustoz AI tomonidan taqdim etilayotgan ushbu darslar majmuasi 9 oylik mukammal o'quv dasturi asosida shakllantirilgan. 
                    Maqsadimiz - har bir talabaning darsda faol ishtirok etishini ta'minlash.
                  </p>
                  <p className="text-[16px] text-[#E2B87E] font-medium leading-relaxed italic">
                    "Iroda ustoz har bir darsga kirsin, bilimga tashna qalblarni nurli kelajak sari yetaklasin."
                  </p>
                </div>
                
                <div className="elegant-card p-10 flex flex-col justify-center border-dashed border-[#333]">
                  <div className="text-[42px] font-thin text-white mb-2">9 Oy.</div>
                  <div className="micro-label">Muvaffaqiyat davomiyligi</div>
                  <p className="mt-6 text-[14px] text-[#666]">
                    Noldan boshlab yuqori darajagacha bo'lgan yo'l, Iroda Ustoz AI hamrohligida bosib o'tiladi.
                  </p>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === 'grammar' && (
            <motion.section 
              key="grammar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12 pb-20"
            >
              <div className="max-w-xl">
                <div className="micro-label mb-6">Expert Guidance</div>
                <div className="elegant-card p-4 flex gap-4">
                  <input 
                    type="text" 
                    value={grammarSearchQuery}
                    onChange={(e) => setGrammarSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExplainGrammar(grammarSearchQuery)}
                    placeholder="Qaysi mavzuni tushuntirib beray?"
                    className="flex-1 bg-transparent border-none text-[18px] font-light focus:ring-0 p-4"
                  />
                  <button 
                    onClick={() => handleExplainGrammar(grammarSearchQuery)}
                    disabled={isExplaining || !grammarSearchQuery}
                    className="w-12 h-12 flex items-center justify-center bg-[#E2B87E] text-black hover:bg-white transition-all disabled:opacity-30 rounded-[2px]"
                  >
                    {isExplaining ? <RotateCcw className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="micro-label">Foundational Topics</div>
                  <div className="grid gap-4">
                    {MOCK_GRAMMAR_TOPICS.map((topic) => (
                      <button 
                        key={topic.id}
                        onClick={() => handleExplainGrammar(topic.title)}
                        className={`elegant-card p-8 text-left group transition-all ${selectedGrammarTopic === topic.title ? 'border-[#E2B87E] bg-[#111]' : ''}`}
                      >
                        <h4 className="text-[20px] font-light text-white mb-2">{topic.title}</h4>
                        <p className="text-[13px] text-[#444]">{topic.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="min-h-[400px]">
                  <AnimatePresence mode="wait">
                    {selectedGrammarTopic ? (
                      <motion.div 
                        key={selectedGrammarTopic}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="elegant-card p-10 bg-[#111] min-h-full"
                      >
                        <div className="micro-label mb-8 text-[#E2B87E]">Lesson: {selectedGrammarTopic}</div>
                        {isExplaining ? (
                          <div className="flex items-center gap-4 text-[#666]">
                            <RotateCcw className="w-5 h-5 animate-spin" />
                            <span>Iroda ustoz tushuntirmoqda...</span>
                          </div>
                        ) : (
                          <div className="prose prose-invert prose-sm max-w-none prose-headings:font-light prose-headings:text-white prose-p:text-[#E0E0E0] prose-li:text-[#E0E0E0] prose-strong:text-[#E2B87E]">
                            <ReactMarkdown>{grammarExplanation}</ReactMarkdown>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <div className="h-full border border-dashed border-[#222] rounded-[2px] flex items-center justify-center text-[#333] flex-col gap-4">
                        <BookOpen className="w-8 h-8 opacity-20" />
                        <span className="micro-label opacity-40">Mavzuni tanlang yoki qidiring</span>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === 'learn' && (
            <motion.section 
              key="learn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-16 md:space-y-20 pb-20"
            >
              {/* Intelligent Word Search */}
              <div className="max-w-xl">
                <div className="micro-label mb-6">Discovery Engine</div>
                <div className="elegant-card p-4 flex gap-4">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleWordSearch()}
                    placeholder="Search for any word..."
                    className="flex-1 bg-transparent border-none text-[18px] font-light focus:ring-0 p-4"
                  />
                  <button 
                    onClick={handleWordSearch}
                    disabled={isSearching || !searchQuery}
                    className="w-12 h-12 flex items-center justify-center bg-[#E2B87E] text-black hover:bg-white transition-all disabled:opacity-30 rounded-[2px]"
                  >
                    {isSearching ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>

                <AnimatePresence>
                  {foundWord && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 elegant-card p-10 bg-[#111] overflow-hidden"
                    >
                      <div className="text-[32px] font-light text-white mb-2">{foundWord.english}</div>
                      <div className="text-[13px] text-[#444] font-mono mb-6">{foundWord.phonetic}</div>
                      <div className="text-[#E2B87E] text-[18px] mb-8">{foundWord.uzbek}</div>
                      <div className="accent-line"></div>
                      <p className="mt-8 text-[14px] text-[#666] leading-relaxed italic">
                        "{foundWord.example}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between">
                <div className="micro-label">Database Status</div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[11px] text-[#555] font-mono">1000+ Words Active</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-8">
                  <div className="micro-label">Curated Selection</div>
                  <button 
                    onClick={handleLoadMoreWords}
                    disabled={isGeneratingWords}
                    className="text-[11px] text-[#E2B87E] border border-[#E2B87E]/20 px-4 py-1 hover:bg-[#E2B87E] hover:text-black transition-all flex items-center gap-2"
                  >
                    {isGeneratingWords ? <RotateCcw className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
                    Generate More Words
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {[...MOCK_WORDS, ...dynamicWords].map((word) => (
                    <div key={word.id} className="elegant-card p-10 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="card-title text-[#555] uppercase tracking-[2px] text-[11px]">Word of the day</div>
                        <Volume2 className="w-4 h-4 text-[#333] group-hover:text-[#E2B87E] transition-colors cursor-pointer" />
                      </div>
                      <div className="text-[32px] font-light text-white mb-2">{word.english}</div>
                      <div className="text-[13px] text-[#444] font-mono mb-6">{word.phonetic}</div>
                      <div className="text-[#E2B87E] text-[18px] mb-8">{word.uzbek}</div>
                      <div className="accent-line"></div>
                      <p className="mt-8 text-[14px] text-[#666] leading-relaxed italic line-clamp-2">
                        "{word.example}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="micro-label mb-8">Modules</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {MOCK_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="elegant-card p-8 cursor-pointer flex flex-col justify-between group">
                      <div>
                        <div className="flex items-center justify-between mb-8">
                          {React.createElement(ICON_MAP[cat.icon] || BookOpen, { className: "w-6 h-6 text-[#333] group-hover:text-[#E2B87E] transition-colors" })}
                          <ChevronRight className="w-5 h-5 text-[#222] group-hover:text-[#E2B87E] transition-all" />
                        </div>
                        <h4 className="text-[20px] font-light text-white mb-2">{cat.title}</h4>
                        <p className="text-[13px] text-[#444]">{cat.description}</p>
                      </div>
                      <div className="accent-line mt-8"></div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === 'translate' && (
            <motion.section 
              key="translate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl space-y-12 pb-20"
            >
              <div className="space-y-6">
                <div className="elegant-card p-1">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="w-full h-48 bg-transparent border-none p-6 md:p-10 text-[20px] md:text-[24px] font-light focus:ring-0"
                  />
                  <div className="p-6 md:p-10 pt-0 flex justify-between items-center flex-wrap gap-4">
                    <span className="micro-label">Source: English / Target: Uzbek</span>
                    <button 
                      onClick={handleTranslate}
                      disabled={isTranslating || !inputText}
                      className="px-8 py-3 bg-[#E2B87E] text-black text-[12px] font-bold uppercase tracking-[2px] hover:bg-white transition-all disabled:opacity-30 flex items-center gap-3"
                    >
                      {isTranslating ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                      Execute
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {translatedText && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="elegant-card p-8 md:p-12 bg-[#111] border-[#E2B87E]/20"
                    >
                      <div className="micro-label mb-8 text-[#E2B87E]">Instructor's Interpretation</div>
                      <p className="text-[24px] md:text-[32px] font-light leading-snug text-white italic">
                        "{translatedText}"
                      </p>
                      <div className="accent-line mt-10"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          {activeTab === 'quiz' && (
            <motion.section 
              key="quiz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl pb-20"
            >
              {!quizFinished ? (
                <div className="space-y-12">
                  <div>
                    <div className="micro-label mb-4 text-[#E2B87E]">Sequence {currentQuizIndex + 1} of {MOCK_QUIZ.length}</div>
                    <h2 className="text-[28px] md:text-[32px] font-light text-white leading-tight">{MOCK_QUIZ[currentQuizIndex].question}</h2>
                  </div>

                  <div className="grid gap-4">
                    {MOCK_QUIZ[currentQuizIndex].options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleQuizAnswer(option)}
                        disabled={selectedAnswer !== null}
                        className={`p-6 md:p-8 text-left text-[14px] md:text-[16px] tracking-[1px] uppercase transition-all flex items-center justify-between border ${
                          selectedAnswer === option
                            ? option === MOCK_QUIZ[currentQuizIndex].correctAnswer
                              ? 'bg-[#1a2e1a] border-green-500/50 text-green-400'
                              : 'bg-[#2e1a1a] border-red-500/50 text-red-400'
                            : selectedAnswer !== null && option === MOCK_QUIZ[currentQuizIndex].correctAnswer
                            ? 'bg-[#1a2e1a] border-green-500/50 text-green-400'
                            : 'bg-[#161616] border-[#222] text-[#666] hover:border-[#E2B87E] hover:text-[#E0E0E0]'
                        }`}
                      >
                        {option}
                        {selectedAnswer === option && (
                          option === MOCK_QUIZ[currentQuizIndex].correctAnswer 
                          ? <CheckCircle2 className="w-5 h-5" /> 
                          : <XCircle className="w-5 h-5" />
                        )}
                        {selectedAnswer !== null && option === MOCK_QUIZ[currentQuizIndex].correctAnswer && selectedAnswer !== option && (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </button>
                    ))}
                  </div>

                  {selectedAnswer && (
                    <button 
                      onClick={nextQuestion}
                      className="w-full py-5 bg-white text-black font-bold uppercase tracking-[3px] text-[12px] hover:bg-[#E2B87E] transition-all"
                    >
                      Next Phase
                    </button>
                  )}
                </div>
              ) : (
                <div className="elegant-card p-10 md:p-16 text-center space-y-8 bg-[#111]">
                  <div className="micro-label text-[#E2B87E]">Assessment Complete</div>
                  <h2 className="text-[48px] md:text-[64px] font-extralight text-white leading-none">Result.</h2>
                  <p className="text-[18px] md:text-[20px] text-[#666] font-light tracking-[1px]">
                    Success Rate: <span className="text-white">{(quizScore / MOCK_QUIZ.length) * 100}%</span>
                  </p>
                  <div className="flex justify-center py-4">
                    <div className="accent-line w-20"></div>
                  </div>
                  <button 
                    onClick={resetQuiz}
                    className="px-8 md:px-12 py-4 border border-[#222] text-[#666] uppercase tracking-[2px] text-[12px] hover:border-[#E2B87E] hover:text-[#E2B87E] transition-all"
                  >
                    Restart Session
                  </button>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-10 right-16 text-[11px] text-[#333] uppercase tracking-[2px] hidden lg:block">
        &copy; 2026 Iroda Ustoz AI &bull; Virtual Mentor
      </footer>
    </div>
  );
}
