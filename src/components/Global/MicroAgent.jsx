import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '../../assets/images/locagora-avatar.png'

export default function MicroAgent() {
  const [isOpen, setIsOpen] = useState(false)
  const [messageVisible, setMessageVisible] = useState(false)
  
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')
  
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Show a greeting bubble after a short delay
    const timer = setTimeout(() => {
      setMessageVisible(true)
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const fetchLead = () => {
      const lead = localStorage.getItem('locafacil_lead')
      if (lead) {
        try {
          const parsed = JSON.parse(lead)
          setUserName(parsed.name.split(' ')[0])
        } catch (e) {
          // ignore malformed lead data
        }
      }
    }
    fetchLead()
    window.addEventListener('lead_captured', fetchLead)
    return () => window.removeEventListener('lead_captured', fetchLead)
  }, [])

  useEffect(() => {
    if (messages.length === 0 || (messages.length === 1 && userName && !messages[0].text.includes(userName))) {
      const greeting = userName 
        ? `Que bom que você está aqui, ${userName}! Me chamo Locagora. Eu agilizo seu processo de locação sem burocracia e sem caução. Qual seu principal objetivo com o carro hoje?`
        : `Que bom que você clicou! Me chamo Locagora. Eu agilizo seu processo de locação sem a burocracia que as outras locadoras pedem. Qual seu principal objetivo com o carro hoje?`
      setMessages([{ role: 'model', text: greeting }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const promptText = `
Você é a Locagora, a assistente virtual especialista e amigável da Locafacil. 
A Locafacil aluga carros e motos no Rio de Janeiro sem caução, sem cartão de crédito, com todos os seguros inclusos e dobro de franquia de quilometragem.
O nome do usuário é ${userName || 'Cliente'}.
Responda de forma curta, prestativa e persuasiva. 
Seja gentil. 
Sempre recomende o botão de WhatsApp ao final de uma explicação para finalizar a contratação com um consultor humano.
Não invente preços exatos ou detalhes se não souber, apenas promova os benefícios.
`
      
      const chatHistory = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }))

      const payload = {
        systemInstruction: { parts: [{ text: promptText }] },
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: userMsg }] }
        ]
      }

      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=CHAVE-REMOVIDA-DO-HISTORICO', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Tive um problema na conexão. Pode me chamar no botão do WhatsApp logo abaixo para continuarmos?"
      
      setMessages(prev => [...prev, { role: 'model', text: aiReply }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Ocorreu um erro de conexão. Pode me chamar no botão do WhatsApp!" }])
    } finally {
      setLoading(false)
    }
  }

  const initialBubbleText = userName 
    ? `Olá, ${userName}! Vi que você está olhando nossos carros. Quer ajuda para achar o plano ideal sem caução?`
    : `Olá! Vi que você está olhando nossos carros. Quer ajuda para achar o plano ideal sem caução?`

  return (
    <div className="fixed bottom-6 right-6 z-[9990] flex flex-col items-end">
      <AnimatePresence>
        {messageVisible && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="bg-white text-text-dark text-sm p-4 rounded-2xl shadow-xl mb-4 relative max-w-[250px] border border-slate-100"
          >
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white rotate-45 border-r border-b border-slate-100" />
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <strong className="text-brand-accent font-bold">Locagora</strong>
            </div>
            {initialBubbleText}
            <div className="mt-3 flex gap-2">
              <button 
                onClick={() => setIsOpen(true)}
                className="flex-1 bg-brand-accent text-white text-xs font-bold py-2 rounded-lg hover:bg-brand-glow transition-colors cursor-pointer"
              >
                Sim, por favor
              </button>
              <button 
                onClick={() => setMessageVisible(false)}
                className="w-8 flex items-center justify-center bg-slate-100 text-text-muted rounded-lg hover:bg-slate-200 transition-colors cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-white w-[300px] sm:w-[360px] rounded-3xl shadow-2xl overflow-hidden mb-4 border border-slate-100 flex flex-col h-[500px] max-h-[80vh]"
          >
            <div className="bg-brand-dark p-4 flex items-center gap-4 relative shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative">
                <img src={Avatar} alt="Locagora" className="w-12 h-12 rounded-full object-cover border-2 border-brand-accent" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-brand-dark" />
              </div>
              <div className="flex-1 z-10">
                <h4 className="text-white font-bold">Locagora</h4>
                <p className="text-text-secondary text-xs">Assistente Especialista</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors cursor-pointer z-10 p-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-4 bg-slate-50 flex-1 overflow-y-auto space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'model' && (
                    <img src={Avatar} alt="Locagora" className="w-8 h-8 rounded-full object-cover shadow-sm shrink-0" />
                  )}
                  <div className={`p-3 rounded-2xl shadow-sm text-sm border ${
                    msg.role === 'user' 
                      ? 'bg-brand-accent text-white rounded-tr-none border-brand-glow' 
                      : 'bg-white text-text-dark rounded-tl-none border-slate-100'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <img src={Avatar} alt="Locagora" className="w-8 h-8 rounded-full object-cover shadow-sm shrink-0" />
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-text-dark border border-slate-100 flex items-center gap-1">
                    <span className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2 mb-3">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-accent"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 bg-brand-accent text-white rounded-full flex items-center justify-center hover:bg-brand-glow disabled:opacity-50 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
              <a href="https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locagora!%20Vim%20pelo%20site." target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Finalizar no WhatsApp
                </motion.button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setIsOpen(true)
            setMessageVisible(false)
          }}
          className="w-16 h-16 rounded-full shadow-2xl relative cursor-pointer"
        >
          <div className="absolute inset-0 bg-brand-accent rounded-full animate-ping opacity-30" />
          <img src={Avatar} alt="Locagora Agent" className="w-full h-full rounded-full object-cover border-4 border-white relative z-10" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full z-20" />
        </motion.button>
      )}
    </div>
  )
}
