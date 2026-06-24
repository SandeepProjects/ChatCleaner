import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Trash2, Copy, Download, Settings, Info, 
  ChevronDown, ArrowRight, ScrollText, Check, AlertCircle, Share2
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ThemeToggle from './components/ThemeToggle';
import SettingsModal from './components/SettingsModal';
import { EXAMPLES } from './lib/examples';
import { renderMarkdown } from './lib/markdown';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface CleanResult {
  originalPrompt: string;
  cleanResponse: string;
  platform: string;
  turns: ChatTurn[];
}

export default function App() {
  // App navigation view state: 'tool' | 'about' | 'privacy' | 'terms' | 'faq'
  const [view, setView] = useState<'tool' | 'about' | 'privacy' | 'terms' | 'faq'>('tool');
  
  // Modals & Panels
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Chat cleaning states
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CleanResult | null>(null);
  
  // Toggles
  const [showRaw, setShowRaw] = useState(false);
  const [isMultiTurn, setIsMultiTurn] = useState(false);
  
  // Custom Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  

  
  // Action state trackers for checkmarks (e.g. "Copied!")
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedFullChat, setCopiedFullChat] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // FAQ Expand state
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Listen to keyboard shortcuts and Esc key
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Keyboard shortcut submit handler
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (rawText.trim() && rawText.length <= 200000 && !isLoading) {
        handleClean();
      } else if (!rawText.trim()) {
        showToast('Paste a conversation first', 'error');
      }
    }
  };

  // Run the cleaning API or local fallback
  const handleClean = async () => {
    if (!rawText.trim()) {
      showToast('Paste a conversation first', 'error');
      return;
    }

    if (rawText.length > 200000) {
      showToast('Too long — max 200,000 characters', 'error');
      return;
    }

    setIsLoading(true);
    setResult(null);

    const clientKey = localStorage.getItem('chat-clean-pro/client-gemini-key') || '';

    // If client has their own key, run Gemini directly from the browser (100% serverless!)
    if (clientKey) {
      try {
        const genAI = new GoogleGenerativeAI(clientKey);
        let modelName = 'gemini-2.5-flash';
        let resultText = '';

        const executeGeneration = async (modelToUse: string) => {
          const model = genAI.getGenerativeModel({
            model: modelToUse,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
            systemInstruction: `You are an expert assistant designed to clean up messy copies of AI chat conversations.
Your task is to take a copy-pasted conversation from an AI chatbot (such as ChatGPT, Claude, Perplexity, Grok, Gemini, DeepSeek, etc.) and extract the core conversation.

You must output ONLY a valid JSON object. Do not wrap the JSON in markdown code blocks like \`\`\`json. Output raw JSON.

The JSON object must have this structure:
{
  "originalPrompt": "The user's first prompt, cleaned of UI boilerplate like 'You:', 'You said:', timestamps, etc., but retaining code and markdown formatting.",
  "cleanResponse": "The assistant's response corresponding to that prompt, cleaned of UI boilerplate like 'ChatGPT:', 'Claude:', 'Copy code', source card listings, etc., but retaining standard markdown formatting (lists, tables, code blocks).",
  "platform": "One of: ChatGPT, Claude, Perplexity, Grok, Gemini, DeepSeek, Other",
  "turns": [
    {
      "role": "user" | "assistant",
      "content": "The cleaned message text"
    }
  ]
}

Instructions for turns:
- Extract all turns in the chat log if there are multiple exchanges (multi-turn mode).
- Ensure each turn's content is cleaned of UI scaffolding and user/assistant labels.
- The 'originalPrompt' should represent the first user message, and 'cleanResponse' should represent the first assistant response.
- If the chat has only one exchange, the turns array will contain exactly 2 items (1 user, 1 assistant).
`,
          });

          const response = await model.generateContent(rawText);
          return response.response.text();
        };

        try {
          resultText = await executeGeneration(modelName);
        } catch (modelError) {
          console.warn(`Error using ${modelName}, falling back to gemini-1.5-flash:`, modelError);
          modelName = 'gemini-1.5-flash';
          resultText = await executeGeneration(modelName);
        }

        if (!resultText) {
          throw new Error('Gemini API returned empty text');
        }

        let cleanJsonStr = resultText.trim();
        if (cleanJsonStr.startsWith('```')) {
          cleanJsonStr = cleanJsonStr.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
        }
        const data = JSON.parse(cleanJsonStr);

        // Standardize structure
        if (!data.originalPrompt || !data.cleanResponse) {
          data.originalPrompt = data.originalPrompt || 'Unable to extract prompt.';
          data.cleanResponse = data.cleanResponse || resultText;
        }
        if (!data.platform) data.platform = 'Other';
        if (!data.turns || !Array.isArray(data.turns)) {
          data.turns = [
            { role: 'user', content: data.originalPrompt },
            { role: 'assistant', content: data.cleanResponse }
          ];
        }

        setResult(data);
        if (data.turns && data.turns.length > 2) {
          setIsMultiTurn(true);
        } else {
          setIsMultiTurn(false);
        }
        
        showToast('Conversation cleaned with AI!', 'success');
        setIsLoading(false);
        return;
      } catch (err) {
        console.error('Client-side Gemini API call failed, falling back to local regex cleaner:', err);
        const fallbackResult = cleanLocallyWithRegex(rawText);
        setResult(fallbackResult);
        if (fallbackResult.turns.length > 2) {
          setIsMultiTurn(true);
        } else {
          setIsMultiTurn(false);
        }
        showToast('Cleaned using offline mode.', 'success');
        setIsLoading(false);
        return;
      }
    }

    // Default: Fallback to server call or offline cleaner
    try {
      const response = await fetch('/api/clean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: rawText })
      });

      const data = await response.json();

      if (!response.ok) {
        // If server lacks an API key or fails, fall back to offline parser seamlessly
        console.warn('Server API failed or lacks key, falling back to local regex cleaner:', data.error);
        const fallbackResult = cleanLocallyWithRegex(rawText);
        setResult(fallbackResult);
        if (fallbackResult.turns.length > 2) {
          setIsMultiTurn(true);
        } else {
          setIsMultiTurn(false);
        }
        showToast('Cleaned using offline mode.', 'success');
        setIsLoading(false);
        return;
      }

      setResult(data);
      // Auto-detect multi-turn
      if (data.turns && data.turns.length > 2) {
        setIsMultiTurn(true);
      } else {
        setIsMultiTurn(false);
      }
      
      showToast('Conversation cleaned with AI!', 'success');
    } catch (err) {
      console.warn('Network error, trying fallback regex cleaner', err);
      
      // Fallback regex cleaning
      const fallbackResult = cleanLocallyWithRegex(rawText);
      setResult(fallbackResult);
      if (fallbackResult.turns.length > 2) {
        setIsMultiTurn(true);
      } else {
        setIsMultiTurn(false);
      }
      showToast('Cleaned using offline mode.', 'success');
    } finally {
      setIsLoading(false);
    }
  };

  // Local regex-based parsing fallback
  const cleanLocallyWithRegex = (text: string): CleanResult => {
    const lines = text.split('\n');
    let originalPrompt = '';
    let cleanResponse = '';
    let platform = 'Other';
    let turns: ChatTurn[] = [];

    // 1. Detect platform based on content keywords and citations
    const textLower = text.toLowerCase();
    if (text.includes('[1]') || text.includes('[2]') || /\[\d+\]/.test(text) || (textLower.includes('searched') && textLower.includes('sources'))) {
      platform = 'Perplexity';
    } else if (textLower.includes('grok 2.0') || textLower.includes('grok')) {
      platform = 'Grok';
    } else if (textLower.includes('chatgpt') || textLower.includes('openai') || textLower.includes('gpt-4')) {
      platform = 'ChatGPT';
    } else if (textLower.includes('claude') || textLower.includes('anthropic')) {
      platform = 'Claude';
    } else if (textLower.includes('gemini') || textLower.includes('google ai')) {
      platform = 'Gemini';
    } else if (textLower.includes('deepseek')) {
      platform = 'DeepSeek';
    }

    // 2. Check for explicit speaker labels to parse multi-turn dialogue
    const explicitTurns: ChatTurn[] = [];
    let currentRole: 'user' | 'assistant' | null = null;
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trim = line.trim();

      const isUserMarker = 
        /^(you|user|me):?$/i.test(trim) || 
        /^you said:?$/i.test(trim) ||
        /^user:\s*$/i.test(trim);

      const isAIMarker = 
        /^(chatgpt|claude|perplexity|grok|gemini|deepseek|assistant|ai):?$/i.test(trim) ||
        /^assistant:\s*$/i.test(trim) ||
        /^(perplexity|chatgpt|claude|grok) said:?$/i.test(trim);

      if (isUserMarker) {
        if (currentRole && currentContent.length > 0) {
          explicitTurns.push({ role: currentRole, content: currentContent.join('\n').trim() });
        }
        currentRole = 'user';
        currentContent = [];
        continue;
      }

      if (isAIMarker) {
        if (currentRole && currentContent.length > 0) {
          explicitTurns.push({ role: currentRole, content: currentContent.join('\n').trim() });
        }
        currentRole = 'assistant';
        currentContent = [];
        continue;
      }

      // Skip common copy buttons and rating text in regular output
      if (/^(copy|regenerate|share|rewrite|copy code|was this response helpful|yes\s*\/\s*no|view sources|grok \d+\.\d+)/i.test(trim)) {
        continue;
      }

      if (currentRole) {
        currentContent.push(line);
      } else if (trim.length > 0 && explicitTurns.length === 0) {
        currentRole = 'user';
        currentContent.push(line);
      }
    }

    if (currentRole && currentContent.length > 0) {
      explicitTurns.push({ role: currentRole, content: currentContent.join('\n').trim() });
    }

    const hasMultipleTurns = explicitTurns.filter(t => t.role === 'user').length > 0 && 
                             explicitTurns.filter(t => t.role === 'assistant').length > 0;

    if (hasMultipleTurns) {
      turns = explicitTurns;
      const firstUser = turns.find(t => t.role === 'user');
      const firstAssistant = turns.find(t => t.role === 'assistant');
      originalPrompt = firstUser ? firstUser.content : '';
      cleanResponse = firstAssistant ? firstAssistant.content : '';
      
      return { originalPrompt, cleanResponse, platform, turns };
    }

    // 3. Fallback Heuristics for single-page selections (like Perplexity with no labels)
    let splitIndex = -1;

    // Heuristic A: Look for Perplexity's "Searched X sources" or "Sources" split point
    for (let i = 0; i < lines.length; i++) {
      const trim = lines[i].trim();
      if (/^searched \d+ sources/i.test(trim) || (/^sources\s*$/i.test(trim) && i < lines.length - 1 && lines[i+1].trim().startsWith('[1]'))) {
        splitIndex = i;
        break;
      }
    }

    // Heuristic B: Look for duplicated layout header (Format Repeat Split)
    if (splitIndex === -1) {
      const lineCount = lines.length;
      for (let i = 0; i < lineCount; i++) {
        const line1 = lines[i].trim();
        if (line1.length < 4) continue;

        // Matches header patterns (e.g. "A. Title", "1. Title", "### Title", or short uppercase bold lines)
        const isHeaderPattern = 
          /^[A-Z]\.\s+/i.test(line1) || 
          /^\d+\.\s+/.test(line1) || 
          /^#+\s+/.test(line1) ||
          (line1.length < 50 && line1.toUpperCase() === line1 && /[A-Z]/.test(line1));

        if (!isHeaderPattern) continue;

        // Search for the second occurrence of this exact header line
        for (let j = i + 2; j < lineCount; j++) {
          const line2 = lines[j].trim();
          if (line1 === line2) {
            // Confirm the second occurrence is followed by paragraph content (not another header)
            let hasContentAfter = false;
            for (let k = j + 1; k < Math.min(j + 5, lineCount); k++) {
              const nextLine = lines[k].trim();
              if (nextLine.length > 20 && !/^[A-Z]\.\s+/i.test(nextLine) && !/^\d+\.\s+/.test(nextLine) && !/^#/.test(nextLine)) {
                hasContentAfter = true;
                break;
              }
            }

            if (hasContentAfter) {
              splitIndex = j;
              break;
            }
          }
        }
        if (splitIndex !== -1) break;
      }
    }

    // Slice based on split index
    if (splitIndex !== -1) {
      originalPrompt = lines.slice(0, splitIndex).join('\n').trim();
      cleanResponse = lines.slice(splitIndex).join('\n').trim();
      
      // Strip initial speaker tags if present
      originalPrompt = originalPrompt.replace(/^(you|user|me):?\s*/i, '');
      
      // Clean up search logs or sources headers from start of response
      if (/^searched \d+ sources/i.test(cleanResponse.split('\n')[0].trim())) {
        const respLines = cleanResponse.split('\n');
        let skipCount = 1;
        while (skipCount < respLines.length && respLines[skipCount].trim() === '') {
          skipCount++;
        }
        cleanResponse = respLines.slice(skipCount).join('\n').trim();
      }

      turns = [
        { role: 'user', content: originalPrompt },
        { role: 'assistant', content: cleanResponse }
      ];
    } else {
      // General split in half if absolutely no markers could be found
      const half = Math.floor(lines.length / 2);
      originalPrompt = lines.slice(0, half).join('\n').trim();
      cleanResponse = lines.slice(half).join('\n').trim();
      turns = [
        { role: 'user', content: originalPrompt },
        { role: 'assistant', content: cleanResponse }
      ];
    }

    return {
      originalPrompt,
      cleanResponse,
      platform,
      turns
    };
  };

  const handleClear = () => {
    setRawText('');
    setResult(null);
    showToast('Cleared input & result', 'info');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleLoadExample = (example: typeof EXAMPLES[0]) => {
    setRawText(example.rawText);
    setResult(null);
    showToast(`Loaded ${example.name} example`, 'info');
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 50);
  };

  const handleCopy = (text: string, type: 'prompt' | 'response' | 'full' | 'share') => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!', 'success');
      if (type === 'prompt') {
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 1500);
      } else if (type === 'response') {
        setCopiedResponse(true);
        setTimeout(() => setCopiedResponse(false), 1500);
      } else if (type === 'full') {
        setCopiedFullChat(true);
        setTimeout(() => setCopiedFullChat(false), 1500);
      } else if (type === 'share') {
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 1500);
      }
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  };

  const generateMarkdownString = () => {
    if (!result) return '';
    let md = `# AI Conversation Transcript (${result.platform})\n\n`;
    if (isMultiTurn && result.turns && result.turns.length > 0) {
      result.turns.forEach((turn) => {
        const title = turn.role === 'user' ? 'User' : 'Assistant';
        md += `## ${title}\n\n${turn.content}\n\n---\n\n`;
      });
    } else {
      md += `## Original Prompt\n\n${result.originalPrompt}\n\n`;
      md += `## Clean Response\n\n${result.cleanResponse}\n`;
    }
    return md.trim();
  };

  const handleDownload = () => {
    const mdString = generateMarkdownString();
    if (!mdString) return;

    try {
      const blob = new Blob([mdString], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
      
      link.href = url;
      link.download = `cleaned-chat-${result?.platform.toLowerCase()}-${timestamp}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('Markdown downloaded!', 'success');
    } catch {
      showToast('Failed to download', 'error');
    }
  };

  return (
    <>
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <Check size={16} style={{ color: 'oklch(0.5 0.15 140)' }} />}
            {toast.type === 'error' && <AlertCircle size={16} style={{ color: 'var(--destructive)' }} />}
            {toast.type === 'info' && <Info size={16} style={{ color: 'var(--primary)' }} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />



      {/* Sticky Navbar */}
      <nav className="navbar">
        <div className="container navbar-inner">
          <div className="brand" onClick={() => setView('tool')}>
            <div className="brand-icon">
              <Sparkles size={16} fill="white" />
            </div>
            <span>Chat Cleaner <strong style={{ color: 'var(--primary-glow)', fontWeight: 800 }}>Pro</strong></span>
          </div>

          <div className="nav-actions">
            <button 
              className={`btn btn-ghost btn-sm ${view === 'tool' ? 'active' : ''}`}
              onClick={() => setView('tool')}
              style={{ fontWeight: view === 'tool' ? 600 : 400 }}
            >
              Tool
            </button>

            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ flex: 1, paddingBottom: '64px' }}>
        {view === 'tool' && (
          <div className="container">
            {/* Hero */}
            <header className="hero">
              <div className="badge badge-ai" style={{ gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}>
                <Sparkles size={12} fill="currentColor" /> Powered by AI
              </div>
              <h1 className="hero-h1">Clean any AI chat in one click</h1>
              <p className="hero-subtitle">
                Paste a messy transcript from ChatGPT, Claude, Perplexity, or Grok. We'll strip the UI boilerplate and deliver clean, shareable formatting.
              </p>
            </header>

            {/* Input Card */}
            <div className="card card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ScrollText size={18} style={{ color: 'var(--primary)' }} /> Paste Conversation
                </h2>
                {rawText.length > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={handleClear} style={{ color: 'var(--destructive)', gap: '4px' }}>
                    <Trash2 size={14} /> Clear
                  </button>
                )}
              </div>

              {/* Examples selection */}
              <div>
                <p className="examples-label">Try an example paste:</p>
                <div className="examples-grid">
                  {EXAMPLES.map(ex => (
                    <button 
                      key={ex.name} 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleLoadExample(ex)}
                      style={{ fontSize: '0.75rem', gap: '6px' }}
                    >
                      <Sparkles size={12} style={{ color: 'var(--primary-glow)' }} /> {ex.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="textarea-wrapper">
                <textarea
                  ref={textareaRef}
                  className="textarea-input"
                  placeholder="Paste messy chat log here. Example:&#10;You: Explain recursion.&#10;ChatGPT: Recursion is when a function calls itself...&#10;Copy code&#10;Regenerate"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <span className={`char-counter ${rawText.length > 200000 ? 'error' : ''}`}>
                  {rawText.length.toLocaleString()} / 200,000 characters
                </span>
                <button 
                  className="btn btn-primary"
                  onClick={handleClean}
                  disabled={isLoading || !rawText.trim() || rawText.length > 200000}
                  style={{ gap: '8px', minWidth: '160px' }}
                >
                  {isLoading ? (
                    <>
                      <div className="loader" style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      Clean & Extract <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Spinner loader state */}
            {isLoading && (
              <div className="fade-in" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 0',
                gap: '16px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>
                  Extracting prompts, format tables & removing UI artifacts...
                </p>
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}} />
              </div>
            )}

            {/* Result Area */}
            {result && !isLoading && (
              <section className="card fade-in" style={{ marginTop: '32px', overflow: 'hidden' }}>
                <div className="result-header">
                  <div className="result-header-left">
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                      Result
                    </h2>
                    <span className="badge badge-platform">
                      {result.platform}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleCopy(generateMarkdownString(), 'share')}
                      style={{ gap: '6px' }}
                    >
                      {copiedShare ? <Check size={14} /> : <Share2 size={14} />} 
                      {copiedShare ? 'Copied Link!' : 'Share'}
                    </button>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={handleDownload}
                      style={{ gap: '6px' }}
                    >
                      <Download size={14} /> Download .md
                    </button>
                  </div>
                </div>

                {/* Filtering controls */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 24px',
                  borderBottom: '1px solid var(--border)',
                  background: 'color-mix(in oklab, var(--card) 98%, var(--foreground))',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  {/* Single vs Multi-turn toggle (visible if turns > 2) */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className={`btn btn-ghost btn-sm`}
                      style={{
                        background: !isMultiTurn ? 'color-mix(in oklab, var(--primary) 10%, transparent)' : 'transparent',
                        color: !isMultiTurn ? 'var(--primary)' : 'var(--muted-foreground)',
                        fontWeight: !isMultiTurn ? 600 : 400
                      }}
                      onClick={() => setIsMultiTurn(false)}
                    >
                      Single Exchange
                    </button>
                    {result.turns && result.turns.length > 2 && (
                      <button 
                        className={`btn btn-ghost btn-sm`}
                        style={{
                          background: isMultiTurn ? 'color-mix(in oklab, var(--primary) 10%, transparent)' : 'transparent',
                          color: isMultiTurn ? 'var(--primary)' : 'var(--muted-foreground)',
                          fontWeight: isMultiTurn ? 600 : 400
                        }}
                        onClick={() => setIsMultiTurn(true)}
                      >
                        Full Dialogue ({Math.floor(result.turns.length / 2)} turns)
                      </button>
                    )}
                  </div>

                  {/* Rendered vs Raw toggle */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className={`btn btn-ghost btn-sm`}
                      style={{
                        background: !showRaw ? 'color-mix(in oklab, var(--primary) 10%, transparent)' : 'transparent',
                        color: !showRaw ? 'var(--primary)' : 'var(--muted-foreground)',
                        fontWeight: !showRaw ? 600 : 400
                      }}
                      onClick={() => setShowRaw(false)}
                    >
                      Formatted
                    </button>
                    <button 
                      className={`btn btn-ghost btn-sm`}
                      style={{
                        background: showRaw ? 'color-mix(in oklab, var(--primary) 10%, transparent)' : 'transparent',
                        color: showRaw ? 'var(--primary)' : 'var(--muted-foreground)',
                        fontWeight: showRaw ? 600 : 400
                      }}
                      onClick={() => setShowRaw(true)}
                    >
                      Raw MD
                    </button>
                  </div>
                </div>

                {/* Main Results Display */}
                {isMultiTurn && result.turns && result.turns.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', background: 'color-mix(in oklab, var(--background) 40%, transparent)' }}>
                    {/* Multi-turn display */}
                    {result.turns.map((turn, idx) => (
                      <div 
                        key={idx} 
                        style={{
                          borderBottom: idx === result.turns.length - 1 ? 'none' : '1px solid var(--border)',
                          backgroundColor: turn.role === 'user' 
                            ? 'transparent' 
                            : 'var(--card)'
                        }}
                      >
                        <div style={{
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 24px',
                          borderBottom: '1px solid var(--border)'
                        }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            textTransform: 'uppercase',
                            color: turn.role === 'user' ? 'var(--primary)' : 'var(--accent)'
                          }}>
                            {turn.role === 'user' ? 'Prompt / User' : `Response / ${result.platform}`}
                          </span>
                          <button 
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleCopy(turn.content, 'response')}
                            style={{ padding: 0, width: '28px', height: '28px' }}
                            title="Copy message"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <div className="result-body" style={{ maxHeight: 'none' }}>
                          {showRaw ? (
                            <pre className="result-body-raw">{turn.content}</pre>
                          ) : (
                            renderMarkdown(turn.content)
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--card)' }}>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => handleCopy(generateMarkdownString(), 'full')}
                        style={{ gap: '6px' }}
                      >
                        {copiedFullChat ? <Check size={14} /> : <Copy size={14} />}
                        {copiedFullChat ? 'Copied Dialogue!' : 'Copy Full Dialogue Markdown'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Single turn display */
                  <div>
                    {/* Prompt section */}
                    <div className="result-section">
                      <div className="result-section-header">
                        <div className="result-title">Original Prompt</div>
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleCopy(result.originalPrompt, 'prompt')}
                          style={{ gap: '6px' }}
                        >
                          {copiedPrompt ? <Check size={14} /> : <Copy size={14} />} 
                          {copiedPrompt ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="result-body">
                        {showRaw ? (
                          <pre className="result-body-raw">{result.originalPrompt}</pre>
                        ) : (
                          renderMarkdown(result.originalPrompt)
                        )}
                      </div>
                    </div>

                    {/* Response section */}
                    <div className="result-section">
                      <div className="result-section-header">
                        <div className="result-title">Clean Response</div>
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleCopy(result.cleanResponse, 'response')}
                          style={{ gap: '6px' }}
                        >
                          {copiedResponse ? <Check size={14} /> : <Copy size={14} />} 
                          {copiedResponse ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="result-body" style={{ maxHeight: '600px' }}>
                        {showRaw ? (
                          <pre className="result-body-raw">{result.cleanResponse}</pre>
                        ) : (
                          renderMarkdown(result.cleanResponse)
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* How It Works */}
            <section className="how-it-works">
              <h2 className="section-h2">How it works</h2>
              <div className="steps-grid">
                <div className="step-card card">
                  <div className="step-num">1</div>
                  <h3 className="step-title">Paste</h3>
                  <p className="step-desc">Copy your messy conversation transcript directly from any AI chat window and paste it here.</p>
                </div>
                <div className="step-card card">
                  <div className="step-num">2</div>
                  <h3 className="step-title">Clean</h3>
                  <p className="step-desc">Our lightweight parser strips timestamp flags, platform text, and styling wrappers automatically.</p>
                </div>
                <div className="step-card card">
                  <div className="step-num">3</div>
                  <h3 className="step-title">Export</h3>
                  <p className="step-desc">Copy formatting instantly or download a neatly-formatted Markdown (.md) file to import into other apps.</p>
                </div>
              </div>
            </section>

            {/* FAQ Accordion */}
            <section className="faq-section">
              <h2 className="section-h2">Frequently Asked Questions</h2>
              <div className="faq-list">
                {[
                  {
                    q: 'Does it store my conversation?',
                    a: 'No. Your conversations are processed either locally on the client or sent to the API endpoint for extraction. We do not store or keep any transcript copies on our server.'
                  },
                  {
                    q: 'Which AI platforms are supported?',
                    a: 'We support all major chatbots including ChatGPT, Claude, Perplexity, Grok, Gemini, and DeepSeek, as well as general text exchanges.'
                  },
                  {
                    q: 'Is it completely free?',
                    a: 'Yes. It is free with a basic hourly rate-limit. To bypass rate limits, you can enter your own API key directly under settings.'
                  },
                  {
                    q: 'Does it preserve code blocks and tables?',
                    a: 'Yes. Our clean LLM-based parsing and native markdown formatter ensure code files, indented scripts, and tables are fully maintained.'
                  },
                  {
                    q: 'Can I download the results?',
                    a: 'Yes. You can copy prompts and responses independently, or click "Download .md" to export the entire dialogue into a Markdown document.'
                  }
                ].map((faq, idx) => (
                  <div key={idx} className={`faq-item ${openFaqIdx === idx ? 'open' : ''}`}>
                    <button className="faq-trigger" onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}>
                      <span>{faq.q}</span>
                      <ChevronDown className="faq-trigger-icon" />
                    </button>
                    {openFaqIdx === idx && (
                      <div className="faq-content">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Secondary Views (About, Privacy, Terms) */}
        {view === 'about' && (
          <div className="legal-container card fade-in">
            <h1 className="hero-h1" style={{ fontSize: '2.5rem', textAlign: 'left', marginTop: 0 }}>About Chat Cleaner Pro</h1>
            <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
              Chat Cleaner Pro was built to remove the friction of sharing AI responses. Copy-pasting directly from chats usually carries unwanted UI tags, buttons, and system headers.
            </p>
            <p style={{ lineHeight: '1.8', marginBottom: '24px' }}>
              By parsing inputs using fine-tuned prompt engineering, our tool returns neat Markdown transcripts in one click.
            </p>
            <button className="btn btn-primary" onClick={() => setView('tool')}>
              Back to cleaning
            </button>
          </div>
        )}

        {view === 'privacy' && (
          <div className="legal-container card fade-in">
            <h1 className="hero-h1" style={{ fontSize: '2.5rem', textAlign: 'left', marginTop: 0 }}>Privacy Policy</h1>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '16px', fontSize: '0.85rem' }}>Effective date: June 25, 2026</p>
            <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
              <strong>Your privacy is our priority.</strong> Chat Cleaner Pro does not store your conversation logs. All texts are processed in-memory.
            </p>
            <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
              If you utilize a personal Gemini API Key, it is saved in your local storage on your own device and is only sent directly to Google APIs.
            </p>
            <p style={{ lineHeight: '1.8', marginBottom: '24px' }}>
              We do not track, catalog, or review user content.
            </p>
            <button className="btn btn-primary" onClick={() => setView('tool')}>
              Back to cleaning
            </button>
          </div>
        )}

        {view === 'terms' && (
          <div className="legal-container card fade-in">
            <h1 className="hero-h1" style={{ fontSize: '2.5rem', textAlign: 'left', marginTop: 0 }}>Terms of Service</h1>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '16px', fontSize: '0.85rem' }}>Effective date: June 25, 2026</p>
            <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
              Our service is provided on an "as-is" and "as-available" basis.
            </p>
            <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
              Please do not upload secrets, database credentials, or critical personal identifying information. You assume all responsibility for content cleaned using the service.
            </p>
            <p style={{ lineHeight: '1.8', marginBottom: '24px' }}>
              We reserve the right to limit access to protect the service infrastructure from abuse.
            </p>
            <button className="btn btn-primary" onClick={() => setView('tool')}>
              Back to cleaning
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <p>© {new Date().getFullYear()} Chat Cleaner Pro. All rights reserved.</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.8 }}>Built for fast, accurate conversation cleanup.</p>
          </div>
          <div className="footer-links">
            <a className="footer-link" onClick={() => setView('about')}>About</a>
            <a className="footer-link" onClick={() => setView('privacy')}>Privacy</a>
            <a className="footer-link" onClick={() => setView('terms')}>Terms</a>
          </div>
        </div>
      </footer>
    </>
  );
}
