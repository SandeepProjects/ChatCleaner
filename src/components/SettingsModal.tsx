import { useState } from 'react';
import { X, Key, Info } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('chat-cleaner-pro/client-gemini-key') || '';
  });

  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('chat-cleaner-pro/client-gemini-key', apiKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    localStorage.removeItem('chat-cleaner-pro/client-gemini-key');
    setApiKey('');
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="modal-backdrop modal-center" onClick={onClose}>
      <div className="dialog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">Settings</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close dialog" style={{ padding: 0, width: '32px' }}>
            <X size={20} />
          </button>
        </div>

        <div>
          <label 
            style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 600, 
              marginBottom: '8px',
              color: 'var(--foreground)'
            }}
          >
            Gemini API Key
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '12px', color: 'var(--muted-foreground)', display: 'flex' }}>
              <Key size={16} />
            </span>
            <input 
              type="password"
              className="textarea-input"
              style={{ 
                minHeight: '40px', 
                height: '40px', 
                paddingLeft: '38px',
                paddingTop: '8px',
                paddingBottom: '8px',
                borderRadius: 'var(--radius-md)'
              }}
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <p 
            style={{ 
              fontSize: '0.75rem', 
              color: 'var(--muted-foreground)', 
              marginTop: '8px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              lineHeight: '1.4'
            }}
          >
            <Info size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }} />
            <span>
              If provided, all requests will use your own API key and run directly via Google's server. Your key is stored locally in your browser and never shared with other servers.
              Get a key for free from the <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Google AI Studio</a>.
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
          {apiKey && (
            <button className="btn btn-outline" onClick={handleClear}>
              Clear key
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave} style={{ minWidth: '80px' }}>
            {saved ? 'Saved!' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
