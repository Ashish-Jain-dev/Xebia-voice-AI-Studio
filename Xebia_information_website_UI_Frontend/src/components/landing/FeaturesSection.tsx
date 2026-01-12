import { motion } from "framer-motion";
import { Mic, Target, Link, Grid3X3, BarChart3, Shield } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Voice-First Interface",
    description:
      "Speak naturally, get instant answers with AI-powered voice recognition",
  },
  {
    icon: Target,
    title: "Accurate Answers",
    description:
      "RAG-powered search ensures responses come from your actual documents",
  },
  {
    icon: Link,
    title: "Source Attribution",
    description:
      "Every answer shows exactly which document it came from for transparency",
  },
  {
    icon: Grid3X3,
    title: "Multi-Agent Platform",
    description:
      "Create unlimited specialized agents for different teams or use cases",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Track usage, popular questions, and measure impact with detailed dashboards",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Session-based knowledge with automatic cleanup. Your data stays private.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="section-padding bg-muted/30">
      <div className="container-tight">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need in One Platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make knowledge accessible to everyone.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card-gradient p-8 group hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
