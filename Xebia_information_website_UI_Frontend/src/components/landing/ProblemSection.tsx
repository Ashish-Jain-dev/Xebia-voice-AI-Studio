import { motion } from "framer-motion";
import { Files, Clock, Lock } from "lucide-react";

const problems = [
  {
    icon: Files,
    title: "Information Overload",
    description:
      "Employees waste 5+ hours/week searching for information in Confluence, Slack, and emails",
  },
  {
    icon: Clock,
    title: "Slow Onboarding",
    description:
      "New joiners take 2-3 weeks to become productive, asking same questions repeatedly",
  },
  {
    icon: Lock,
    title: "Knowledge Silos",
    description:
      "Critical information locked in people's heads and scattered documents",
  },
];

const ProblemSection = () => {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container-tight">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            The Knowledge Access Crisis
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every day, valuable time is lost to finding information that should be readily available.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="card-bordered p-8 bg-background group hover:shadow-lg hover:border-destructive/30 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 group-hover:bg-destructive/20 transition-colors">
                <problem.icon className="w-7 h-7 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {problem.title}
              </h3>
              <p className="text-muted-foreground">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
