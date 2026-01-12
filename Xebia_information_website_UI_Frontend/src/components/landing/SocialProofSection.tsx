import { motion } from "framer-motion";
import { Users, MessageSquare, Target, Zap } from "lucide-react";

const stats = [
  {
    icon: Users,
    number: "1,000+",
    label: "Employees",
  },
  {
    icon: MessageSquare,
    number: "15,000+",
    label: "Questions Answered",
  },
  {
    icon: Target,
    number: "95%",
    label: "Accuracy Rate",
  },
  {
    icon: Zap,
    number: "3 sec",
    label: "Avg Response",
  },
];

const SocialProofSection = () => {
  return (
    <section className="py-16 border-b border-border">
      <div className="container-tight">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground text-sm font-medium mb-10"
        >
          Trusted by teams across Xebia
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card-bordered p-6 text-center group hover:border-primary/30"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                {stat.number}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
