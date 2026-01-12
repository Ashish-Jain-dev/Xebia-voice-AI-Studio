import { motion } from "framer-motion";
import { Play, Mic, FileText, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

const conversation = [
  {
    type: "user",
    text: "What's the leave policy for parental leave?",
  },
  {
    type: "ai",
    text: "Xebia offers 26 weeks of paid parental leave for primary caregivers. Secondary caregivers receive 6 weeks of paid leave. Both policies include flexible return-to-work options.",
    source: "Employee Handbook (p. 12)",
  },
];

const DemoSection = () => {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying && visibleMessages < conversation.length) {
      const timer = setTimeout(() => {
        setVisibleMessages((prev) => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, visibleMessages]);

  const handlePlay = () => {
    setIsPlaying(true);
    setVisibleMessages(0);
    setTimeout(() => setVisibleMessages(1), 500);
  };

  return (
    <section className="section-padding bg-dark-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="container-tight relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
            See It In Action
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Watch how easy it is to get instant answers from your knowledge base.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-3xl bg-dark-800 p-6 md:p-8 shadow-2xl border border-dark-700 relative">
            {/* Browser Header */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-4 text-sm text-gray-400">HR Knowledge Agent</span>
            </div>

            {/* Conversation Area */}
            <div className="min-h-[280px] space-y-4 mb-6">
              {visibleMessages === 0 && !isPlaying && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <button
                    onClick={handlePlay}
                    className="w-20 h-20 rounded-full bg-gradient-hero flex items-center justify-center hover:scale-105 transition-transform shadow-glow"
                  >
                    <Play className="w-8 h-8 text-primary-foreground ml-1" />
                  </button>
                  <p className="mt-4 text-sm">Click to watch demo</p>
                </div>
              )}

              {conversation.slice(0, visibleMessages).map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.type === "user" ? (
                    <div className="bg-primary rounded-2xl rounded-br-md px-5 py-3 max-w-[80%]">
                      <p className="text-primary-foreground">{msg.text}</p>
                    </div>
                  ) : (
                    <div className="bg-dark-700 rounded-2xl rounded-bl-md px-5 py-4 max-w-[85%]">
                      <p className="text-gray-200 mb-3">{msg.text}</p>
                      <div className="flex items-center gap-2 text-sm text-accent">
                        <FileText className="w-4 h-4" />
                        <span>{msg.source}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-dark-700 rounded-full px-5 py-3 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">Ask a question...</span>
              </div>
              <button className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center pulse-glow">
                <Mic className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoSection;
