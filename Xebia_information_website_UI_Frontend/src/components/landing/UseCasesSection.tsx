import { motion } from "framer-motion";
import { Users, Code, Rocket } from "lucide-react";

const useCases = [
  {
    icon: Users,
    title: "HR & People Ops",
    description:
      "Answer policy questions, benefits inquiries, and HR processes 24/7",
    color: "primary",
  },
  {
    icon: Code,
    title: "Engineering Teams",
    description:
      "Tech stack guidance, coding standards, and tool documentation at fingertips",
    color: "accent",
  },
  {
    icon: Rocket,
    title: "Project Onboarding",
    description:
      "Ramp up new joiners 10x faster with instant project context",
    color: "primary",
  },
];

const UseCasesSection = () => {
  return (
    <section id="use-cases" className="section-padding">
      <div className="container-tight">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Built for Every Team
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From HR to engineering, Voice AI Studio adapts to your team's unique needs.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="card-bordered p-8 text-center group hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              <div
                className={`w-16 h-16 mx-auto rounded-2xl ${
                  useCase.color === "accent"
                    ? "bg-accent/10 group-hover:bg-accent/20"
                    : "bg-primary/10 group-hover:bg-primary/20"
                } flex items-center justify-center mb-6 transition-colors`}
              >
                <useCase.icon
                  className={`w-8 h-8 ${
                    useCase.color === "accent" ? "text-accent" : "text-primary"
                  }`}
                />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {useCase.title}
              </h3>
              <p className="text-muted-foreground">{useCase.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
